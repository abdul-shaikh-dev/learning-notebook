"""Independent hand-calculated examples and invalid-input checks."""
import unittest
from foundation_project import rate, relative_change, combined_rate
from intermediate_project import summarize, conditional_count, known_sigma_interval
from advanced_project import dot, matvec, cosine

class FoundationTests(unittest.TestCase):
    def test_rate(self):
        self.assertEqual(rate(1200,60),20)
        self.assertEqual(rate(0,5),0)
    def test_weighted_rate(self):
        self.assertEqual(combined_rate([100,100],[10,30]),5)
    def test_relative(self):
        self.assertAlmostEqual(relative_change(50,40),-.2)
    def test_zero_time(self):
        with self.assertRaises(ValueError): rate(1,0)
    def test_bad_base(self):
        with self.assertRaises(ValueError): relative_change(0,10)
    def test_invalid_pairs(self):
        for counts,times in [([],[]),([1],[2,3]),([1,-1],[2,2]),([1],[float('nan')])]:
            with self.assertRaises(ValueError): combined_rate(counts,times)
    def test_bool_rejected(self):
        with self.assertRaises(ValueError): rate(True,2)

class IntermediateTests(unittest.TestCase):
    def test_summary(self):
        self.assertEqual(summarize([2,4,6]), {'n':3,'mean':4,'median':4,'sample_variance':4})
    def test_outlier(self):
        result=summarize([10,10,10,10,100])
        self.assertEqual(result['mean'],28)
        self.assertEqual(result['median'],10)
    def test_missing_data(self):
        for values in [[],[2],[1,float('nan')],[1,float('inf')]]:
            with self.assertRaises(ValueError): summarize(values)
    def test_conditioning(self):
        self.assertEqual(conditional_count(15,20),.75)
        self.assertAlmostEqual(conditional_count(15,45),1/3)
    def test_bad_counts(self):
        for pair in [(0,0),(3,2),(-1,2),(1.5,2),(True,2)]:
            with self.assertRaises(ValueError): conditional_count(*pair)
    def test_interval(self):
        low,high=known_sigma_interval(50,10,100)
        self.assertAlmostEqual(low,48.04)
        self.assertAlmostEqual(high,51.96)
    def test_sample_size(self):
        low,high=known_sigma_interval(50,10,400)
        self.assertAlmostEqual(high-low,1.96)
        with self.assertRaises(ValueError): known_sigma_interval(50,10,0)

class AdvancedTests(unittest.TestCase):
    def test_dot(self):
        self.assertEqual(dot([1,2,3],[4,0,-1]),1)
    def test_matrix(self):
        self.assertEqual(matvec([[1,2,0],[0,1,3]],[4,5,6]),[14,23])
    def test_shapes(self):
        for matrix,values in [([], [1]),([[1],[1,2]],[2]),([[1,2]], [1]),([[1]],[])]:
            with self.assertRaises(ValueError): matvec(matrix,values)
    def test_bad_coordinates(self):
        with self.assertRaises(ValueError): dot([1,float('nan')],[1,2])
        with self.assertRaises(ValueError): dot([1],[1,2])
    def test_cosine(self):
        self.assertEqual(cosine([1,0],[0,1]),0)
        self.assertAlmostEqual(cosine([1,2],[5,10]),1)
        with self.assertRaises(ValueError): cosine([0,0],[1,2])
    def test_sensitivity(self):
        candidates=[[.9,.4],[.6,.8]]
        a=matvec(candidates,[.8,.2])
        b=matvec(candidates,[.5,.5])
        self.assertGreater(a[0],a[1])
        self.assertLess(b[0],b[1])

if __name__ == '__main__': unittest.main()
