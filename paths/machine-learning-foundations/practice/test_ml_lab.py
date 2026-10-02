import copy
import unittest
import numpy as np
from metrics_lab import make_tickets,time_split
from ml_lab import arrays,pipeline,positive_probability,run

class ModelTests(unittest.TestCase):
    def test_training_statistics(self):
        train,validation,_=time_split(make_tickets())
        X,y=arrays(train)
        model=pipeline().fit(X,y)
        scaler=model.named_steps['prepare'].named_transformers_['numeric'].named_steps['scale']
        self.assertAlmostEqual(scaler.mean_[0],sum(r['customer_messages'] for r in train)/len(train))
        mean=scaler.mean_.copy()
        changed=copy.deepcopy(validation)
        changed[0]['customer_messages']=100000
        model.predict(arrays(changed)[0])
        np.testing.assert_array_equal(mean,scaler.mean_)
    def test_unknown_category_and_missing_value(self):
        train,validation,_=time_split(make_tickets())
        model=pipeline().fit(*arrays(train))
        X,_=arrays(validation)
        X[0,0]='portal'
        X[1,3]=np.nan
        probs=positive_probability(model,X)
        self.assertEqual(len(probs),48)
        self.assertTrue(all(0<=p<=1 for p in probs))
    def test_test_labels_do_not_select_threshold(self):
        rows=make_tickets()
        first=run(rows)
        for row in rows[192:]: row['breached']=1-row['breached']
        second=run(rows)
        self.assertEqual(first['threshold'],second['threshold'])
        self.assertEqual(first['training_cv_recall'],second['training_cv_recall'])
        self.assertEqual(first['validation'],second['validation'])
    def test_development_hides_test_metrics(self):
        report=run()
        self.assertNotIn('test_model',report)
        self.assertNotIn('test_baseline',report)
        self.assertNotIn('test_channels',report)
    def test_report_and_repeatability(self):
        first=run(final=True)
        self.assertEqual(first,run(final=True))
        self.assertEqual(first['split_sizes'],[144,48,48])
        self.assertEqual(first['test_model']['n'],48)
        self.assertEqual(sum(v['n'] for v in first['test_channels'].values()),48)
        self.assertEqual(first['repeated_test_customers'],48)

if __name__=='__main__': unittest.main()
