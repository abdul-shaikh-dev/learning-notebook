"""Single-process event revision projection. No streaming service or CDC connector."""
import sqlite3
from contextlib import closing

def initialize(db):
    db.execute("CREATE TABLE IF NOT EXISTS current_order(id TEXT PRIMARY KEY, revision INTEGER, day TEXT, cents INTEGER, deleted INTEGER)")
    db.commit()

def apply(db, event):
    if set(event) != {'id','revision','day','cents','deleted'}:
        raise ValueError('exact event fields required')
    if not isinstance(event['id'],str) or not event['id'] or type(event['revision']) is not int or event['revision']<1:
        raise ValueError('identity and positive revision required')
    if type(event['deleted']) is not bool or type(event['cents']) is not int or event['cents']<0:
        raise ValueError('invalid amount or tombstone')
    from datetime import date
    if not isinstance(event['day'],str) or date.fromisoformat(event['day']).isoformat()!=event['day']:
        raise ValueError('ISO date required')
    if event['deleted'] and event['cents']:
        raise ValueError('tombstone amount must be zero')
    values=(event['revision'],event['day'],event['cents'],int(event['deleted']))
    with db:
        old=db.execute('SELECT revision,day,cents,deleted FROM current_order WHERE id=?',(event['id'],)).fetchone()
        if old:
            if old[0]>values[0]:return 'stale'
            if old[0]==values[0]:
                if old!=values:raise ValueError('conflicting revision')
                return 'replay'
        db.execute('INSERT OR REPLACE INTO current_order VALUES(?,?,?,?,?)',(event['id'],*values))
    return 'applied'

def totals(db):
    return dict(db.execute('SELECT day,SUM(cents) FROM current_order WHERE deleted=0 GROUP BY day'))

def event(revision,cents=100,day='2026-09-28',deleted=False):
    return dict(id='A',revision=revision,day=day,cents=cents,deleted=deleted)

if __name__=='__main__':
    with closing(sqlite3.connect(':memory:')) as db:
        initialize(db)
        for e in [event(1),event(2,150),event(1),event(3,0,deleted=True),event(2,150)]:
            print(apply(db,e),totals(db))
