import unittest
from metrics_lab import (FEATURES, classify, confusion, choose_threshold, cost,
                         fingerprint, group_split, mae, make_tickets, matrix, time_split)

class MetricsTests(unittest.TestCase):
    def test_hand_counts(self):
        result=confusion([1,0,1,0],[1,1,0,0])
        self.assertEqual([result[k] for k in ('tp','fp','fn','tn')],[1,1,1,1])
        self.assertEqual(result['precision'],0.5)
        self.assertEqual(result['recall'],0.5)
    def test_undefined(self):
        self.assertIsNone(confusion([1,0],[0,0])['precision'])
        self.assertIsNone(confusion([0,0],[1,0])['recall'])
    def test_invalid_labels(self):
        for a,b in [([],[]),([1],[1,0]),([2],[1])]:
            with self.assertRaises(ValueError): confusion(a,b)
    def test_mae(self):
        self.assertEqual(mae([4,10],[6,6]),3)
        with self.assertRaises(ValueError): mae([1],[float('nan')])
        with self.assertRaises(ValueError): mae([1,2],[1])
    def test_threshold(self):
        self.assertEqual(classify([0.59,0.60,0.91],0.6),[0,1,1])
        self.assertEqual(choose_threshold([1,0,1,0],[0.8,0.6,0.4,0.2]),0.3)
        self.assertEqual(choose_threshold([0],[0.1]),0.7)
        self.assertEqual(cost(confusion([1,0,1,0],[1,0,0,0])),4)
    def test_invalid_probability(self):
        for p,t in [([1.1],0.5),([float('nan')],0.5),([0.5],-1)]:
            with self.assertRaises(ValueError): classify(p,t)
    def test_fixture(self):
        rows=make_tickets()
        self.assertEqual(fingerprint(rows),fingerprint(make_tickets()))
        self.assertTrue(all(r['breached']==int(r['resolution_hours']>24) for r in rows))
        self.assertEqual(len({r['ticket_id'] for r in rows}),240)
        self.assertTrue(all(r['resolution_hours']<48 for r in rows))
    def test_time_split(self):
        parts=time_split(make_tickets())
        self.assertEqual([len(x) for x in parts],[144,48,48])
        self.assertLess(parts[0][-1]['created_date'],parts[1][0]['created_date'])
        self.assertLess(parts[1][-1]['created_date'],parts[2][0]['created_date'])
        self.assertFalse({r['ticket_id'] for r in parts[0]} & {r['ticket_id'] for r in parts[2]})
    def test_bad_order_and_duplicates(self):
        rows=make_tickets()
        with self.assertRaises(ValueError): time_split(list(reversed(rows)))
        rows[1]['ticket_id']=rows[0]['ticket_id']
        with self.assertRaises(ValueError): time_split(rows)
    def test_group_split(self):
        a,b=group_split(make_tickets(),['C000','C001'])
        self.assertEqual(len(b),8)
        self.assertFalse({r['customer_id'] for r in a}&{r['customer_id'] for r in b})
    def test_feature_allowlist(self):
        rows=make_tickets()
        before=matrix(rows)
        rows[0]['resolution_hours']=999
        rows[0]['breached']=9
        self.assertEqual(before,matrix(rows))
        self.assertEqual(len(FEATURES),4)

if __name__=='__main__': unittest.main()
