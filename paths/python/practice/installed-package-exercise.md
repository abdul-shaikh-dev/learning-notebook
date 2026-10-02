# Exercise: prove that the installed package works

Use Python 3.11 or newer. `python_package_starter.py` generates a complete package with a src layout, a setuptools 82.0.1 build backend, a console entry point and a packaged text resource. Use a new empty destination:

```text
python python_package_starter.py <empty-project-directory>
```

Inspect the generated `pyproject.toml` and module. The CLI accepts nonnegative integer minutes. The setuptools pin makes the backend reproducible; record your Python and build frontend versions too.

From this practice directory run `python -m unittest -v test_installed_package.py`. The installation test requires the build frontend and the exact backend pin already installed. If missing, it reports a skip rather than downloading silently. To enable it, explicitly install `build==1.4.0` and `setuptools==82.0.1` in a disposable build environment, then run with that environment's Python. Dependency installation can access a package index; no package is published.

The test generates a project in a temporary directory, builds a wheel without build isolation or network resolution, installs it with `--no-index --no-deps` into a second clean virtual environment and changes to a directory outside the checkout. It asserts module location inside the installed environment, entry-point success, help, invalid-input exit status and packaged-resource access. It removes inherited Python search paths. Temporary environments are cleaned up afterward.

Extend the package with one validated record parser and rerun the same installed-wheel checks. Capture commands, tool versions and outputs. Passing source-checkout imports alone do not establish wheel correctness.

Source: [PyPA Packaging Python Projects](https://packaging.python.org/en/latest/tutorials/packaging-projects/), build-system and distribution archives, reviewed 2026-09-27.
