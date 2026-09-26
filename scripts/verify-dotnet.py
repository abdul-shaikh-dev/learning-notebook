"""Build the downloadable C# sources and run HTTP checks against a temporary host."""
import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import socket

parser = argparse.ArgumentParser()
parser.add_argument("--framework", default="net10.0")
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="notebook-dotnet-") as scratch:
    work = Path(scratch)
    for name, template, source in (("Foundation", "console", "foundation.cs"), ("Api", "web", "task-api.cs"), ("Acceptance", "console", "acceptance.cs")):
        subprocess.run(["dotnet", "new", template, "-n", name, "-f", args.framework, "--no-restore"], cwd=work, check=True)
        shutil.copyfile(root / "paths/dotnet/practice" / source, work / name / "Program.cs")
        subprocess.run(["dotnet", "build", name, "-c", "Release", "--nologo"], cwd=work, check=True)
    subprocess.run(["dotnet", str(work / "Foundation/bin/Release" / args.framework / "Foundation.dll")], check=True)
    # The host is test-only and loopback-bound. It is always stopped, including on failure.
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    address = f"http://127.0.0.1:{port}"
    with (work / "api.log").open("w+", encoding="utf-8") as log:
        host = subprocess.Popen(["dotnet", str(work / "Api/bin/Release" / args.framework / "Api.dll"), "--urls", address], stdout=log, stderr=subprocess.STDOUT)
        try:
            deadline = time.monotonic() + 30
            while True:
                if host.poll() is not None:
                    raise RuntimeError("API exited before readiness")
                try:
                    with urllib.request.urlopen(address + "/health", timeout=1) as response:
                        if response.status == 200:
                            break
                except (urllib.error.URLError, TimeoutError):
                    pass
                if time.monotonic() >= deadline:
                    raise TimeoutError("API did not become ready within 30 seconds")
                time.sleep(0.1)
            subprocess.run(["dotnet", str(work / "Acceptance/bin/Release" / args.framework / "Acceptance.dll"), address], check=True, timeout=60)
        except BaseException:
            log.flush()
            log.seek(0)
            print(log.read())
            raise
        finally:
            host.terminate()
            try:
                host.wait(timeout=10)
            except subprocess.TimeoutExpired:
                host.kill()
                host.wait()
