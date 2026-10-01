import unittest
from local_framework_lab import build_graph, citation_check, local_model, search_records

class GraphTests(unittest.TestCase):
    def run_graph(self,drafts,question='failed import'):
        self.calls=[]
        def source(state):
            self.calls.append(dict(state));return drafts[len(self.calls)-1]
        return build_graph(source).invoke({'question':question},{'recursion_limit':12})
    def test_no_evidence_never_calls_model(self):
        result=self.run_graph([],question='volcanoes')
        self.assertEqual(result['status'],'no_evidence');self.assertEqual(self.calls,[])
    def test_valid_first_answer_stops(self):
        result=self.run_graph(['Rollback [D1]'])
        self.assertEqual(result['status'],'citation_valid');self.assertEqual(result['attempts'],1)
    def test_bad_then_good(self):
        result=self.run_graph(['Wrong [D99]','Rollback [D1]'])
        self.assertEqual(result['attempts'],2);self.assertEqual(result['draft'],'Rollback [D1]')
    def test_two_failures_stop(self):
        result=self.run_graph(['Wrong [D99]','Still wrong [D99]'])
        self.assertEqual(result['status'],'rejected');self.assertEqual(len(self.calls),2)
    def test_citation_membership_does_not_prove_truth(self):
        self.assertTrue(citation_check('A failed import commits everything [D1]',{'D1':'Failed imports roll back.'}))
    def test_retrieval_and_remote_rejection(self):
        self.assertIn('D1',search_records('failed import'))
        with self.assertRaises(ValueError):local_model('https://example.com/v1','x')
        with self.assertRaises(ValueError):search_records(' ')
if __name__=='__main__':unittest.main()
