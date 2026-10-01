"""Investigation candidate. Reported symptoms are in cursor-investigation.md."""
def page(rows, after=None, limit=2):
    ordered=sorted(rows,key=lambda row:(row['time'],row['id']))
    if after is not None:ordered=[row for row in ordered if row['time']>after[0]]
    selected=ordered[:limit]
    cursor=(selected[-1]['time'],selected[-1]['id']) if selected else None
    return selected,cursor
