"""Small auditable metrics and fictional records. Python standard library only."""
import hashlib
import json
import math
import random
from datetime import date, timedelta

FEATURES = ("channel", "priority", "team", "customer_messages")

def paired(actual, predicted):
    actual, predicted = list(actual), list(predicted)
    if not actual or len(actual) != len(predicted):
        raise ValueError("Require equal nonempty sequences")
    return actual, predicted

def confusion(actual, predicted):
    actual, predicted = paired(actual, predicted)
    if any(x not in (0, 1) for x in actual + predicted):
        raise ValueError("Binary labels must be 0 or 1")
    counts = dict(tp=0, fp=0, fn=0, tn=0)
    for truth, guess in zip(actual, predicted):
        key = "tp" if truth and guess else "fn" if truth else "fp" if guess else "tn"
        counts[key] += 1
    tp, fp, fn, tn = (counts[k] for k in ("tp", "fp", "fn", "tn"))
    return dict(**counts, n=len(actual), precision=tp/(tp+fp) if tp+fp else None,
                recall=tp/(tp+fn) if tp+fn else None, accuracy=(tp+tn)/len(actual))

def mae(actual, predicted):
    actual, predicted = paired(actual, predicted)
    if not all(math.isfinite(float(x)) for x in actual + predicted):
        raise ValueError("Require finite numbers")
    return sum(abs(a-b) for a,b in zip(actual,predicted))/len(actual)

def classify(probabilities, threshold):
    if not math.isfinite(threshold) or not 0 <= threshold <= 1:
        raise ValueError("Threshold must be in [0,1]")
    probabilities = list(probabilities)
    if any(not math.isfinite(x) or not 0 <= x <= 1 for x in probabilities):
        raise ValueError("Probabilities must be in [0,1]")
    return [int(p >= threshold) for p in probabilities]

def cost(counts):
    return 4*counts['fn'] + counts['fp']

def choose_threshold(actual, probabilities, candidates=(0.3,0.5,0.7)):
    actual, probabilities = paired(actual, probabilities)
    if not candidates:
        raise ValueError("Require candidate thresholds")
    # A predeclared tie break prefers the higher threshold.
    return min(candidates, key=lambda t: (cost(confusion(actual,classify(probabilities,t))),-t))

def make_tickets(n=240, seed=23):
    if n < 10:
        raise ValueError("Require at least ten fictional rows")
    rng=random.Random(seed)
    rows=[]
    for i in range(n):
        channel=rng.choice(['email','chat'])
        priority=rng.choice(['low','high'])
        team=rng.choice(['billing','technical'])
        messages=rng.randint(1,8)
        # The outcome is generated after intake. It is not an allowed input.
        hours=round(max(1,min(23,4+1.3*messages+3*(team=='technical')+2*(priority=='high')+rng.uniform(-4,4))),2)
        # Breaches use a duration above 24 but below 48. Rows are two days apart,
        # so every training outcome is available before the next intake.
        if rng.random() < min(0.9,0.05+0.07*messages+0.12*(team=='technical')):
            hours=round(25+rng.uniform(0,20),2)
        rows.append(dict(ticket_id=f'M{i+1:04}',customer_id=f'C{i%60:03}',
            created_date=(date(2024,1,1)+timedelta(days=2*i)).isoformat(),
            channel=channel,priority=priority,team=team,customer_messages=messages,
            resolution_hours=hours,breached=int(hours>24)))
    return rows

def time_split(rows):
    if len(rows)<10:
        raise ValueError("Require at least ten rows")
    dates=[r['created_date'] for r in rows]
    if any(a>=b for a,b in zip(dates,dates[1:])):
        raise ValueError("Dates must strictly increase for this teaching splitter")
    ids=[r['ticket_id'] for r in rows]
    if len(set(ids))!=len(ids):
        raise ValueError("Duplicate ticket IDs")
    a,b=int(len(rows)*0.6),int(len(rows)*0.8)
    return rows[:a], rows[a:b], rows[b:]

def group_split(rows, held_out):
    held_out=set(held_out)
    train=[r for r in rows if r['customer_id'] not in held_out]
    test=[r for r in rows if r['customer_id'] in held_out]
    if not train or not test:
        raise ValueError("Require rows on both sides")
    return train,test

def matrix(rows):
    return [[r[key] for key in FEATURES] for r in rows]

def fingerprint(rows):
    return hashlib.sha256(json.dumps(rows,sort_keys=True,separators=(',',':')).encode()).hexdigest()

if __name__ == '__main__':
    rows=make_tickets()
    print(json.dumps(dict(counts=confusion([1,0,1,0],[1,1,0,0]),
        mae=mae([4,10],[6,6]),split_sizes=[len(x) for x in time_split(rows)],
        data_sha256=fingerprint(rows)),indent=2))
