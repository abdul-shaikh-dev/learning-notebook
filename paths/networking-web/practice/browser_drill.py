"""Two loopback origins for optional real-browser CORS observation."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import argparse
import json


def serve(page_port=8766, api_port=8765):
    class Page(BaseHTTPRequestHandler):
        def log_message(self, *_): pass
        def do_GET(self):
            html = '''<!doctype html><html lang="en"><meta charset="utf-8">
<title>CORS browser drill</title><h1>CORS browser drill</h1>
<p>Each button requests the API on a different loopback port. Compare what this page can read with the HTTP response in Network.</p>
<button type="button" data-path="allowed">Try allowed</button>
<button type="button" data-path="denied">Try denied</button>
<button type="button" data-path="wrong-origin">Try wrong origin</button>
<p role="status" id="result" aria-live="polite">Choose a case.</p>
<script>
for (const button of document.querySelectorAll('button[data-path]')) {
  button.addEventListener('click', async () => {
    const path = button.dataset.path;
    const result = document.getElementById('result');
    result.textContent = `${path}: requesting…`;
    try {
      const response = await fetch('http://127.0.0.1:__API__/' + path);
      const data = await response.json();
      result.textContent = `${path}: readable HTTP ${response.status}; ok=${data.ok}`;
    } catch (error) {
      result.textContent = `${path}: browser blocked script access (${error.name})`;
    }
  });
}
</script></html>'''.replace('__API__', str(api_port))
            body = html.encode('utf-8')
            self.send_response(200); self.send_header('Content-Type', 'text/html')
            self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    class Api(BaseHTTPRequestHandler):
        def log_message(self, *_): pass
        def do_GET(self):
            body = json.dumps({'ok': True}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            if self.path == '/allowed': self.send_header('Access-Control-Allow-Origin', origin)
            if self.path == '/wrong-origin': self.send_header('Access-Control-Allow-Origin', 'http://127.0.0.1:1')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers(); self.wfile.write(body)
    page = ThreadingHTTPServer(('127.0.0.1', page_port), Page)
    origin = f'http://127.0.0.1:{page.server_port}'
    api = ThreadingHTTPServer(('127.0.0.1', api_port), Api)
    for server in (page, api): server.daemon_threads = True
    thread = Thread(target=api.serve_forever, daemon=True); thread.start()
    print(f'Open {origin}/ then test API port {api.server_port}', flush=True)
    try: page.serve_forever()
    finally:
        page.server_close(); api.shutdown(); api.server_close(); thread.join(timeout=2)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--page-port', type=int, default=8766)
    parser.add_argument('--api-port', type=int, default=8765)
    args = parser.parse_args()
    serve(args.page_port, args.api_port)
