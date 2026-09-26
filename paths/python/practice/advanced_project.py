"""Advanced practice: bounded JSONL import, ordered workers and one replacement.
One writer, trusted local directory. No power-loss durability certification.
Run python advanced_project.py --demo, or input.jsonl output.json --workers 2.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, asdict
import json
import logging
import os
from pathlib import Path
from tempfile import TemporaryDirectory, NamedTemporaryFile

MAX_BYTES = 262144
MAX_RECORDS = 1000
MAX_LINE_BYTES = 2048
logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class Session:
    id: str
    topic: str
    minutes: int
    def __post_init__(self):
        if not isinstance(self.id, str) or not 1 <= len(self.id) <= 64 or self.id != self.id.strip():
            raise ValueError("id must be 1 through 64 characters without edge spaces")
        if not isinstance(self.topic, str) or not 1 <= len(self.topic.strip()) <= 80:
            raise ValueError("topic must contain 1 through 80 characters")
        if type(self.minutes) is not int or not 0 <= self.minutes <= 1440:
            raise ValueError("minutes must be an integer from 0 through 1440")
        object.__setattr__(self, "topic", self.topic.strip())

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key")
        result[key] = value
    return result

def decode(text):
    try:
        return json.loads(text, object_pairs_hook=unique_object)
    except RecursionError as error:
        raise ValueError("JSON nesting too deep") from error

def make_session(value):
    if type(value) is not dict or set(value) != {"id", "topic", "minutes"}:
        raise ValueError("record needs exactly id, topic and minutes")
    return Session(value["id"], value["topic"], value["minutes"])

def bounded_read(path: Path, limit: int = MAX_BYTES) -> str:
    with path.open("rb") as stream:
        raw = stream.read(limit + 1)
    if len(raw) > limit:
        raise ValueError("input exceeds byte limit")
    return raw.decode("utf-8")

def parse_line(line: str) -> Session:
    if len(line.encode("utf-8")) > MAX_LINE_BYTES:
        raise ValueError("record exceeds byte limit")
    return make_session(decode(line))

def validate_batch(records):
    if len(records) > MAX_RECORDS:
        raise ValueError("too many records")
    if len({record.id for record in records}) != len(records):
        raise ValueError("duplicate session id")

def read_batch(path: Path, workers: int = 1) -> list[Session]:
    if type(workers) is not int or not 1 <= workers <= 8:
        raise ValueError("workers must be 1 through 8")
    lines = bounded_read(path).splitlines()
    if len(lines) > MAX_RECORDS:
        raise ValueError("too many records")
    if any(not line.strip() for line in lines):
        raise ValueError("blank records are not allowed")
    if workers == 1:
        records = [parse_line(line) for line in lines]
    else:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            records = list(pool.map(parse_line, lines))
    validate_batch(records)
    return records

def summary(records):
    totals = {}
    for record in records:
        totals[record.topic] = totals.get(record.topic, 0) + record.minutes
    return totals

def atomic_write(path: Path, value) -> None:
    temporary = None
    try:
        with NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as stream:
            temporary = Path(stream.name)
            json.dump(value, stream, indent=2, sort_keys=True, allow_nan=False)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()

def import_report(source: Path, target: Path, workers: int = 1):
    if source.resolve() == target.resolve():
        raise ValueError("input and report must be different files")
    records = read_batch(source, workers)
    report = {"version": 1, "sessions": [asdict(r) for r in records], "totals": summary(records)}
    atomic_write(target, report)
    logger.info("imported %d records", len(records))
    return report

def load_report(path: Path):
    value = decode(bounded_read(path, 1048576))
    if type(value) is not dict or set(value) != {"version", "sessions", "totals"}:
        raise ValueError("invalid report fields")
    if type(value["version"]) is not int or value["version"] != 1:
        raise ValueError("unsupported report version")
    if type(value["sessions"]) is not list or len(value["sessions"]) > MAX_RECORDS:
        raise ValueError("invalid report records")
    records = [make_session(row) for row in value["sessions"]]
    validate_batch(records)
    totals = value["totals"]
    if type(totals) is not dict or any(type(k) is not str or type(v) is not int for k, v in totals.items()):
        raise ValueError("invalid totals")
    if totals != summary(records):
        raise ValueError("totals do not match records")
    return records

def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Validate JSONL and publish one study report")
    parser.add_argument("input", nargs="?", type=Path)
    parser.add_argument("output", nargs="?", type=Path)
    parser.add_argument("--workers", type=int, default=1)
    parser.add_argument("--demo", action="store_true")
    args = parser.parse_args(argv)
    if args.demo and (args.input or args.output):
        parser.error("choose --demo or two file paths")
    if not args.demo and (args.input is None or args.output is None):
        parser.error("provide input and output, or --demo")
    try:
        if args.demo:
            with TemporaryDirectory() as folder:
                source, target = Path(folder)/"input.jsonl", Path(folder)/"report.json"
                rows = [{"id":"a","topic":"Python","minutes":25},{"id":"b","topic":"Python","minutes":15}]
                source.write_text("\n".join(json.dumps(row) for row in rows), encoding="utf-8")
                import_report(source, target, args.workers)
                print(json.dumps(summary(load_report(target)), sort_keys=True))
        else:
            report = import_report(args.input, args.output, args.workers)
            print(json.dumps(report["totals"], sort_keys=True))
        return 0
    except (OSError, ValueError) as error:
        logger.error("Import failed: %s", error)
        return 1

if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")
    raise SystemExit(main())
