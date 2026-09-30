"""Small local analysis reference, not a production telemetry SDK."""
import math
def percentile(values, p):
    if not values or not 0 < p <= 1: raise ValueError("nonempty sample and 0<p<=1 required")
    if any(not isinstance(v,(int,float)) or isinstance(v,bool) or not math.isfinite(v) or v<0 for v in values): raise ValueError("durations must be finite nonnegative numbers")
    data=sorted(values)
    return data[math.ceil(p*len(data))-1]
def summary(rows, threshold_ms=100):
    if threshold_ms<0 or not math.isfinite(threshold_ms): raise ValueError("invalid threshold")
    if not rows: return {"count":0,"good":0,"bad":0,"good_fraction":None,"p50_ms":None,"p95_ms":None}
    durations=[r["duration_ms"] for r in rows]
    percentile(durations,.5)
    if any(not isinstance(r["status"],int) or isinstance(r["status"],bool) or not 100<=r["status"]<=599 for r in rows): raise ValueError("invalid status")
    good=sum(200<=r["status"]<300 and r["duration_ms"]<=threshold_ms for r in rows)
    return {"count":len(rows),"good":good,"bad":len(rows)-good,"good_fraction":good/len(rows),"p50_ms":percentile(durations,.5),"p95_ms":percentile(durations,.95)}
def burn_rate(good_fraction,target):
    if not 0<=good_fraction<=1 or not 0<target<1: raise ValueError("invalid fractions")
    return (1-good_fraction)/(1-target)
