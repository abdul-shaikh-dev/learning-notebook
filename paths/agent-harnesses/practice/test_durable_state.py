import tempfile
import unittest
from pathlib import Path
from durable_state import StateStore, Conflict

class DurableTests(unittest.TestCase):
    def test_reopen_and_stale_writer_cas(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "state.sqlite"
            first, second = StateStore(path), StateStore(path)
            try:
                self.assertEqual(first.save("run", 0, {"used_steps": 2}), 1)
                self.assertEqual(second.load("run"), (1, {"used_steps": 2}))
                self.assertEqual(first.save("run", 1, {"used_steps": 3}), 2)
                with self.assertRaises(Conflict):
                    second.save("run", 1, {"used_steps": 0})
                with self.assertRaises(Conflict):
                    second.save("run", 0, {})
                first.close()
                first = StateStore(path)
                self.assertEqual(first.load("run"), (2, {"used_steps": 3}))
                with self.assertRaises(ValueError):
                    first.save("run", 2, {"invalid": float("nan")})
                self.assertEqual(first.load("run")[0], 2)
                first.db.execute("UPDATE checkpoints SET schema_version=99")
                first.db.commit()
                with self.assertRaises(ValueError):
                    first.load("run")
            finally:
                first.close()
                second.close()

if __name__ == "__main__":
    unittest.main()
