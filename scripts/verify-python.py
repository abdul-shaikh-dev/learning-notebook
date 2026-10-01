"""Run downloadable Python suites in isolation, without modifying course folders."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SUITES = (
    ("python-problem-solving/practice", "test_runner.py"),
    ("python-problem-solving/practice", "test_reference.py"),
    ("python/practice", "summary_checks.py"),
    ("data-structures-algorithms/practice", "test_method_selection.py"),
    ("design-patterns", "test_batch_export.py"),
    ("testing-debugging/practice", "cursor_checks.py"),
    ("git-team-workflows", "test_semantic_merge.py"),
    ("data-engineering/practice", "test_revision_lab.py"),
    ("agent-harnesses/practice", "owner_version_lab.py"),
    ("application-security", "login_flow_lab.py"),
    ("financial-foundations/practice", "test_valuation_transfer.py"),
    ("networking-web/practice", "tcp_framing.py"),
    ("delivery-operations/practice", "schema_coexistence.py"),
    ("observability-performance/practice", "trace_investigation.py"),
    ("linux-operating-systems/practice", "test_os_labs.py"),
    ("data-engineering/practice", "test_pipeline_lab.py"),
    ("messaging-events/practice", "test_event_lab.py"),
    ("cloud-infrastructure/practice", "test_infra_lab.py"),
    ("observability-performance/practice", "telemetry.test.py"),
    ("observability-performance/practice", "integration.test.py"),
    ("delivery-operations/practice", "test_distinct_artifact_drill.py"),
    ("testing-debugging/practice", "test_diagnosis_lab.py"),
    ("testing-debugging/practice", "test_branch_lab.py"),
    ("financial-foundations/practice", "test_swap_repricing.py"),
    ("python/practice", "test_io_failure_bridge.py"),
    ("data-structures-algorithms/practice", "test_advanced_oracles.py"),
    ("design-patterns", "test_refactoring.py"),
    ("system-design/practice", "test_booking_lab.py"),
    ("ai-agents", "test_provider_eval.py"),
    ("agent-harnesses/practice", "test_persisted_run_lab.py"),
    ("application-security", "test_security_http.py"),
    ("python/practice", "test_installed_package.py"),
    ("data-structures-algorithms/practice", "test_trees_graphs.py"),
    ("design-patterns", "test_collaboration.py"),
    ("python/practice", "test_async_failure_lab.py"),
    ("ai-agents", "test_provider_scaffold.py"),
    ("agent-harnesses/practice", "test_durable_state.py"),
    ("agent-harnesses/practice", "test_parser_properties.py"),
    ("financial-foundations/practice", "test_finance_workbook.py"),
    ("python/practice", "test_projects.py"),
    ("ai-agents", "test_workshop.py"),
    ("agent-harnesses/practice", "test_harness_workshop.py"),
    ("design-patterns", "test_workshop.py"),
    ("system-design/practice", "test_capacity_calculator.py"),
    ("git-team-workflows", "test_sandbox.py"),
    ("application-security", "test_security_lab.py"),
    ("testing-debugging/practice", "test_testing_labs.py"),
    ("networking-web/practice", "test_network_labs.py"),
    ("delivery-operations/practice", "test_release_app.py"),
    ("delivery-operations/practice", "test_release_tools.py"),
    ("kubernetes/practice", "test_release_app.py"),
    ("kubernetes/practice", "check_manifests.py"),
)

# Optional framework/server/cluster labs are intentionally not part of the
# standard-library suite. Their prerequisites and commands live in their kits.
DIRECT_SUITES = {"summary_checks.py", "cursor_checks.py", "tcp_framing.py", "schema_coexistence.py", "trace_investigation.py"}

with tempfile.TemporaryDirectory(prefix="notebook-python-") as scratch:
    for folder, suite in SUITES:
        target = Path(scratch) / folder
        shutil.copytree(ROOT / "paths" / folder, target, dirs_exist_ok=True)
        print(f"Checking {folder}", flush=True)
        command = [sys.executable, suite] if suite.endswith(".test.py") or suite in DIRECT_SUITES else [sys.executable, "-m", "unittest", "-v", suite]
        subprocess.run(command, cwd=target, check=True, timeout=90)
    target = Path(scratch) / "algorithms"
    shutil.copytree(ROOT / "paths/data-structures-algorithms/practice", target)
    for filename in ("algorithms.py", "advanced_algorithms.py"):
        subprocess.run([sys.executable, filename], cwd=target, check=True)
