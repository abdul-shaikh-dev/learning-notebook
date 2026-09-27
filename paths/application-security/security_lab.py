"""Offline, synthetic security boundaries. Python 3.11+ standard library.

Principal means already authenticated by a trusted adapter. This module does
not decode/sign/verify JWTs and must not accept a Principal from request JSON.
No web server, credentials, network, password storage or IdP integration.
"""
from dataclasses import dataclass
from html import escape
from secrets import token_urlsafe, compare_digest
import sqlite3

@dataclass(frozen=True)
class Principal:
    subject: str
    tenant: str
    role: str='member'

DOCUMENTS={
    'a':{'tenant':'red','owner':'alice','title':'Alice private'},
    'b':{'tenant':'red','owner':'bob','title':'Bob private'},
    'c':{'tenant':'blue','owner':'alice','title':'Other tenant'},
}

def authorized(principal,document,action):
    if principal is None or action not in {'read','update'}:
        return False
    if principal.tenant!=document['tenant']:
        return False
    return principal.subject==document['owner'] or (principal.role=='reader' and action=='read')

def read_document(principal,id):
    document=DOCUMENTS.get(id)
    # Deliberately indistinguishable missing/denied result at this boundary.
    if document is None or not authorized(principal,document,'read'):
        raise PermissionError('document unavailable')
    return dict(document)

def validated_title(value):
    if not isinstance(value,str): raise ValueError('title must be text')
    title=value.strip()
    if not 1<=len(title)<=80 or not title.isprintable():
        raise ValueError('title must contain 1..80 printable characters')
    return title

def parse_update(body):
    if not isinstance(body,dict) or set(body)!={'title'}:
        raise ValueError('only title may be updated')
    return {'title':validated_title(body['title'])}

def title_html(title):
    # Text node context only; not JavaScript, CSS, raw HTML or URL context.
    return '<h1>'+escape(validated_title(title),quote=True)+'</h1>'

def find_title(connection,title):
    return connection.execute('SELECT title FROM documents WHERE title=?',(title,)).fetchall()

def synthetic_database():
    connection=sqlite3.connect(':memory:')
    connection.execute('CREATE TABLE documents(title TEXT NOT NULL)')
    connection.executemany('INSERT INTO documents VALUES(?)',[('Alice private',),('Bob private',)])
    return connection

class Sessions:
    """Opaque local sessions with injected time; no browser/server guarantee."""
    def __init__(self): self.records={}
    def login(self,principal,now,previous=None):
        if previous is not None: self.records.pop(previous,None)
        id=token_urlsafe(32)
        self.records[id]=(principal,now+300,token_urlsafe(32))
        return id
    def identity(self,id,now):
        record=self.records.get(id)
        if record is None or now>=record[1]: raise PermissionError('session unavailable')
        return record[0]
    def csrf(self,id,token,now):
        self.identity(id,now)
        expected=self.records[id][2]
        if not isinstance(token,str) or not token.isascii() or not compare_digest(token,expected):
            raise PermissionError('csrf verification failed')
    def logout(self,id): self.records.pop(id,None)

def safe_audit(event,subject,outcome):
    allowed={'document.read','document.update','login'}
    if event not in allowed or outcome not in {'allowed','denied'}: raise ValueError('unknown event')
    if not isinstance(subject,str) or not 1<=len(subject)<=80 or not subject.isprintable():
        raise ValueError('invalid audit subject')
    # Caller uses an internal pseudonymous subject, never bearer/password/body.
    return {'event':event,'subject':subject,'outcome':outcome}

class FixedWindowLimiter:
    """Single-process illustration; trusted monotonic injected time required."""
    def __init__(self,limit=3,seconds=60):
        if type(limit) is not int or limit<1 or type(seconds) is not int or seconds<1:
            raise ValueError('positive integer limits required')
        self.limit,self.seconds,self.counts=limit,seconds,{}
    def allow(self,key,now):
        window=int(now//self.seconds)
        old,count=self.counts.get(key,(window,0))
        count=count if old==window else 0
        if count>=self.limit: return False
        self.counts[key]=(window,count+1)
        return True
