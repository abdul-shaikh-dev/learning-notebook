"""Pure validation reference; deliberate buggy mutant supplied for diagnosis."""
import json

def parse_record(text):
    if not isinstance(text, str) or len(text) > 4096:
        raise ValueError("record text required within 4096 characters")
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("duplicate key")
            result[key] = value
        return result
    try:
        record = json.loads(text, object_pairs_hook=pairs)
    except json.JSONDecodeError as error:
        raise ValueError("invalid JSON") from error
    if type(record) is not dict or set(record) != {"id", "minutes"}:
        raise ValueError("exact fields id and minutes required")
    if type(record["id"]) is not str or not record["id"].strip() or len(record["id"]) > 100:
        raise ValueError("invalid id")
    if type(record["minutes"]) is not int or not 0 <= record["minutes"] <= 1440:
        raise ValueError("minutes must be an integer from 0 to 1440")
    return record

def total_minutes(records):
    return sum(record["minutes"] for record in records)

def buggy_minutes(value):
    """Mutant: bool is an int subclass, so this admits True. Do not use in importer."""
    if not isinstance(value, int) or value < 0:
        raise ValueError("minutes required")
    return value

if __name__ == "__main__":
    print(total_minutes([parse_record('{"id":"a","minutes":5}')]))
