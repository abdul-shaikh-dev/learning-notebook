# Optional browser, TLS and forwarded-header drill

Use only your own loopback server and synthetic data. Requires Python 3.11+, a browser with developer tools and, for TLS, OpenSSL on PATH. This track is separate from the offline regression suite.

From the extracted kit run `python browser_drill.py` and open `http://127.0.0.1:8766/`. If either port is occupied, run `python browser_drill.py --api-port 8865 --page-port 8866` and use the printed page URL. Click **Try denied**, **Try allowed** and **Try wrong origin**. The status text displays whether the page could read the response. In browser developer tools, compare the HTTP responses and headers in Network with what the page reports. The equivalent optional console calls are:

```javascript
fetch('http://127.0.0.1:8765/denied').then(r => r.json()).then(console.log).catch(console.error)
fetch('http://127.0.0.1:8765/allowed').then(r => r.json()).then(console.log).catch(console.error)
fetch('http://127.0.0.1:8765/wrong-origin').then(r => r.json()).then(console.log).catch(console.error)
```

Expect `/denied` and `/wrong-origin` to appear as HTTP 200 requests in Network but fail script access. Expect `/allowed` to return `{ok:true}` to script. Record the page origin, response headers, browser/version and console results. Direct navigation or a PowerShell HTTP client does not exercise browser CORS enforcement. CORS is not authentication or CSRF protection. Stop the server with Ctrl+C.

Current verification (2026-09-30): the in-app browser exercised the page buttons against this loopback fixture. **Allowed** displayed readable HTTP 200 with `ok=true`; **denied** and **wrong origin** displayed blocked `TypeError`. This verifies browser script access for these three local cases. TLS, forwarded-proxy trust and Kubernetes drills were not executed in that check.

For TLS, create a disposable certificate for `localhost` using an installed OpenSSL with `-addext` support:

```powershell
openssl req -x509 -newkey rsa:2048 -nodes -keyout localhost-key.pem -out localhost-cert.pem -days 1 -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost'
python -c "import http.server,ssl; H=type('H',(http.server.BaseHTTPRequestHandler,),{'do_GET':lambda s:(s.send_response(200),s.end_headers(),s.wfile.write(b'local TLS drill'))});s=http.server.HTTPServer(('127.0.0.1',8767),H);c=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);c.load_cert_chain('localhost-cert.pem','localhost-key.pem');s.socket=c.wrap_socket(s.socket,server_side=True);s.serve_forever()"
```

The handler returns fixed text and does not serve the private-key file. Visit `https://localhost:8767/` and inspect the certificate warning: a matching hostname does not establish trust in a self-signed signer. `curl.exe -k https://localhost:8767/` only demonstrates the transport with certificate checks disabled; it does not establish trusted HTTPS. Stop the server and remove the two generated PEM files. Never install this disposable certificate as a trusted root.

For forwarded-header trust, send `curl.exe -H "X-Forwarded-Proto: https" http://127.0.0.1:8765/allowed` while `browser_drill.py` runs. Compare the client-controlled header with the actual HTTP URL. A real proxy integration should accept forwarding headers only from a configured trusted proxy that overwrites inbound values. Record a proxied request and a direct spoofed request before claiming proxy trust behavior; this local request illustrates the spoofing input only.

Sources: [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [Python SSL](https://docs.python.org/3/library/ssl.html), [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html).
