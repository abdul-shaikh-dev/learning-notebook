"""Bounded loopback lab. No external providers, database or authentication."""
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse,parse_qs
import time,json
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  parsed=urlparse(self.path);query=parse_qs(parsed.query)
  if parsed.path!="/work":self.send_error(404);return
  try:n=int(query.get("n",["0"])[0])
  except ValueError:self.send_error(400);return
  profile=query.get("profile",["healthy"])[0]
  if profile not in {"healthy","slow","fail"}:self.send_error(400);return
  start=time.perf_counter();delay=.15 if profile=="slow" and n%5==0 else .01
  time.sleep(delay);status=503 if profile=="fail" and n%5==0 else 200
  payload=json.dumps({"request_id":f"lab-{n}","profile":profile,"server_duration_ms":(time.perf_counter()-start)*1000}).encode()
  self.send_response(status);self.send_header("Content-Type","application/json");self.send_header("Content-Length",str(len(payload)));self.end_headers();self.wfile.write(payload)
 def log_message(self,*args):pass
if __name__=="__main__":
 server=ThreadingHTTPServer(("127.0.0.1",8891),Handler);print("Loopback lab on 127.0.0.1:8891; Ctrl+C stops it.",flush=True)
 try:server.serve_forever()
 except KeyboardInterrupt:pass
 finally:server.server_close()
