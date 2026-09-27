"""Optional deterministic generated cases; no third-party fuzz runner required."""
import random
import unittest
from harness_workshop import validate_action

class ParserProperties(unittest.TestCase):
    def test_extra_keys_and_invalid_text_never_validate(self):
        rng = random.Random(20260927)
        for index in range(200):
            text = "".join(rng.choice("abc123") for _ in range(rng.randint(1, 2000)))
            valid = {"kind": "final", "text": text}
            validate_action(valid)
            invalid = dict(valid, **{"unexpected_" + str(index): rng.randrange(100)})
            with self.assertRaises(ValueError):
                validate_action(invalid)
        for text in [None, True, 42, [], {}, "", " ", "x" * 2001]:
            with self.assertRaises(ValueError):
                validate_action({"kind": "final", "text": text})

if __name__ == "__main__":
    unittest.main()
