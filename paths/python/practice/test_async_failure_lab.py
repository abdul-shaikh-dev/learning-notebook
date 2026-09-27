import asyncio
import unittest
from async_failure_lab import failing_group, cancelled_group

class FailureTests(unittest.IsolatedAsyncioTestCase):
    async def test_child_failure_groups_error_and_waits_for_cleanup(self):
        events = []
        with self.assertRaises(ExceptionGroup) as caught:
            await asyncio.wait_for(failing_group(events), 2)
        self.assertEqual([type(e) for e in caught.exception.exceptions], [ValueError])
        self.assertEqual(str(caught.exception.exceptions[0]), "invalid batch")
        self.assertEqual(events, ["sibling-cancelled", "sibling-cleaned"])

    async def test_parent_cancellation_propagates_after_child_cleanup(self):
        events, started = [], asyncio.Event()
        task = asyncio.create_task(cancelled_group(started, events))
        await asyncio.wait_for(started.wait(), 2)
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await asyncio.wait_for(task, 2)
        self.assertTrue(task.cancelled())
        self.assertEqual(events, ["child-cleaned"])

if __name__ == "__main__":
    unittest.main()
