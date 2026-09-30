"""Lookup-only benchmark: index creation intentionally excluded; see README."""
import json,platform,statistics,time
def linear(rows,queries):return [next((r["value"] for r in rows if r["id"]==q),None) for q in queries]
def indexed(index,queries):return [index.get(q) for q in queries]
def measure(fn,repeats=7):
 values=[]
 for _ in range(repeats):
  start=time.perf_counter();fn();values.append((time.perf_counter()-start)*1000)
 return {"median_ms":statistics.median(values),"min_ms":min(values),"max_ms":max(values),"samples":len(values)}
if __name__=="__main__":
 rows=[{"id":i,"value":i*3} for i in range(5000)];queries=list(range(0,5000,5))+[99999];index={r["id"]:r["value"] for r in rows}
 a=lambda:linear(rows,queries);b=lambda:indexed(index,queries)
 assert a()==b();a();b()
 print(json.dumps({"runtime":platform.python_version(),"rows":len(rows),"queries":len(queries),"boundary":"lookup batches only; index construction excluded","equivalent":True,"linear":measure(a),"indexed":measure(b)},indent=2))
