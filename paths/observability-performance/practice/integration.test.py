"""Starts and cleans up a real loopback HTTP server in a child process."""
import subprocess,sys,time,urllib.request,unittest
from load import run_one
from telemetry import summary
class LoopbackTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=subprocess.Popen([sys.executable,"service.py"],stdout=subprocess.DEVNULL)
  for _ in range(50):
   try:
    with urllib.request.urlopen("http://127.0.0.1:8891/work?n=1",timeout=.5) as response:response.read()
    return
   except OSError:time.sleep(.05)
  cls.server.terminate();cls.server.wait();raise RuntimeError("loopback service did not start")
 @classmethod
 def tearDownClass(cls):cls.server.terminate();cls.server.wait(timeout=5)
 def test_failure_and_duration(self):
  fast=run_one(1,"healthy");slow=run_one(5,"slow");bad=run_one(5,"fail")
  self.assertEqual(fast["status"],200);self.assertEqual(bad["status"],503)
  self.assertGreaterEqual(slow["duration_ms"],140)
  self.assertEqual(summary([fast,slow,bad])["bad"],2)
if __name__=="__main__":unittest.main()
