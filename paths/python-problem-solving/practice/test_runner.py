"""Independent runner fixtures; no learner/reference answers are modified."""
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("exercise_check", HERE/"check.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="notebook-runner-test-")
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        shutil.copyfile(HERE/"check.py", self.folder/"check.py")
        self.job = {"title": "Double", "function": "solve", "cases": [{"args": [3], "expected": 6}, {"args": [0], "expected": 0}]}
        (self.folder/"cases.json").write_text(json.dumps({"double": self.job}), encoding="utf-8")

    def module(self, code, name="solutions.py"):
        path = self.folder/name
        path.write_text(code, encoding="utf-8")
        return path

    def cli(self, *args):
        return subprocess.run([sys.executable, "-B", str(self.folder/"check.py"), *args], cwd=HERE, capture_output=True, text=True, timeout=15)

    def test_success_relative_paths_and_prints(self):
        self.module("def solve(n):\n print('not JSON')\n return n*2\n")
        result = self.cli("double")
        self.assertEqual(result.returncode, 0, result.stdout+result.stderr)
        self.assertIn("2/2 cases", result.stdout)
        self.assertNotIn("not JSON", result.stdout)

    def test_no_reference_fallback(self):
        self.module("def solve(n): return n*2\n", "reference.py")
        self.assertEqual(self.cli("double").returncode, 2)
        self.assertEqual(self.cli("double", "--reference").returncode, 0)

    def test_wrong_answer_and_not_implemented(self):
        for source, evidence in [("def solve(n): return -1\n", "actual:   -1"), ("def solve(n): raise NotImplementedError('Your turn')\n", "NotImplementedError")]:
            with self.subTest(source=source):
                self.module(source)
                result=self.cli("double")
                self.assertEqual(result.returncode, 1)
                self.assertIn(evidence,result.stdout)

    def test_syntax_missing_function_and_invalid_id(self):
        self.module("def broken(\n")
        result=self.cli("double")
        self.assertEqual(result.returncode,2)
        self.assertIn("SyntaxError",result.stdout)
        self.module("other = 4\n")
        self.assertEqual(self.cli("double").returncode,2)
        self.assertEqual(self.cli("unknown").returncode,2)

    def test_list_all_and_empty_cases(self):
        self.assertIn("double: Double", self.cli("--list").stdout)
        self.module("def solve(n): return n*2\n")
        self.assertEqual(self.cli("--all").returncode,0)
        (self.folder/"cases.json").write_text('{"empty":{"function":"solve","cases":[]}}',encoding="utf-8")
        self.assertEqual(self.cli("--all").returncode,2)

    def test_timeout_and_system_exit(self):
        path=self.module("def solve(n):\n while True: pass\n")
        result=runner.run_challenge(path,self.job,timeout=0.7)
        self.assertEqual(result["code"],1)
        self.assertIn("Timed out",result["error"])
        path=self.module("def solve(n): raise SystemExit(0)\n")
        result=runner.run_challenge(path,self.job)
        self.assertEqual(result["code"],1)
        self.assertIn("SystemExit",result["checks"][0]["error"])

    def test_optional_input_preservation_and_case_isolation(self):
        path=self.module("def solve(items):\n items.append(9)\n return len(items)\n")
        job={"function":"solve","preserveInputs":True,"cases":[{"args":[[1]],"expected":2},{"args":[[1]],"expected":2}]}
        result=runner.run_challenge(path,job)
        self.assertEqual(result["code"],1)
        self.assertTrue(all(c["actual"]=="2" for c in result["checks"]))
        self.assertIn("Input arguments changed",result["checks"][0]["error"])
        self.assertEqual(job["cases"][0]["args"],[[1]])
        job["preserveInputs"]=False
        self.assertEqual(runner.run_challenge(path,job)["code"],0)

    def test_scalar_return_types_are_exact(self):
        self.assertFalse(runner.equivalent(3.0, 3))
        self.assertFalse(runner.equivalent(3, 3.0))
        self.assertFalse(runner.equivalent([3.0], [3]))
        self.assertFalse(runner.equivalent({"n": 3.0}, {"n": 3}))
        self.assertTrue(runner.equivalent(3, 3))
        self.assertTrue(runner.equivalent(3.0, 3.0))
        path=self.module("def solve(n): return 3.0\n")
        result=runner.run_challenge(path,{"function":"solve","cases":[{"args":[3],"expected":3}]})
        self.assertEqual(result["code"],1)

    def test_boolean_is_not_integer_answer(self):
        path=self.module("def solve(n): return False\n")
        result=runner.run_challenge(path,{"function":"solve","cases":[{"args":[0],"expected":0}]})
        self.assertEqual(result["code"],1)


if __name__ == "__main__":
    unittest.main()
