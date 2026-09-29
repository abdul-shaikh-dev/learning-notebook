"""Guided local I/O boundary: validate before replacing an existing report."""
import json
import os
import tempfile
from pathlib import Path

def save_report(source: Path, destination: Path) -> None:
    """Read a JSON list, count completed records, then atomically replace output."""
    rows = json.loads(source.read_text(encoding="utf-8"))
    if not isinstance(rows, list) or any(not isinstance(row, dict) or type(row.get("done")) is not bool for row in rows):
        raise ValueError("Expected a list of records with boolean done fields")
    payload = json.dumps({"completed": sum(row["done"] for row in rows)}) + "\n"
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=destination.parent,
                                         prefix=".report-", suffix=".tmp", delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(payload)
        os.replace(temporary, destination)
        temporary = None
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
