"""Local locked version store and redacted diagnostic events; no distributed claim."""
import threading

class Conflict(Exception):
    pass

class VersionStore:
    def __init__(self):
        self._lock = threading.Lock()
        self._version, self._minutes = 0, 0

    def read(self):
        with self._lock:
            return self._version, self._minutes

    def update(self, expected, minutes):
        if type(expected) is not int or type(minutes) is not int or expected < 0 or minutes < 0:
            raise ValueError("nonnegative integer version and minutes required")
        with self._lock:
            if expected != self._version:
                raise Conflict("stale version")
            self._version += 1
            self._minutes = minutes
            return self._version

def diagnostic_event(case_id, outcome, elapsed_ms):
    if outcome not in {"ok", "rejected", "conflict"} or type(elapsed_ms) is not int or elapsed_ms < 0:
        raise ValueError("invalid diagnostic event")
    # A synthetic case identifier only; never pass credentials or raw learner text.
    return {"case_id": case_id, "outcome": outcome, "elapsed_ms": elapsed_ms}

if __name__ == "__main__":
    store = VersionStore()
    store.update(0, 8)
    try:
        store.update(0, 9)
    except Conflict:
        print("stale edit rejected", store.read())
