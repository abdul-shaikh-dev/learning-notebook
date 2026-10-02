"""Run dependency-backed course tests in disposable extracted-kit equivalents."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SUITES = (("data-analysis-python", "test_analysis.py"),
          ("machine-learning-foundations", "test_ml_lab.py"))
with tempfile.TemporaryDirectory(prefix="notebook-science-") as scratch:
    for course, suite in SUITES:
        folder = Path(scratch) / course
        shutil.copytree(ROOT / "paths" / course / "practice", folder,
                        ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        subprocess.run([sys.executable, "-m", "unittest", "-v", suite], cwd=folder, check=True)
print("Data analysis and machine learning reference suites passed.")
