import unittest
from capacity_calculator import (workload, mean_in_flight, retained_bytes, instance_count,
                                 backlog_after, drain_seconds, allowed_bad_requests)


class CapacityTests(unittest.TestCase):
    def test_daily_peak_units_and_scaling(self):
        base = workload(10000, 40, 8, 2000)
        self.assertEqual(base.requests_per_day, 400000)
        self.assertAlmostEqual(base.average_rps, 400000 / 86400)
        self.assertAlmostEqual(base.peak_rps, 37.037037037)
        self.assertAlmostEqual(base.peak_payload_bytes_per_second, 400000 / 86400 * 8 * 2000)
        self.assertEqual(workload(20000, 80, 8, 2000).peak_rps, base.peak_rps * 4)
        self.assertEqual(workload(0, 40, 8, 2000).peak_rps, 0)

    def test_mean_concurrency_and_storage(self):
        self.assertEqual(mean_in_flight(200, .25), 50)
        self.assertEqual(mean_in_flight(80, .4), 32)
        self.assertEqual(retained_bytes(200000, 500, 30, 1.5, 3),
                         {'raw_bytes': 3000000000, 'modeled_bytes': 13500000000})
        self.assertEqual(retained_bytes(200000, 500, 60)['raw_bytes'], 6000000000)

    def test_instance_rounding_and_failure_capacity(self):
        self.assertEqual(instance_count(370, 100, .7, 1), 7)
        self.assertEqual(instance_count(240, 80, .75, 1), 5)
        self.assertEqual(instance_count(241, 80, .75, 1), 6)
        self.assertEqual(instance_count(0, 80, .75, 0), 0)

    def test_burst_and_drain(self):
        self.assertEqual(backlog_after(0, 120, 100, 60), 1200)
        self.assertEqual(drain_seconds(1200, 80, 100), 60)
        self.assertEqual(backlog_after(1200, 80, 100, 60), 0)
        self.assertEqual(backlog_after(10, 0, 100, 60), 0)
        self.assertEqual(drain_seconds(900, 35, 50), 60)
        self.assertIsNone(drain_seconds(900, 50, 50))
        self.assertIsNone(drain_seconds(900, 51, 50))
        self.assertEqual(drain_seconds(0, 51, 50), 0)

    def test_request_budget(self):
        self.assertAlmostEqual(allowed_bad_requests(1000000, .999), 1000)
        self.assertAlmostEqual(allowed_bad_requests(200000, .995), 1000)
        self.assertEqual(allowed_bad_requests(100, 1), 0)

    def test_reject_nonfinite_negative_boolean_and_wrong_types(self):
        for bad in (-1, float('nan'), float('inf'), True, '10', None):
            with self.subTest(bad=bad):
                with self.assertRaises(ValueError):
                    mean_in_flight(bad, .2)
                with self.assertRaises(ValueError):
                    backlog_after(0, 1, bad, 1)

    def test_reject_invalid_domain_bounds(self):
        invalid = [
            lambda: workload(2.5, 40, 8, 2000),
            lambda: workload(10, 40, .5, 2000),
            lambda: retained_bytes(1, 1, 1, .5),
            lambda: retained_bytes(1, 1, 1, 1, 0),
            lambda: instance_count(10, 0, .7),
            lambda: instance_count(10, 1, 0),
            lambda: instance_count(10, 1, 1.1),
            lambda: instance_count(10, 1, .7, -1),
            lambda: allowed_bad_requests(100, 1.01),
            lambda: allowed_bad_requests(100, -.1),
        ]
        for operation in invalid:
            with self.assertRaises(ValueError):
                operation()


if __name__ == '__main__':
    unittest.main()
