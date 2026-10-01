"""Tangled, correct starter: preserve these observations while refactoring.
All storage is an in-memory fixture. No concurrent or durable guarantee.
"""
import json

def export_batch(rows, actor, kind, expected_version, store):
    if type(expected_version) is not int or expected_version != store.version:
        raise ValueError('stale version')
    if kind not in ('lines','json'): raise ValueError('unknown format')
    checked=[]; seen=set()
    for row in rows:
        if type(row) is not dict or set(row) != {'id','owner','title'}:
            raise ValueError('invalid shape')
        if row['owner'] != actor: raise PermissionError('not owned')
        if not isinstance(row['id'],str) or not row['id'] or row['id'] in seen:
            raise ValueError('duplicate or invalid id')
        if not isinstance(row['title'],str) or not row['title'].strip():
            raise ValueError('blank title')
        seen.add(row['id']); checked.append(row['title'].strip())
    if kind=='lines': payload='\n'.join(checked)
    else: payload=json.dumps(checked,ensure_ascii=False)
    # The fixture makes one deliberate commit after all checks and formatting.
    store.replace(expected_version,payload,len(checked))
    return payload
