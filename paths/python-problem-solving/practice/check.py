"""Check trusted local Python exercises; process timeouts are not a security sandbox."""
import argparse
import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

BASE = Path(__file__).resolve().parent
TIMEOUT_SECONDS = 5


def short(value):
    text = repr(value)
    return text if len(text) <= 400 else text[:397] + "..."


def equivalent(actual, expected):
    # JSON scalar contracts are exact: 3.0 and True are not integer answers.
    if expected is None or type(expected) in (bool, int, float, str):
        return type(actual) is type(expected) and actual == expected
    if isinstance(expected, list):
        return isinstance(actual, list) and len(actual) == len(expected) and all(
            equivalent(a, b) for a, b in zip(actual, expected))
    if isinstance(expected, dict):
        return isinstance(actual, dict) and actual.keys() == expected.keys() and all(
            equivalent(actual[k], expected[k]) for k in expected)
    return actual == expected


def worker(module_path, job_path, result_path):
    result = {"code": 2, "error": "Worker did not finish loading the module"}
    try:
        job = json.loads(Path(job_path).read_text(encoding="utf-8"))
        module_path = Path(module_path)
        sys.path.insert(0, str(module_path.parent))
        spec = importlib.util.spec_from_file_location("learner_answers", module_path)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        function = getattr(module, job["function"], None)
        if not callable(function):
            raise ValueError("Missing callable: " + job["function"])
        checks = []
        for index, case in enumerate(job["cases"], 1):
            args = copy.deepcopy(case["args"])
            before = copy.deepcopy(args)
            entry = {"case": index, "input": short(before), "expected": short(case["expected"])}
            try:
                actual = function(*args)
                entry["actual"] = short(actual)
                entry["passed"] = bool(equivalent(actual, case["expected"]))
                if job.get("preserveInputs", False) and not equivalent(args, before):
                    entry["passed"] = False
                    entry["error"] = "Input arguments changed; this challenge requires preserving them"
            except BaseException as exc:
                entry.update(passed=False, error=type(exc).__name__ + ": " + str(exc)[:400])
            checks.append(entry)
        result = {"code": 0 if all(c["passed"] for c in checks) else 1, "checks": checks}
    except BaseException as exc:
        result = {"code": 2, "error": type(exc).__name__ + ": " + str(exc)[:400]}
    Path(result_path).write_text(json.dumps(result), encoding="utf-8")


def run_challenge(module_path, job, timeout=TIMEOUT_SECONDS):
    with tempfile.TemporaryDirectory(prefix="notebook-python-check-") as folder:
        job_path, result_path = Path(folder)/"job.json", Path(folder)/"result.json"
        job_path.write_text(json.dumps(job), encoding="utf-8")
        try:
            process = subprocess.run(
                [sys.executable, "-B", str(Path(__file__).resolve()), "--worker",
                 str(module_path), str(job_path), str(result_path)],
                stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL, timeout=timeout, check=False)
        except subprocess.TimeoutExpired:
            return {"code": 1, "error": f"Timed out after {timeout:g} seconds for this challenge"}
        if process.returncode != 0 or not result_path.is_file():
            return {"code": 1, "error": f"Worker exited without results (exit {process.returncode})"}
        try:
            result = json.loads(result_path.read_text(encoding="utf-8"))
            if result.get("code") not in (0, 1, 2):
                raise ValueError("Invalid result code")
            return result
        except (OSError, ValueError) as exc:
            return {"code": 1, "error": "Cannot read worker results: " + str(exc)[:400]}


def load_cases():
    data = json.loads((BASE/"cases.json").read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not data:
        raise ValueError("cases.json must be a nonempty object keyed by challenge ID")
    for id, job in data.items():
        if not isinstance(job, dict) or not isinstance(job.get("function"), str):
            raise ValueError(f"Invalid challenge definition: {id}")
        if not isinstance(job.get("cases"), list) or not job["cases"]:
            raise ValueError(f"Challenge {id} needs at least one case")
        if any(not isinstance(c, dict) or not isinstance(c.get("args"), list) or "expected" not in c for c in job["cases"]):
            raise ValueError(f"Invalid cases for {id}")
    return data


def main(argv=None):
    parser = argparse.ArgumentParser(description="Run trusted local exercise code. Five seconds per challenge; not a security sandbox. Learner print output is suppressed.")
    parser.add_argument("id", nargs="?", help="challenge ID from --list")
    parser.add_argument("--list", action="store_true", help="list available challenges")
    parser.add_argument("--all", action="store_true", help="check every challenge")
    parser.add_argument("--reference", action="store_true", help="explicitly check reference.py instead of your solutions.py")
    args = parser.parse_args(argv)
    if sum((args.id is not None, args.list, args.all)) != 1:
        parser.error("choose a challenge ID, --list, or --all")
    try:
        cases = load_cases()
    except (OSError, ValueError) as exc:
        print("Setup error:", exc, file=sys.stderr)
        return 2
    if args.list:
        for id, job in cases.items():
            print(f"{id}: {job.get('title', job['function'])}")
        return 0
    if args.id is not None and args.id not in cases:
        print(f"Unknown challenge: {args.id}. Use --list.", file=sys.stderr)
        return 2
    module_path = BASE/("reference.py" if args.reference else "solutions.py")
    if not module_path.is_file():
        print(f"Missing {module_path.name}. No other answer file will be used.", file=sys.stderr)
        return 2
    print(f"Checking {module_path.name}; {TIMEOUT_SECONDS}s budget per challenge. Print output is suppressed.")
    code = 0
    for id in cases if args.all else [args.id]:
        result = run_challenge(module_path, cases[id])
        code = max(code, result["code"])
        if "error" in result:
            print(f"FAIL {id}: {result['error']}")
            continue
        checks = result["checks"]
        passed = sum(c["passed"] for c in checks)
        print(f"{'PASS' if result['code'] == 0 else 'FAIL'} {id}: {passed}/{len(checks)} cases")
        for case in checks:
            if not case["passed"]:
                print(f"  Case {case['case']} args={case['input']}")
                print(f"    expected: {case['expected']}")
                print(f"    actual:   {case.get('actual', '<no return>')}")
                if "error" in case:
                    print(f"    error:    {case['error']}")
    return code


if __name__ == "__main__":
    if len(sys.argv) == 5 and sys.argv[1] == "--worker":
        worker(*sys.argv[2:])
    else:
        raise SystemExit(main())
