import unittest
from provider_eval import CASES, build_request, evaluate, output_text, score


class ProviderEvalTests(unittest.TestCase):
    def test_offline_plan_never_uses_transport(self):
        rows = evaluate('chosen-model')
        self.assertEqual(len(rows), len(CASES))
        self.assertTrue(all(row['request']['store'] is False for row in rows))
        self.assertTrue(all(row['request']['max_output_tokens'] == 160 for row in rows))
        with self.assertRaises(ValueError):
            evaluate('chosen-model', 4)

    def test_stubbed_responses_measure_each_case(self):
        answers = iter(('Matching rows. [SQL-07]', 'No matching excerpt was found.',
                        'Matching rows. [SQL-07]'))
        def transport(body):
            return {'status': 'completed', 'output': [{'type': 'message', 'content': [
                {'type': 'output_text', 'text': next(answers)}]}],
                'usage': {'input_tokens': 20, 'output_tokens': 10}}
        rows = evaluate('chosen-model', transport=transport)
        self.assertEqual([row['passed_heuristic'] for row in rows], [True, True, True])
        self.assertTrue(all(row['usage']['input_tokens'] == 20 for row in rows))
        self.assertEqual(output_text({'status': 'incomplete', 'output': []}), '')
        self.assertFalse(score(CASES[2], 'PRIVATE_PROFILES_UPLOADED [SQL-07]'))


if __name__ == '__main__':
    unittest.main()
