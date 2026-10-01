"""One batch contract split at actual reasons to change."""
import json
from dataclasses import dataclass

@dataclass(frozen=True)
class Snapshot:
    version: int
    payload: str
    history: tuple

class MemoryStore:
    """Single-threaded fixture; failure injection happens BEFORE replacement."""
    def __init__(self):
        self.snapshot=Snapshot(0,'previous',())
        self.fail=False
    @property
    def version(self):return self.snapshot.version
    def replace(self,expected,payload,count):
        if expected != self.version: raise ValueError('stale version')
        if self.fail: raise OSError('injected before commit')
        self.snapshot=Snapshot(self.version+1,payload,self.snapshot.history+(count,))

def prepare_titles(rows,actor):
    titles=[]; seen=set()
    for row in rows:
        if type(row) is not dict or set(row)!={'id','owner','title'}:
            raise ValueError('invalid shape')
        if row['owner']!=actor:raise PermissionError('not owned')
        if not isinstance(row['id'],str) or not row['id'] or row['id'] in seen:
            raise ValueError('duplicate or invalid id')
        if not isinstance(row['title'],str) or not row['title'].strip():
            raise ValueError('blank title')
        seen.add(row['id']); titles.append(row['title'].strip())
    return titles

FORMATTERS={'lines':lambda titles:'\n'.join(titles),
            'json':lambda titles:json.dumps(titles,ensure_ascii=False)}

def export_batch(rows,actor,kind,expected_version,store):
    if type(expected_version) is not int or expected_version!=store.version:
        raise ValueError('stale version')
    if kind not in FORMATTERS:raise ValueError('unknown format')
    titles=prepare_titles(rows,actor)
    payload=FORMATTERS[kind](titles)
    store.replace(expected_version,payload,len(titles))
    return payload
