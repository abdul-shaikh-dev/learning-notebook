"""Real SQLite transaction, parsing, replay and rollback evidence."""
import sqlite3
import tempfile
import unittest
from pathlib import Path
from pipeline_lab import import_csv,read_batch,reconcile,MAX_BYTES,MAX_ROWS

HEADER='order_id,customer_id,occurred_at,amount_cents\n'
ROW='o1,c1,2026-09-01T10:00:00Z,1250\n'

class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source=Path(self.temp.name)/'input.csv'
        self.database=Path(self.temp.name)/'practice.db'
        self.source.write_text(HEADER+ROW,encoding='utf-8')
    def test_commit_and_replay(self):
        self.assertEqual(import_csv(self.source,self.database,'b1'),'committed')
        self.assertEqual(import_csv(self.source,self.database,'b1'),'replay')
        self.assertEqual(reconcile(self.database),{'orders':1,'total_cents':1250,'ids':['o1'],'utc_days':[('2026-09-01',1250)]})
    def test_changed_payload_conflicts(self):
        import_csv(self.source,self.database,'b1')
        self.source.write_text(HEADER+ROW.replace('1250','750'),encoding='utf-8')
        with self.assertRaises(ValueError): import_csv(self.source,self.database,'b1')
        self.assertEqual(reconcile(self.database)['total_cents'],1250)
    def test_constraint_failure_rolls_back_new_rows_and_marker(self):
        import_csv(self.source,self.database,'b1')
        self.source.write_text(HEADER+'o2,c2,2026-09-02T10:00:00Z,500\n'+ROW,encoding='utf-8')
        with self.assertRaises(sqlite3.IntegrityError): import_csv(self.source,self.database,'b2')
        self.assertEqual(reconcile(self.database)['ids'],['o1'])
        connection=sqlite3.connect(self.database)
        try: self.assertEqual(connection.execute('SELECT batch_id FROM runs').fetchall(),[('b1',)])
        finally: connection.close()
    def test_invalid_rows_preserve_state(self):
        import_csv(self.source,self.database,'b1')
        for changed in [ROW.replace('1250','-1'),ROW.replace('1250','12.50'),ROW.replace('Z',''),ROW.replace('09-01','13-01'),ROW.replace('c1','')]:
            with self.subTest(changed=changed):
                self.source.write_text(HEADER+changed,encoding='utf-8')
                with self.assertRaises(ValueError): import_csv(self.source,self.database,'invalid')
                self.assertEqual(reconcile(self.database)['ids'],['o1'])
    def test_headers_and_field_count(self):
        for text in [HEADER.replace('customer_id','order_id')+ROW,HEADER+ROW.rstrip()+',extra\n',HEADER+'o1,c1\n']:
            self.source.write_text(text,encoding='utf-8')
            with self.assertRaises(ValueError): read_batch(self.source)
    def test_duplicate_source_ids(self):
        self.source.write_text(HEADER+ROW+ROW,encoding='utf-8')
        with self.assertRaises(ValueError): read_batch(self.source)
    def test_empty_batch(self):
        self.source.write_text(HEADER,encoding='utf-8')
        self.assertEqual(import_csv(self.source,self.database,'empty'),'committed')
        self.assertEqual(reconcile(self.database)['total_cents'],0)
    def test_byte_bound(self):
        self.source.write_bytes(b'x'*(MAX_BYTES+1))
        with self.assertRaises(ValueError): read_batch(self.source)
        self.assertFalse(self.database.exists())
    def test_row_bound(self):
        self.source.write_text(HEADER+''.join(f'o{i},c1,2026-09-01T00:00:00Z,1\n' for i in range(MAX_ROWS+1)),encoding='utf-8')
        with self.assertRaises(ValueError): read_batch(self.source)
    def test_parameterized_identifiers_and_paths(self):
        with self.assertRaises(ValueError): import_csv(self.source,self.database,"bad';DROP")
        with self.assertRaises(ValueError): import_csv(self.source,self.source,'b1')
        self.assertEqual(self.source.read_text(encoding='utf-8'),HEADER+ROW)
    def test_quoted_csv_fields(self):
        self.source.write_text(HEADER+'"o1","c1","2026-09-01T10:00:00Z","1250"\n',encoding='utf-8')
        self.assertEqual(read_batch(self.source)[0],[('o1','c1','2026-09-01T10:00:00Z',1250)])

if __name__=='__main__': unittest.main()
