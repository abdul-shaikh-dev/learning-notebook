"""Corrected keyset page for a finite, unchanged list of unique row IDs.
Trusted input: rows contain integer time and string id. Nested fields unsupported.
"""
def page(rows, after=None, limit=2):
    if type(limit) is not int or not 1 <= limit <= 100:
        raise ValueError('limit 1..100 required')
    ordered=sorted(rows,key=lambda row:(row['time'],row['id']))
    if after is not None:ordered=[row for row in ordered if (row['time'],row['id'])>after]
    selected=[dict(row) for row in ordered[:limit]]
    cursor=(selected[-1]['time'],selected[-1]['id']) if selected else None
    return selected,cursor
