"""Fact checks for the Application Security checkpoint answers.

Each fact runs the course's offline labs (paths/application-security/security_lab.py, the loopback HTTP
seam in security_http.py and the login bookkeeping in login_flow_lab.py) and returns the text of the
option its result supports. The script fails if that differs from the authored correct option. The HTTP
seam listens on 127.0.0.1 only and uses synthetic sessions; no credentials or outside network are used.
Run with Python 3.11+: python tests/application_security_checkpoint_facts.py
"""
from contextlib import closing, contextmanager
import http.client
import json
from pathlib import Path
import sqlite3
import sys
from tempfile import TemporaryDirectory
import threading

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'application-security'
sys.path.insert(0, str(COURSE))
import security_lab as lab  # noqa: E402
from security_lab import FixedWindowLimiter, Principal, Sessions  # noqa: E402
import security_http  # noqa: E402
from login_flow_lab import Pending  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'cookies-transport/2': 'A __Host- cookie requires Secure, Path=/ and no Domain, lesson 7',
    'passwords-mfa/2': 'Salted password hashing with a work factor, not encryption or a fast hash, lesson 8',
    'oauth-roles/2': 'Access token scope is not a substitute for ownership policy, lesson 12',
    'oidc-login/2': 'Stable subject identity includes the issuer; email is not a permanent key, lesson 13',
    'token-validation/2': 'Signature success alone is insufficient; audience and issuer must match, lesson 15',
    'secrets/2': 'Environment variables can leak through diagnostics or error reporting, lesson 16',
    'dependencies/2': 'A README version does not prove the deployed artifact, lesson 18',
    'incident-recovery/2': 'Fix server authorization and test every alternate endpoint, lesson 21',
}

ALICE = Principal('alice', 'red')


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


@contextmanager
def seam():
    """Start the loopback HTTP seam with a synthetic session for Alice."""
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        file = str(Path(folder) / 'docs.db')
        security_http.initialize(file)
        sessions = Sessions()
        sid = sessions.login(ALICE, 0)
        server = security_http.make_server(file, sessions)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield server, sid, sessions.records[sid][2], file
        finally:
            server.shutdown()
            server.server_close()


def patch(server, document, sid, csrf=None, body=None, content_type='application/json'):
    data = json.dumps({'title': 'Changed'} if body is None else body).encode('utf-8')
    headers = {'Cookie': f'sid={sid}', 'Content-Type': content_type, 'Content-Length': str(len(data))}
    if csrf is not None:
        headers['X-CSRF-Token'] = csrf
    with closing(http.client.HTTPConnection('127.0.0.1', server.server_address[1], timeout=5)) as connection:
        connection.request('PATCH', f'/documents/{document}', body=data, headers=headers)
        response = connection.getresponse()
        return response.status, json.loads(response.read())


def title(file, document):
    with closing(sqlite3.connect(file)) as db:
        return db.execute('SELECT title FROM documents WHERE id=?', (document,)).fetchone()[0]


def assets_threats():
    denied = outcome(lambda: lab.read_document(ALICE, 'b'))
    missing = outcome(lambda: lab.read_document(ALICE, 'zzz'))
    return pick((denied, missing == denied), {('PermissionError: document unavailable', True):
                                              'The same PermissionError, document unavailable, for both'})


def identity_principals():
    bob = Principal('bob', 'red', 'reader')
    doc = lab.DOCUMENTS['a']
    return pick((lab.authorized(bob, doc, 'read'), lab.authorized(bob, doc, 'update')),
                {(True, False): 'Read, but not update', (True, True): 'Read and update',
                 (False, False): 'Neither, because Bob is not the owner'})


def authentication_boundary():
    sessions = Sessions()
    sid = sessions.login('not-a-principal', 0)
    return pick(sessions.identity(sid, 1), {'not-a-principal': 'It issues a session and identity() returns the string'})


def authorization_ownership():
    return pick(lab.authorized(ALICE, lab.DOCUMENTS['a'], 'delete'), {False: 'False: delete is not an allowed action'})


def input_contracts():
    return outcome(lambda: lab.parse_update({'title': 'Plan\nB'})).replace('ValueError: ', 'Raises ValueError: ', 1)


def sessions_rotation():
    sessions = Sessions()
    first = sessions.login(ALICE, 0)
    sessions.login(ALICE, 5, previous=first)
    return outcome(lambda: sessions.identity(first, 10)).replace('PermissionError: ', 'Raises PermissionError: ', 1)


def csrf():
    with seam() as (server, sid, _, _file):
        return str(patch(server, 'a', sid)[0])


def xss_context():
    return lab.title_html('<b>Hi</b>')


def sql_injection():
    with closing(lab.synthetic_database()) as db:
        return str(len(lab.find_title(db, "x' OR '1'='1")))


