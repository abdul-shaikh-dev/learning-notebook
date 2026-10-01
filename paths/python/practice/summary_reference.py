"""Reference for the independent session-summary challenge; no file or network I/O."""
def summarize(rows):
    """Exact input shape, unique IDs, nonnegative integer minutes, trimmed topics."""
    totals, seen = {}, set()
    for row in rows:
        if type(row) is not dict or set(row) != {'id', 'topic', 'minutes'}:
            raise ValueError('fields must be id, topic, minutes')
        identity, topic, minutes = row['id'], row['topic'], row['minutes']
        if not isinstance(identity, str) or not identity or identity in seen:
            raise ValueError('unique nonempty id required')
        if not isinstance(topic, str) or not topic.strip():
            raise ValueError('nonempty topic required')
        if type(minutes) is not int or not 0 <= minutes <= 1440:
            raise ValueError('minutes must be an integer from 0 to 1440')
        seen.add(identity)
        normalized = topic.strip()
        totals[normalized] = totals.get(normalized, 0) + minutes
    return sorted(totals.items(), key=lambda pair: (-pair[1], pair[0]))
