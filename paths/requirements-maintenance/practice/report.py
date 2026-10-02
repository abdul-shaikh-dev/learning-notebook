"""Reference implementation for a small, single-writer local report."""
import argparse
import csv
from dataclasses import dataclass
import json
import os
from pathlib import Path
import tempfile

STATUSES = ("open", "closed", "cancelled")

@dataclass(frozen=True)
class Ticket:
    id: str
    status: str
    minutes: int

def read_tickets(path):
    tickets, seen = [], set()
    with open(path, encoding="utf-8", newline="") as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != ["id", "status", "minutes"]:
            raise ValueError("header must be id,status,minutes")
        for row in reader:
            line = reader.line_num
            if None in row or any(v is None for v in row.values()):
                raise ValueError(f"row {line}: wrong field count")
            identifier, status, raw = row["id"], row["status"], row["minutes"]
            if not identifier.strip() or identifier != identifier.strip() or identifier in seen:
                raise ValueError(f"row {line}: id must be nonblank, unique and unpadded")
            if status not in STATUSES:
                raise ValueError(f"row {line}: unknown status")
            if not raw or not raw.isascii() or not raw.isdigit() or len(raw) > 4 or int(raw) > 1440:
                raise ValueError(f"row {line}: minutes must be 0..1440 using at most four ASCII digits")
            seen.add(identifier)
            tickets.append(Ticket(identifier, status, int(raw)))
    return tickets

def summarize(tickets, status=None):
    if status is not None and status not in STATUSES:
        raise ValueError("unknown status")
    selected = [t for t in tickets if status is None or t.status == status]
    return {"count": len(selected), "total_minutes": sum(t.minutes for t in selected)}

def write_report(destination, text, replace=os.replace):
    destination = Path(destination)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", newline="\n",
                dir=destination.parent, prefix=".report-", suffix=".tmp", delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(text + "\n")
        replace(temporary, destination)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)

def main(argv=None):
    parser = argparse.ArgumentParser(description="Summarize recorded ticket minutes.")
    parser.add_argument("input", type=Path)
    parser.add_argument("--status", choices=STATUSES)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    try:
        if args.output and args.input.resolve() == args.output.resolve():
            raise ValueError("output must differ from input")
        result = summarize(read_tickets(args.input), args.status)
        text = json.dumps(result)
        if args.output:
            write_report(args.output, text)
        else:
            print(text)
    except (ValueError, OSError, UnicodeError, csv.Error) as error:
        parser.error(str(error))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
