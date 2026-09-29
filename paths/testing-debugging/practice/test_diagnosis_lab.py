import asyncio
import unittest
from diagnosis_lab import (inclusive_total_mutant, inclusive_total, collect_once,
                           repeated_scan, indexed_lookup, benchmark)


class DiagnosisTests(unittest.TestCase):
    def test_regression_distinguishes_mutant(self):
        self.assertEqual(inclusive_total([4, 8, 16], 1), 12)
        self.assertNotEqual(inclusive_total_mutant([4, 8, 16], 1), 12)

    def test_inclusive_boundaries(self):
        self.assertEqual(inclusive_total([4, 8, 16], 0), 4)
        self.assertEqual(inclusive_total([4, 8, 16], 2), 28)
        for stop in (-1, 3, True):
            with self.assertRaises(ValueError):
                inclusive_total([4, 8, 16], stop)

    def test_lookup_equivalence_and_missing(self):
        rows, wanted = [(0, 0), (1, 2), (2, 4)], [2, 3, 0, 2]
        self.assertEqual(repeated_scan(rows, wanted), [4, None, 0, 4])
        self.assertEqual(indexed_lookup(rows, wanted), [4, None, 0, 4])
        result = benchmark(size=10, queries=5, samples=3)
        self.assertEqual(set(result), {"repeated_scan", "indexed_lookup"})
        for measurement in result.values():
            self.assertEqual(len(measurement["samples_ns"]), 3)
            self.assertGreaterEqual(measurement["median_ns"], 0)


class CancellationTests(unittest.IsolatedAsyncioTestCase):
    async def test_cancel_after_acquisition_cleans_without_commit(self):
        started, release, events = asyncio.Event(), asyncio.Event(), []
        task = asyncio.create_task(collect_once(started, release, events))
        try:
            await asyncio.wait_for(started.wait(), 2)
            self.assertEqual(events, ["acquired"])
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await asyncio.wait_for(task, 2)
            self.assertTrue(task.cancelled())
            self.assertEqual(events, ["acquired", "released"])
        finally:
            if not task.done():
                task.cancel()
            await asyncio.gather(task, return_exceptions=True)

    async def test_normal_completion_cleans_once(self):
        started, release, events = asyncio.Event(), asyncio.Event(), []
        release.set()
        self.assertEqual(await asyncio.wait_for(collect_once(started, release, events), 2), 7)
        self.assertEqual(events, ["acquired", "committed", "released"])
