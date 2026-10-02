"""Deliberately flawed starter. Work on a copy; see CONTRACT.md."""
import csv
import json
import sys

def summarize_file(path):
    records = []
    with open(path, encoding="utf-8", newline="") as stream:
        for row in csv.DictReader(stream):
            minutes = int(row["minutes"])
            if minutes:  # Deliberate bug: zero-minute tickets disappear.
                records.append(minutes)
    return {"count": len(records), "total_minutes": sum(records)}

if __name__ == "__main__":
    print(json.dumps(summarize_file(sys.argv[1])))
