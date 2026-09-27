import tempfile
from pathlib import Path
import unittest
from release_tools import budget,digest,percentile,local_load
import threading
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
class ToolsChecks(unittest.TestCase):
    def test_exhausted_budget(self):
        result=budget(10000,12,.999);self.assertEqual(result["allowed_bad"],10.0);self.assertEqual(result["remaining"],-2.0);self.assertAlmostEqual(result["burn_rate"],1.2)
    def test_boundaries(self):
        for inputs in [(0,0,.99),(10,11,.99),(10,0,1)]:
            with self.assertRaises(ValueError):budget(*inputs)
        with self.assertRaises(ValueError):percentile([],.5)
    def test_digest_changes_with_bytes(self):
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/"file";p.write_bytes(b"one");first=digest(p);p.write_bytes(b"two");self.assertNotEqual(first,digest(p));self.assertEqual(len(first),64)
    def test_small_sample_percentile(self):self.assertEqual(percentile([30,10,20],.95),30)
    def test_load_counts_incomplete_and_oversized_bodies(self):
        class Broken(BaseHTTPRequestHandler):
            def log_message(self,*args):pass
            def do_GET(self):
                self.send_response(200)
                if self.path=="/chunked":self.send_header("Transfer-Encoding","chunked")
                else:self.send_header("Content-Length","70000" if self.path=="/large" else "1000")
                self.end_headers();self.wfile.write(b"20\r\nshort" if self.path=="/chunked" else b"{}")
        server=ThreadingHTTPServer(("127.0.0.1",0),Broken)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            for path in ("/short","/chunked","/large"):
                with self.subTest(path=path):
                    self.assertEqual(local_load(f"http://127.0.0.1:{server.server_port}{path}",1)["errors"],1)
        finally:server.shutdown();server.server_close();thread.join(timeout=2)

    def test_load_refuses_redirects_credentials_and_fragments(self):
        visited=[]
        class Target(BaseHTTPRequestHandler):
            def log_message(self,*args):pass
            def do_GET(self):visited.append(self.path);self.send_response(200);self.end_headers()
        target=ThreadingHTTPServer(("127.0.0.1",0),Target)
        class Redirect(BaseHTTPRequestHandler):
            def log_message(self,*args):pass
            def do_GET(self):self.send_response(302);self.send_header("Location",f"http://127.0.0.1:{target.server_port}/target");self.end_headers()
        source=ThreadingHTTPServer(("127.0.0.1",0),Redirect)
        threads=[threading.Thread(target=server.serve_forever,daemon=True) for server in [target,source]]
        for t in threads:t.start()
        try:
            self.assertEqual(local_load(f"http://127.0.0.1:{source.server_port}/",1)["errors"],1)
            self.assertEqual(visited,[])
            for url in ["http://user:password@127.0.0.1/","http://127.0.0.1/#token","https://127.0.0.1/","http://example.invalid/"]:
                with self.assertRaises(ValueError):local_load(url,1)
        finally:
            for server in [source,target]:server.shutdown();server.server_close()
            for t in threads:t.join(timeout=3)
if __name__=="__main__":unittest.main()
