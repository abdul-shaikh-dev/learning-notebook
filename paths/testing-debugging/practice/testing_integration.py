"""Atomic batch reference for a trusted local single-writer destination."""
import json
import os
from pathlib import Path
import tempfile
from testing_foundation import parse_record, total_minutes

def import_batch(lines, destination, replace=os.replace):
    rows = []
    for index, line in enumerate(lines):
        if index >= 1000:
            raise ValueError("batch exceeds 1000 rows")
        rows.append(parse_record(line))
    if len({r["id"] for r in rows}) != len(rows):
        raise ValueError("duplicate record id")
    result = {"schema_version": 1, "records": rows, "total": total_minutes(rows)}
    destination = Path(destination)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=destination.parent, prefix="study-", suffix=".tmp", delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(result, handle, allow_nan=False)
            handle.flush()
            os.fsync(handle.fileno())
        replace(temporary, destination)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return result

if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as scratch:
        target = Path(scratch) / "report.json"
        print(import_batch(['{"id":"a","minutes":7}'], target)["total"])
