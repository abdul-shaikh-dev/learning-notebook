import unittest
from telemetry import percentile,summary,burn_rate
class AnalysisTests(unittest.TestCase):
 def test_nearest_rank(self):
  self.assertEqual(percentile([100,1,3,2,4],.95),100);self.assertEqual(percentile([100,1,3,2,4],.5),3)
 def test_does_not_mutate(self):
  data=[3,1,2];percentile(data,.5);self.assertEqual(data,[3,1,2])
 def test_invalid(self):
  for values,p in [([], .5),([1],0),([1],1.1),([-1],.5),([float("nan")],.5),([True],.5)]:
   with self.assertRaises(ValueError):percentile(values,p)
 def test_empty_is_unknown(self):self.assertIsNone(summary([])["good_fraction"])
 def test_good_boundary_and_failed_fast(self):
  result=summary([{"duration_ms":100,"status":200},{"duration_ms":1,"status":500},{"duration_ms":101,"status":200}],100)
  self.assertEqual(result["good"],1);self.assertEqual(result["bad"],2)
 def test_burn(self):self.assertAlmostEqual(burn_rate(.95,.99),5)
 def test_status_validation(self):
  with self.assertRaises(ValueError):summary([{"duration_ms":1,"status":999}])
if __name__=="__main__":unittest.main()
