"""Foundation reference: validated study records and topic totals."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory

def add_session(log, topic, minutes):
    if not isinstance(topic, str) or not topic.strip():
        raise ValueError("topic required")
    if type(minutes) is not int or minutes < 0:
        raise ValueError("minutes must be a nonnegative integer")
    log.append({"topic": topic.strip(), "minutes": minutes})

def totals_by_topic(log):
    totals = {}
    for row in log:
        totals[row["topic"]] = totals.get(row["topic"], 0) + row["minutes"]
    return totals

def demo():
    log = []
    add_session(log, "Python", 25)
    add_session(log, "Reading", 10)
    add_session(log, "Python", 15)
    with TemporaryDirectory() as folder:
        path = Path(folder) / "study.json"
        path.write_text(json.dumps(log), encoding="utf-8")
        restored = json.loads(path.read_text(encoding="utf-8"))
        print(totals_by_topic(restored))

if __name__ == "__main__":
    demo()
