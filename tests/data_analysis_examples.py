"""Run every Data analysis worked example and compare it with the output the lesson states."""
from pathlib import Path
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "paths" / "data-analysis-python"
MARKER = "# Output:"


def split(example, where):
    """Return the code and the stated output lines of one example."""
    lines = example.split("\n")
    if lines.count(MARKER) != 1:
        raise AssertionError(where + ": needs exactly one '# Output:' line")
    at = lines.index(MARKER)
    stated = lines[at + 1:]
    if not stated or any(line != "#" and not line.startswith("# ") for line in stated):
        raise AssertionError(where + ": every line after '# Output:' must be a '# ' comment")
    return "\n".join(lines[:at]).rstrip() + "\n", [line[2:] for line in stated]


def main():
    lessons = json.loads((COURSE / "path.json").read_text(encoding="utf-8"))["lessons"]
    failures, checked = [], 0
    with tempfile.TemporaryDirectory(prefix="notebook-analysis-examples-") as scratch:
        folder = Path(scratch) / "practice"
        shutil.copytree(COURSE / "practice", folder, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        env = dict(os.environ, MPLBACKEND="Agg", PYTHONIOENCODING="utf-8", PYTHONDONTWRITEBYTECODE="1")
        for lesson in lessons:
            examples = [s["example"] for s in lesson["sections"] if "example" in s]
            if not examples:
                failures.append(lesson["id"] + ": has no worked example")
            for number, example in enumerate(examples, 1):
                where = lesson["id"] + " example " + str(number)
                try:
                    code, stated = split(example, where)
                except AssertionError as error:
                    failures.append(str(error))
                    continue
                run = subprocess.run([sys.executable, "-c", code], cwd=folder, env=env,
                                     capture_output=True, text=True, encoding="utf-8", timeout=60)
                printed = [line.rstrip() for line in run.stdout.rstrip("\n").split("\n")]
                if run.returncode:
                    failures.append(where + ": exited " + str(run.returncode) + "\n" + run.stderr.strip())
                elif printed != [line.rstrip() for line in stated]:
                    failures.append(where + ": printed\n  " + "\n  ".join(printed)
                                    + "\nbut the lesson states\n  " + "\n  ".join(stated))
                checked += 1
    if failures:
        print("FAIL:\n" + "\n".join(failures))
        sys.exit(1)
    print("PASS: " + str(checked) + " Data analysis worked examples print the output their lessons state.")


if __name__ == "__main__":
    main()
