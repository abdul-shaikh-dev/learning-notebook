"""Fact checks for the Networking & the Web checkpoint answers.

Each fact runs the course's own labs (the offline models, the loopback HTTP server and the loopback TCP
framing exchange) or the standard library they rely on, and returns the text of the option its result
supports. The script fails if that differs from the authored correct option. Nothing leaves 127.0.0.1.
Run with Python 3.11+: python tests/network_checkpoint_facts.py
"""
import http.cookies
import ipaddress
import json
from pathlib import Path
import ssl
import sys
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'networking-web'
sys.path.insert(0, str(COURSE / 'practice'))
from network_foundation import DnsCache, origin, retry_allowed  # noqa: E402
from network_http import BODY, fetch, local_server  # noqa: E402
from network_resilience import ProtocolError, SharedCache, bounded_get, decode_observation  # noqa: E402
from tcp_framing import exchange  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'proxies/2': 'Trusted forwarding boundaries, lesson 18',
    'protocol-evolution/2': 'HTTP semantics and wire protocols, lesson 23',
    'network-review/2': 'Unexecuted network extensions, lesson 24',
}
JSON = {'Content-Type': 'application/json'}


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def outcome(action):
    """Run action and name the exception it raises, or return its result."""
    try:
        return action()
    except Exception as error:
        return f'{type(error).__name__}: {error}'


def request_journey():
    with local_server() as server:
        status, headers, body = fetch(server, '/bad-json')
    rejected = outcome(lambda: decode_observation(status, headers, body))
    return pick((status, rejected), {(200, 'ProtocolError: invalid JSON'): 'The status is 200, and decode_observation raises ProtocolError'})


def addresses_ports():
    with local_server() as server:
        port, bound = server.server_port, server.server_address[0]
    return pick(port != 0 and bound == '127.0.0.1', {True: 'A nonzero port chosen by the operating system'})


def dns():
    address = ipaddress.ip_address('192.0.2.10')
    documentation = address in ipaddress.ip_network('192.0.2.0/24') and not address.is_global and not address.is_loopback
    return pick(documentation, {True: 'It is in 192.0.2.0/24, a range reserved for documentation, not a live host'})


def dns_cache():
    cache = DnsCache()
    cache.remember('lessons.example', '192.0.2.10', 0, 10)
    return pick(cache.lookup('lessons.example', 10), {None: 'None: there is no cached answer'})


def transport():
    return pick(outcome(lambda: exchange([b'incomplete'])), {'ValueError: EOF inside a frame': 'Raises ValueError: EOF inside a frame'})


def urls_origins():
    result = outcome(lambda: origin('https://example.test/page#top'))
    return pick(result, {'ValueError: request URL must not include fragment': 'Raises ValueError: request URLs must not include a fragment'})


def encoding():
    return str(len('café'.encode('utf-8')))


def http_message():
    with local_server() as server:
        _, _, get_body = fetch(server, '/lesson')
        status, headers, body = fetch(server, '/lesson', method='HEAD')
    if (status, len(get_body)) != (200, 29) or get_body != BODY:
        raise AssertionError('GET /lesson no longer returns the 29-byte lesson')
    return pick((headers.get('Content-Length'), body), {('29', b''): 'Content-Length: 29 and an empty body'})


def status():
    with local_server() as server:
        code, headers, _ = fetch(server, '/private')
    return pick((code, 'WWW-Authenticate' in headers), {(401, True): '401 with a WWW-Authenticate field'})


def methods_retries():
    return pick(retry_allowed('HEAD', 1, 3, 0), {False: 'False: no time remains'})


def tls():
    return pick(ssl.create_default_context().verify_mode, {ssl.CERT_REQUIRED: 'CERT_REQUIRED'})


def certificates():
    context = ssl.create_default_context()

    def weaken():
        context.verify_mode = ssl.CERT_NONE
    result = outcome(weaken)
    still_checking = context.verify_mode == ssl.CERT_REQUIRED and context.check_hostname
    return pick(result.startswith('ValueError') and still_checking, {True: 'Raises ValueError: hostname checking must be turned off first'})


def cookies():
    with local_server() as server:
        _, headers, _ = fetch(server, '/cookie')
    jar = http.cookies.SimpleCookie(headers['Set-Cookie'])
    morsel = jar['session']
    flags = (morsel['path'], bool(morsel['httponly']), morsel['samesite'], bool(morsel['secure']))
    return pick(flags, {('/', True, 'Lax', False): 'Path=/, HttpOnly and SameSite=Lax, but not Secure'})


def browser_boundaries():
    same = origin('https://lessons.test') == origin('https://lessons.test:443/read')
    return pick(same, {True: 'Yes: 443 is the default HTTPS port'})


def cache():
    shared = SharedCache()
    stored = shared.store_public('lesson', b'private body', 5, 10, private=True)
    return pick((stored, shared.get('lesson', 10)), {(False, None): 'Returns False and stores nothing'})


def validators():
    with local_server() as server:
        code, headers, body = fetch(server, '/lesson', headers={'If-None-Match': '"lesson-v2"'})
    return pick((code, headers.get('ETag'), body == BODY), {(200, '"lesson-v1"', True): '200 with the full body and ETag "lesson-v1"'})


