"""Intermediate reference: typed value objects, JSON file summary CLI.
Run: python intermediate_project.py --demo
Or: python intermediate_project.py sessions.json
Reads existing input; it never rewrites that file.
"""
import argparse
from dataclasses import dataclass
import json
import logging
from pathlib import Path
from tempfile import TemporaryDirectory

logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class Session:
    topic: str
    minutes: int
    def __post_init__(self):
        if not isinstance(self.topic, str) or not 1 <= len(self.topic.strip()) <= 80:
            raise ValueError("topic must contain 1 through 80 characters")
        if type(self.minutes) is not int or not 0 <= self.minutes <= 1440:
            raise ValueError("minutes must be an integer from 0 through 1440")
        object.__setattr__(self, "topic", self.topic.strip())

def parse_sessions(value: object) -> list[Session]:
    if type(value) is not list or len(value) > 1000:
        raise ValueError("expected at most 1000 records")
    result = []
    for row in value:
        if type(row) is not dict or set(row) != {"topic", "minutes"}:
            raise ValueError("expected topic and minutes fields")
        result.append(Session(row["topic"], row["minutes"]))
    return result

def load_sessions(path: Path) -> list[Session]:
    with path.open("rb") as stream:
        raw = stream.read(262145)
    if len(raw) > 262144:
        raise ValueError("input exceeds 256 KiB")
    return parse_sessions(json.loads(raw.decode("utf-8")))

def totals_by_topic(sessions: list[Session]) -> dict[str, int]:
    result: dict[str, int] = {}
    for session in sessions:
        result[session.topic] = result.get(session.topic, 0) + session.minutes
    return result

def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Summarize a validated study-log JSON array")
    parser.add_argument("input", type=Path, nargs="?")
    parser.add_argument("--demo", action="store_true")
    args = parser.parse_args(argv)
    if args.demo and args.input is not None:
        parser.error("choose --demo or input, not both")
    if not args.demo and args.input is None:
        parser.error("provide input or --demo")
    try:
        if args.demo:
            with TemporaryDirectory() as folder:
                path = Path(folder) / "sessions.json"
                path.write_text(json.dumps([{"topic":"Python","minutes":25},{"topic":"Python","minutes":15}]), encoding="utf-8")
                sessions = load_sessions(path)
        else:
            sessions = load_sessions(args.input)
        print(json.dumps(totals_by_topic(sessions), sort_keys=True))
        logger.info("summarized %d sessions", len(sessions))
        return 0
    except (OSError, ValueError) as error:
        logger.error("Cannot summarize: %s", error)
        return 1

if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")
    raise SystemExit(main())