def logging():
    return outcome(lambda: lab.safe_audit('document.delete', 'u-17', 'allowed')).replace('ValueError: ', 'Raises ValueError: ', 1)


def abuse_limits():
    limiter = FixedWindowLimiter(3, 60)
    allowed = tuple(limiter.allow('k', now) for now in (0, 10, 20, 59, 60))
    return pick(allowed, {(True, True, True, False, True): 'The first three and the one at 60',
                          (True, True, True, False, False): 'The first three only'})


def verification():
    readable = []
    for document in ('a', 'b', 'c'):
        try:
            lab.read_document(ALICE, document)
            readable.append(document)
        except PermissionError:
            pass
    return pick(tuple(readable), {('a',): 'a only', ('a', 'c'): 'a and c', ('a', 'b', 'c'): 'a, b and c'})


def pkce_state():
    flows = Pending()
    flows.begin('A', 'original', 0)
    second = outcome(lambda: flows.begin('A', 'replacement', 1))
    return pick((second.split(':')[0], flows.consume('A', 2)),
                {('ValueError', 'original'): "'original': the second begin raised ValueError"})


def foundation_expiry():
    sessions = Sessions()
    sid = sessions.login(ALICE, 0)
    before = outcome(lambda: sessions.identity(sid, 299))
    at = outcome(lambda: sessions.identity(sid, 300))
    return pick((before == ALICE, at),
                {(True, 'PermissionError: session unavailable'):
                 'Returns the principal at 299; raises PermissionError at 300'})


def foundation_logout():
    sessions = Sessions()
    sid = sessions.login(ALICE, 0)
    token = sessions.records[sid][2]
    sessions.logout(sid)
    return outcome(lambda: sessions.csrf(sid, token, 1)).replace('PermissionError: ', 'Raises PermissionError: ', 1)


def foundation_title():
    letters = 'a' * 80
    return pick(lab.validated_title(f'  {letters}  ') == letters, {True: 'The 80 letters, with the spaces stripped'})


def intermediate_other_owner():
    with seam() as (server, sid, token, file):
        status, body = patch(server, 'b', sid, token)
        return pick((status, body.get('error'), title(file, 'b')),
                    {(404, 'unavailable', 'Bob private'): '404 unavailable, and the title is unchanged'})


def intermediate_content_type():
    with seam() as (server, sid, token, _file):
        status, body = patch(server, 'a', sid, token, content_type='text/plain')
        return f'{status} {body["error"]}'


def intermediate_tabs():
    flows = Pending()
    flows.begin('A', 'verifier-A', 0)
    flows.begin('B', 'verifier-B', 1)
    results = (flows.consume('B', 2), flows.consume('A', 3), outcome(lambda: flows.consume('A', 4)).split(':')[0])
    return pick(results, {('verifier-B', 'verifier-A', 'ValueError'): "B's verifier, then A's, then ValueError"})


def advanced_keys():
    limiter = FixedWindowLimiter(3, 60)
    for now in (1, 2, 3):
        limiter.allow('alice', now)
    return pick((limiter.allow('alice', 5), limiter.allow('bob', 5)), {(False, True): 'Yes: each key has its own count'})


def advanced_audit_subject():
    return outcome(lambda: lab.safe_audit('login', 's' * 81, 'allowed')).replace('ValueError: ', 'Raises ValueError: ', 1)


def advanced_tenant():
    with seam() as (server, sid, token, file):
        status, body = patch(server, 'c', sid, token)
        return pick((status, body.get('error'), title(file, 'c')),
                    {(404, 'unavailable', 'Other tenant'): '404 unavailable, and the title is unchanged'})


FACTS = {
    'assets-threats/2': assets_threats, 'identity-principals/2': identity_principals,
    'authentication-boundary/2': authentication_boundary, 'authorization-ownership/2': authorization_ownership,
    'input-contracts/2': input_contracts, 'sessions/2': sessions_rotation, 'csrf/2': csrf,
    'xss-context/2': xss_context, 'sql-injection/2': sql_injection, 'pkce-state/2': pkce_state,
    'logging/2': logging, 'abuse-limits/2': abuse_limits, 'verification/2': verification,
    'stage/foundation/1': foundation_expiry, 'stage/foundation/2': foundation_logout,
    'stage/foundation/3': foundation_title,
    'stage/intermediate/1': intermediate_other_owner, 'stage/intermediate/2': intermediate_content_type,
    'stage/intermediate/3': intermediate_tabs,
    'stage/advanced/1': advanced_keys, 'stage/advanced/2': advanced_audit_subject, 'stage/advanced/3': advanced_tenant,
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
            failures.append(f'{key}: no fact check and no cited source')
            continue
        try:
            answer = FACTS[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}')
            continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('Application Security checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Application Security checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
