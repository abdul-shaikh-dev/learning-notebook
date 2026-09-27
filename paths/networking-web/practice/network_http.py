"""Ephemeral loopback HTTP lab; not production or encrypted transport."""
from contextlib import contextmanager
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading

BODY=b'{"lesson":"http","version":1}'
ETAG='"lesson-v1"'

class Handler(BaseHTTPRequestHandler):
    protocol_version="HTTP/1.1"
    def handle(self):
        try: super().handle()
        except ConnectionError:
            # A client timeout can close/reset this owned loopback connection.
            # Other handler exceptions remain visible to the server/test runner.
            pass
    def log_message(self,*args): pass
    def do_HEAD(self): self._respond(head=True)
    def do_GET(self): self._respond(head=False)
    def _respond(self,head):
        path=self.path.split("?",1)[0]
        headers={"Content-Type":"application/json", "Cache-Control":"public, max-age=5"}
        code,body=200,BODY
        if path=="/redirect":
            code,body=307,b""
            headers["Location"]="/lesson"
        elif path=="/lesson":
            headers["ETag"]=ETAG
            if self.headers.get("If-None-Match")==ETAG: code,body=304,b""
        elif path=="/private":
            headers["Cache-Control"]="private, no-store"
            if self.headers.get("Cookie")!="session=synthetic":
                code,body=401,b'{"error":"session required"}'
                headers["WWW-Authenticate"]='Bearer realm="synthetic-demo"'
        elif path=="/cookie":
            headers["Set-Cookie"]="session=synthetic; Path=/; HttpOnly; SameSite=Lax"
            headers["Cache-Control"]="no-store"
        elif path=="/bad-json": body=b'{broken'
        elif path=="/unavailable": code,body=503,b'{"error":"unavailable"}'
        elif path=="/stall":
            self.server.started.set()
            self.server.release.wait(timeout=5)
        else: code,body=404,b'{"error":"not found"}'
        self.send_response(code)
        for key,value in headers.items(): self.send_header(key,value)
        if code != 304: self.send_header("Content-Length",str(len(body)))
        self.end_headers()
        if not head and code != 304:
            try: self.wfile.write(body)
            except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError): pass

@contextmanager
def local_server():
    server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
    server.daemon_threads=False
    server.started,server.release=threading.Event(),threading.Event()
    thread=threading.Thread(target=server.serve_forever,kwargs={"poll_interval":0.02},daemon=True)
    thread.start()
    try: yield server
    finally:
        server.release.set()
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

def fetch(server,path="/lesson",method="GET",headers=None,timeout=2):
    connection=http.client.HTTPConnection("127.0.0.1",server.server_port,timeout=timeout)
    try:
        connection.request(method,path,headers=headers or {})
        response=connection.getresponse()
        body=response.read(4097)
        if len(body)>4096: raise ValueError("body limit exceeded")
        return response.status,dict(response.getheaders()),body
    finally: connection.close()

if __name__=="__main__":
    with local_server() as server:
        for path in ("/lesson","/redirect","/private","/bad-json"):
            code,headers,body=fetch(server,path)
            print(path,code,body.decode())
