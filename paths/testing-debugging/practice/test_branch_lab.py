import unittest
from branch_subject import label


class PositiveOnly(unittest.TestCase):
    def test_positive(self):
        self.assertEqual(label(5), "active")


class BothDirections(unittest.TestCase):
    def test_zero(self):
        self.assertEqual(label(0), "empty")

    def test_positive(self):
        self.assertEqual(label(5), "active")
