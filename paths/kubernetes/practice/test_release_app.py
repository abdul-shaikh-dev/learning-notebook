from contextlib import closing
import contextlib
import io
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from release_app import backup,make_server

class ReleaseChecks(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.folder=Path(self.temp.name);self.db=self.folder/"notes.db";self.gate=self.folder/"not-ready";self.output=io.StringIO();self.capture=contextlib.redirect_stdout(self.output);self.capture.__enter__();self.start("v1")
    def start(self,version):
        self.server=make_server(port=0,db_file=str(self.db),version=version,ready_file=str(self.gate));self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start();self.url=f"http://127.0.0.1:{self.server.server_port}"
    def stop(self):self.server.shutdown();self.server.server_close();self.thread.join(timeout=3)
    def tearDown(self):self.stop();self.capture.__exit__(None,None,None);self.temp.cleanup()
    def request(self,path,payload=None):
        data=None if payload is None else json.dumps(payload).encode();r=urllib.request.Request(self.url+path,data=data,headers={"Content-Type":"application/json"})
        try:response=urllib.request.urlopen(r,timeout=3)
        except urllib.error.HTTPError as e:response=e
        with response:return response.status,json.load(response)
    def test_release_and_liveness(self):
        self.assertEqual(self.request("/version"),(200,{"release":"v1"}));self.assertEqual(self.request("/live")[0],200)
    def test_readiness_failure_does_not_kill_liveness(self):
        self.gate.write_text("synthetic gate");self.assertEqual(self.request("/ready")[0],503);self.assertEqual(self.request("/live")[0],200);self.gate.unlink();self.assertEqual(self.request("/ready")[0],200)
    def test_validation_and_parameterization(self):
        self.assertEqual(self.request("/notes",{"title":" "})[0],400);self.assertEqual(self.request("/notes",{"title":"x'*; DROP TABLE notes;--"})[0],201);self.assertEqual(len(self.request("/notes")[1]["notes"]),1)
    def test_simulated_release_restart_and_label_rollback_preserve_rows(self):
        self.request("/notes",{"title":"kept"});self.stop();self.start("v2");self.assertEqual(self.request("/version")[1]["release"],"v2");self.assertEqual(self.request("/notes")[1]["notes"][0]["title"],"kept");self.stop();self.start("v1");self.assertEqual(len(self.request("/notes")[1]["notes"]),1)
    def test_live_backup_restores_independently(self):
        self.request("/notes",{"title":"before snapshot"});snapshot=self.folder/"snapshot.db";backup(self.db,snapshot);self.request("/notes",{"title":"after snapshot"})
        with closing(sqlite3.connect(snapshot)) as db, db:self.assertEqual(db.execute("SELECT title FROM notes").fetchall(),[("before snapshot",)])
        with self.assertRaises(ValueError):backup(self.db,snapshot)
        with self.assertRaises(sqlite3.OperationalError):backup(self.folder/"missing.db",self.folder/"empty-backup.db")
        self.assertFalse((self.folder/"empty-backup.db").exists())
    def test_logs_and_metrics_have_no_title(self):
        self.request("/notes",{"title":"private-example"});self.gate.write_text("gate");self.request("/ready");status,metric=self.request("/metrics");self.assertEqual(status,200);self.assertEqual(metric,{"requests":2,"errors":1});self.assertNotIn("private-example",self.output.getvalue())
    def test_unknown_route(self):self.assertEqual(self.request("/missing")[0],404)

if __name__=="__main__":unittest.main()
