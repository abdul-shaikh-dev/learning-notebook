import unittest
from provider_scaffold import request, evidence

class ScaffoldTests(unittest.TestCase):
    def test_strict_tool_contract(self):
        body = request("explicit-model-choice", "Read lesson one")
        tool = body["tools"][0]
        self.assertTrue(tool["strict"])
        self.assertFalse(tool["parameters"]["additionalProperties"])
        self.assertEqual(tool["parameters"]["required"], list(tool["parameters"]["properties"]))
        with self.assertRaises(ValueError):
            request("", "test")

    def test_cost_arithmetic_and_invalid_usage(self):
        row = evidence("fixture", "fake", {"input_tokens": 1000, "output_tokens": 500}, 2, 8, True)
        self.assertAlmostEqual(row["estimated_token_cost"], .006)
        for bad in (-1, True, 1.5):
            with self.assertRaises(ValueError):
                evidence("x", "fake", {"input_tokens": bad, "output_tokens": 0}, 2, 8, True)

if __name__ == "__main__":
    unittest.main()
