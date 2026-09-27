"""Build and install locally; no network. Skips only unavailable pinned tooling."""
import importlib.metadata
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import venv
from python_package_starter import generate

class InstalledPackageTests(unittest.TestCase):
    def test_refuses_nonempty_destination(self):
        with tempfile.TemporaryDirectory() as scratch:
            generate(scratch)
            with self.assertRaises(ValueError):
                generate(scratch)

    def test_installed_wheel_outside_source(self):
        try:
            if importlib.metadata.version("setuptools") != "82.0.1":
                self.skipTest("requires pinned setuptools==82.0.1")
            importlib.metadata.version("build")
        except importlib.metadata.PackageNotFoundError:
            self.skipTest("requires build frontend and setuptools==82.0.1")
        with tempfile.TemporaryDirectory() as scratch:
            root = Path(scratch)
            project = generate(root / "project")
            outside = root / "outside"
            outside.mkdir()
            # Remove inherited module search paths before testing the installed wheel.
            env = dict(os.environ)
            env.pop("PYTHONPATH", None)
            env.pop("PYTHONHOME", None)
            env["PYTHONNOUSERSITE"] = "1"
            def run(args, cwd=outside):
                return subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True, timeout=60)
            built = subprocess.run([sys.executable, "-m", "build", "--wheel", "--no-isolation"], cwd=project, capture_output=True, text=True, timeout=60)
            self.assertEqual(built.returncode, 0, built.stdout + built.stderr)
            wheels = list((project / "dist").glob("*.whl"))
            self.assertEqual(len(wheels), 1)
            installed = root / "installed"
            venv.EnvBuilder(with_pip=True).create(installed)
            scripts = installed / ("Scripts" if os.name == "nt" else "bin")
            python = scripts / ("python.exe" if os.name == "nt" else "python")
            pip = run([str(python), "-m", "pip", "install", "--no-index", "--no-deps", str(wheels[0])])
            self.assertEqual(pip.returncode, 0, pip.stdout + pip.stderr)
            location = run([str(python), "-c", "import studylog_demo; print(studylog_demo.__file__)"])
            self.assertEqual(location.returncode, 0, location.stderr)
            self.assertTrue(Path(location.stdout.strip()).is_relative_to(installed))
            command = str(scripts / ("studylog-demo.exe" if os.name == "nt" else "studylog-demo"))
            good = run([command, "--minutes", "7"])
            self.assertEqual(good.returncode, 0, good.stderr)
            self.assertEqual(good.stdout.strip(), "Study session: 7 minutes")
            self.assertEqual(run([command, "--help"]).returncode, 0)
            bad = run([command, "--minutes", "-1"])
            self.assertEqual(bad.returncode, 2)
            self.assertIn("minutes must be nonnegative", bad.stderr)

if __name__ == "__main__":
    unittest.main()
