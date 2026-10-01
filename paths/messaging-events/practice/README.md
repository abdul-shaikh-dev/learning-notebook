# Messaging practice: local evidence first

Extract all flat files together. Requires Python 3.11+ and its bundled sqlite3; no pip packages, accounts, broker, network or real emails/payments. Commands from the extracted folder:

```text
python --version
python event_lab.py
python -m unittest -v test_event_lab.py
```

Expected demo: first=true, duplicate_applied=false, total=7, pending=0, retry action=retry and delay=2. Expected suite: 12 passing tests. Record your actual output/version; these are supplied reference results, not proof your learner extensions pass.

The lab makes real SQLite transactions on a temporary local file. It proves its outbox atomicity, durable inbox projection, stable identity handling, rollback and bounded retry classification. It is deliberately sequential: it has no real broker, distributed lease, replicated storage, transport acknowledgement, TLS, real account ACLs, timed retries or external effect. retry_decision returns a policy; it does not implement a scheduling service or persistent dead-letter queue.

The teaching envelope is strict: exactly id, job_id, type, version and value; unknown fields are rejected. version must be integer 1 (not boolean or float), identifiers/consumer names are 1-128 characters with no surrounding whitespace, type is ExportRequested, and value is a nonnegative signed-64-bit SQLite integer. retry_decision requires a real boolean transient flag. This is an explicit v1 parser contract; adding optional fields requires changing/tests for this parser, as the schema-evolution lesson explains. JSON identity canonicalization in this reference is Python-specific, not a universal cross-language signature format.

Read workbook.md for three projects and worked reasoning. Duplicate-suppression retains inbox rows indefinitely only for this tiny dataset. A real system needs a replay-aware retention policy. The projection adds synthetic values; it does not generate actual export files.

## Optional live broker extension

Choose RabbitMQ or a managed broker deliberately; follow its current official installation docs on your own disposable local environment. Do not use work/production credentials or a shared cluster. Create a uniquely named training queue and only synthetic payloads. Configure documented durable/persistent and acknowledgement options; prove what each actually protects. Capture connection loss before and after consumer commit, redelivery, unknown routing, denied publisher/consumer actions and restart evidence. Do not extrapolate a single-node restart into replicated-host-loss durability. Stop/delete only your training resources and verify no queued data remains. These experiments were not executed by this kit.

## Cleanup

Demo/test temporary databases are automatically removed. A learner-created persistent database must be closed before deleting its explicitly named training file. No script deletes arbitrary directories or operates a broker/cloud account.

## Optional mechanism extension

See [mechanism-lab.md](mechanism-lab.md) for `broker_ack_drill.py`: PASS reports broker redelivery, one inbox row, balance=7 and a drained queue. No process-crash durability claim.

Requirements: Python 3.11+, optional Pika, and the isolated loopback RabbitMQ recipe below.
