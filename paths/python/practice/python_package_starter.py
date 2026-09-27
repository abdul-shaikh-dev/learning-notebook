"""Generate a complete wheel exercise without nested download-name collisions."""
import argparse
from pathlib import Path

FILES = {
    "pyproject.toml": '''[build-system]
requires = ["setuptools==82.0.1"]
build-backend = "setuptools.build_meta"

[project]
name = "notebook-studylog-demo"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = []

[project.scripts]
studylog-demo = "studylog_demo:main"

[tool.setuptools.packages.find]
where = ["src"]

[tool.setuptools.package-data]
studylog_demo = ["sample.txt"]
''',
    "src/studylog_demo/__init__.py": '''import argparse
from importlib.resources import files

def main():
    parser = argparse.ArgumentParser(description="Installed study-log package exercise")
    parser.add_argument("--minutes", type=int, default=5)
    args = parser.parse_args()
    if args.minutes < 0:
        parser.error("minutes must be nonnegative")
    label = files("studylog_demo").joinpath("sample.txt").read_text().strip()
    print(f"{label}: {args.minutes} minutes")
''',
    "src/studylog_demo/sample.txt": "Study session\n",
}

def generate(destination):
    destination = Path(destination)
    if destination.exists() and any(destination.iterdir()):
        raise ValueError("destination must be empty")
    destination.mkdir(parents=True, exist_ok=True)
    for name, body in FILES.items():
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")
    return destination

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("destination", type=Path)
    generate(parser.parse_args().destination)
