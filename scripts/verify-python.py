"""Run downloadable Python suites in isolation, without modifying course folders."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SUITES = (
    ("python/practice", "test_projects.py"),
    ("ai-agents", "test_workshop.py"),
    ("agent-harnesses/practice", "test_harness_workshop.py"),
    ("design-patterns", "test_workshop.py"),
    ("system-design/practice", "test_capacity_calculator.py"),
)

with tempfile.TemporaryDirectory(prefix="notebook-python-") as scratch:
    for folder, suite in SUITES:
        target = Path(scratch) / folder
        shutil.copytree(ROOT / "paths" / folder, target)
        print(f"Checking {folder}", flush=True)
        subprocess.run([sys.executable, "-m", "unittest", "-v", suite], cwd=target, check=True)
    target = Path(scratch) / "algorithms"
    shutil.copytree(ROOT / "paths/data-structures-algorithms/practice", target)
    for filename in ("algorithms.py", "advanced_algorithms.py"):
        subprocess.run([sys.executable, filename], cwd=target, check=True)