def redirects():
    with local_server() as server:
        code, headers, _ = fetch(server, '/redirect')
    if (code, headers.get('Location')) != (307, '/lesson'):
        raise AssertionError('the lab redirect is no longer 307 to /lesson')
    return urljoin('http://127.0.0.1:8080/a/redirect', headers['Location'])


def timeouts():
    with local_server() as server:
        result = outcome(lambda: fetch(server, '/stall', timeout=0.15))
        reached = server.started.wait(timeout=2)
    return pick((result.split(':')[0], reached), {('TimeoutError', True): 'Yes: the handler had started; the client only stopped waiting'})


def retry_budgets():
    calls = []

    def call():
        calls.append(1)
        return 503
    status, traces = bounded_get(call, lambda: 0, deadline=1, max_attempts=3)
    return pick((len(calls), status, len(traces)), {(3, 503, 3): '3, then it returns 503 with three trace entries'})


def body_contracts():
    result = outcome(lambda: decode_observation(200, JSON, b'{"lesson":"http","version":true}'))
    return pick(result, {'ProtocolError: invalid lesson contract': 'ProtocolError: true is a boolean, not an integer version'})


def diagnostics():
    outcomes = iter([503, 200])
    _, traces = bounded_get(lambda: next(outcomes), lambda: 0, deadline=1)
    expected = [{'attempt': 1, 'status': 503}, {'attempt': 2, 'status': 200}]
    return pick(traces == expected, {True: 'Only attempt and status'})


def foundation_origin():
    return str(origin('http://Example.test/read'))


def foundation_ttl():
    result = outcome(lambda: DnsCache().remember('lessons.example', '192.0.2.10', 2.5, 0))
    return pick(result, {'ValueError: nonnegative TTL required': 'Raises ValueError: the TTL must be a nonnegative whole number'})


def foundation_split():
    return str(exchange([b'caf\xc3', b'\xa9\nsecond\n']))


def intermediate_max_age():
    with local_server() as server:
        _, headers, _ = fetch(server, '/lesson')
    return pick(headers.get('Cache-Control'), {'public, max-age=5': '5 seconds'})


def intermediate_private():
    with local_server() as server:
        code, headers, _ = fetch(server, '/private', headers={'Cookie': 'session=synthetic'})
    if code != 200:
        raise AssertionError(f'/private with the cookie returned {code}')
    return headers.get('Cache-Control')


def intermediate_head_missing():
    with local_server() as server:
        code, _, body = fetch(server, '/missing', method='HEAD')
    return pick((code, body), {(404, b''): '404 with an empty body'})


def advanced_deadline():
    calls = []
    result = outcome(lambda: bounded_get(lambda: calls.append(1) or 200, lambda: 5, deadline=1))
    return pick((result, len(calls)), {('TimeoutError: overall deadline exhausted', 0): 'It raises TimeoutError and makes no call'})


def advanced_charset():
    value = decode_observation(200, {'Content-Type': 'application/json; charset=utf-8'}, BODY)
    return pick(value == json.loads(BODY), {True: 'It is accepted: the media type before the parameters is application/json'})


def advanced_extra():
    result = outcome(lambda: decode_observation(200, JSON, b'{"lesson":"http","version":1,"extra":true}'))
    return pick(result, {'ProtocolError: invalid lesson contract': 'ProtocolError: the contract allows exactly the fields lesson and version'})


FACTS = {
    'request-journey/2': request_journey, 'addresses-ports/2': addresses_ports, 'dns/2': dns, 'dns-cache/2': dns_cache,
    'transport/2': transport, 'urls-origins/2': urls_origins, 'encoding/2': encoding, 'http-message/2': http_message,
    'status/2': status, 'methods-retries/2': methods_retries, 'tls/2': tls, 'certificates/2': certificates,
    'cookies/2': cookies, 'browser-boundaries/2': browser_boundaries, 'cache/2': cache, 'validators/2': validators,
    'redirects/2': redirects, 'timeouts/2': timeouts, 'retry-budgets/2': retry_budgets,
    'body-contracts/2': body_contracts, 'diagnostics/2': diagnostics,
    'stage/foundation/1': foundation_origin, 'stage/foundation/2': foundation_ttl, 'stage/foundation/3': foundation_split,
    'stage/intermediate/1': intermediate_max_age, 'stage/intermediate/2': intermediate_private,
    'stage/intermediate/3': intermediate_head_missing,
    'stage/advanced/1': advanced_deadline, 'stage/advanced/2': advanced_charset, 'stage/advanced/3': advanced_extra,
}


def questions():
    data = json.loads((COURSE / 'checkpoints.json').read_text(encoding='utf-8'))
    for lesson, items in data['lessons'].items():
        for i, q in enumerate(items):
            yield f'{lesson}/{i + 2}', q
    for stage, items in data['stages'].items():
        for i, q in enumerate(items):
            yield f'stage/{stage}/{i + 1}', q


def main():
    seen, failures = set(), []
    for key, q in questions():
        seen.add(key)
        if key in SOURCED:
            continue
        if key not in FACTS:
            failures.append(f'{key}: no fact check and no cited source'); continue
        try:
            answer = FACTS[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}'); continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('Networking checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Networking checkpoint answers checked against the course labs; {len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
