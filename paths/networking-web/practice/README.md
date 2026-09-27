# Networking & the Web practice

Python 3.11+, standard library only. Keep all files together.

```text
python network_foundation.py
python network_http.py
python network_resilience.py
python -m unittest -v test_network_labs.py
```

Reference outputs

- network_foundation.py: HTTPS origin tuple; address before TTL expiry and None at expiry.
- network_http.py: 200 lesson, 307 redirect, 401 synthetic denial and malformed 200 body.
- network_resilience.py: status 200 after two modeled attempts with minimal trace.

## Limits and safe use

The server binds only 127.0.0.1 and an ephemeral port. It exercises real local HTTP/1.1 and a controlled read timeout, not TLS, public DNS, CORS/browser enforcement, real authentication, HTTP/2/3 or proxy deployment. Cookies are fixed synthetic values. DNS/cache/retry utilities are deliberately incomplete offline models; the cache omits Vary, Age, revalidation and full directive parsing. TLS tests inspect configuration only. The retry callback must have its own bounded transport timeout; no backoff or jitter is supplied. No production reliability or security claim follows.

The references implement all three stage baselines. Read project-workbook.md for requirements, rubrics and reference reasoning. Rebuild the small stages yourself, then compare outputs. Keep new exercises separate from supplied verification evidence.

Primary source sections were reviewed on 2026-09-27. Local test results follow; these do not establish unexecuted internet or deployment behavior.

Local verification on 2026-09-27: Python 3.14; 12 regression tests passed. Reference script commands also executed successfully.
