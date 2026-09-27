"""Local release lab; Python http.server is not a production HTTP server."""
from contextlib import closing
import argparse
import json
import os
from pathlib import Path
import signal
import sqlite3
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

def initialize(file):
    with closing(sqlite3.connect(file)) as db, db:
        db.execute("CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, title TEXT NOT NULL)")

def readonly_uri(file):
    return Path(file).resolve().as_uri() + "?mode=ro"

def backup(source, target):
    if Path(target).exists(): raise ValueError("Backup destination must be new")
    with closing(sqlite3.connect(readonly_uri(source),uri=True)) as src, closing(sqlite3.connect(target)) as dst: src.backup(dst)

def make_server(host="127.0.0.1",port=8080,db_file="notes.db",version="v1",ready_file=None):
    initialize(db_file)
    totals={"requests":0,"errors":0};lock=threading.Lock()
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args): pass
        def respond(self,status,data):
            content=json.dumps(data).encode()
            self.send_response(status);self.send_header("Content-Type","application/json");self.send_header("Content-Length",str(len(content)));self.end_headers()
            with lock:
                totals["requests"]+=1
                if status>=500:totals["errors"]+=1
            route=self.path.split("?")[0]
            print(json.dumps({"route":route if route in {"/live","/ready","/notes","/version","/metrics"} else "unknown","status":status,"release":version}),flush=True)
            self.wfile.write(content)
        def do_GET(self):
            route=self.path.split("?")[0]
            if route=="/live":return self.respond(200,{"live":True})
            if route=="/ready":
                try:
                    if ready_file and Path(ready_file).exists():return self.respond(503,{"ready":False})
                    with closing(sqlite3.connect(readonly_uri(db_file),uri=True)) as db, db:db.execute("SELECT 1 FROM notes LIMIT 1").fetchall()
                    return self.respond(200,{"ready":True})
                except sqlite3.Error:return self.respond(503,{"ready":False})
            if route=="/version":return self.respond(200,{"release":version})
            if route=="/metrics":
                with lock:snapshot=dict(totals)
                return self.respond(200,snapshot)
            if route=="/notes":
                with closing(sqlite3.connect(db_file)) as db, db:rows=db.execute("SELECT id,title FROM notes ORDER BY id LIMIT 50").fetchall()
                return self.respond(200,{"notes":[{"id":id,"title":title} for id,title in rows]})
            return self.respond(404,{"error":"not_found"})
        def do_POST(self):
            if self.path!="/notes":return self.respond(404,{"error":"not_found"})
            try:
                length=int(self.headers.get("Content-Length","0"))
                if not 0<length<=4096:raise ValueError()
                value=json.loads(self.rfile.read(length));title=value.get("title") if isinstance(value,dict) else None
                if not isinstance(title,str) or not 1<=len(title.strip())<=100:raise ValueError()
            except (ValueError,TypeError,json.JSONDecodeError):return self.respond(400,{"error":"invalid_title_or_body"})
            with closing(sqlite3.connect(db_file)) as db, db:
                cursor=db.execute("INSERT INTO notes(title) VALUES (?)",(title.strip(),));id=cursor.lastrowid
            return self.respond(201,{"id":id,"title":title.strip()})
    server=ThreadingHTTPServer((host,port),Handler);server.daemon_threads=True
    return server

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--host",default=os.getenv("BIND_HOST","127.0.0.1"));p.add_argument("--port",type=int,default=int(os.getenv("PORT","8080")));p.add_argument("--db",default=os.getenv("RELEASE_DB","notes.db"));p.add_argument("--version",default=os.getenv("RELEASE_VERSION","v1"));p.add_argument("--ready-file",default=os.getenv("NOT_READY_FILE"));args=p.parse_args()
    server=make_server(args.host,args.port,args.db,args.version,args.ready_file)
    def stop(*_):threading.Thread(target=server.shutdown,daemon=True).start()
    signal.signal(signal.SIGTERM,stop);signal.signal(signal.SIGINT,stop)
    print(json.dumps({"started":server.server_address,"release":args.version}),flush=True)
    try:server.serve_forever()
    finally:server.server_close()
