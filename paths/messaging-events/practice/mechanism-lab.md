# Optional mechanism lab

This extends the existing course exercise. Read the worked lesson first; run this
only when you want to inspect the actual mechanism. No extra form is required.

Requirements: Python 3.11+, optional Pika, and the isolated loopback RabbitMQ recipe below.

From the extracted practice folder:

```
python broker_ack_drill.py
```

Expected: PASS reports broker redelivery, one inbox row, balance=7 and a drained queue. No process-crash durability claim.

Read `broker_ack_drill.py` to follow the assertion sequence. An assertion failure is evidence
to investigate, not a prompt to weaken the expected outcome. Use the changed case
in the linked lesson to explain why the outcome follows.

## Cleanup and scope

The script allocates one random notebook-ack-* queue and deletes only that queue on cleanup. A 60-second unused-queue expiry is a fallback if the process loses its connection. Acknowledgement follows a committed local effect. The in-memory database survives only the connection loss, not a process exit. Real broker execution has not been performed on this authoring host.


## Optional disposable RabbitMQ setup (PowerShell)

Requires an already working Docker installation. This downloads a local broker
image and creates one named container; it does not provision a cloud service.
If notebook-broker-lab already exists, stop and inspect it; do not replace it.
Run from this practice folder. This local-only teaching password is not a secret.

```powershell
docker run --detach --rm --name notebook-broker-lab -p 127.0.0.1:5679:5672 -e RABBITMQ_DEFAULT_USER=notebook -e RABBITMQ_DEFAULT_PASS=notebook-local-only rabbitmq:4
docker exec notebook-broker-lab rabbitmq-diagnostics -q ping
python -m venv .broker-venv
.\.broker-venv\Scripts\python -m pip install "pika>=1.3,<2"
.\.broker-venv\Scripts\python broker_ack_drill.py
```

Run the diagnostic again after startup if it reports not ready; continue only
when it succeeds. The image tag and dependency range can move: record the actual
Docker image ID and `python -m pip show pika` version for your run. Do not expose
this port on a non-loopback interface. Stop only the container created above:

```powershell
docker stop notebook-broker-lab
```

The --rm container is removed when stopped. Keep or remove only your own
.broker-venv after inspection. The script uses fixed loopback port 5679 and the
dedicated teaching credentials; it does not accept arbitrary broker URLs.

## Primary references

Mechanism documentation checked 2026-10-02; execution evidence is separate.

- https://www.rabbitmq.com/docs/confirms
- https://pika.readthedocs.io/en/stable/modules/adapters/blocking.html
