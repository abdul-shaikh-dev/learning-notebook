"""Offline freshness, redacted traces and retry state with an injected clock."""
import json
import math
from network_foundation import retry_allowed

class ProtocolError(Exception): pass

def decode_observation(status,headers,body):
    headers={name.lower(): value for name,value in headers.items()}
    if status!=200: raise ProtocolError(f"unexpected status {status}")
    if headers.get("content-type","").split(";",1)[0].strip().lower()!="application/json":
        raise ProtocolError("expected JSON content type")
    if len(body)>4096: raise ProtocolError("response too large")
    try: value=json.loads(body.decode("utf-8",errors="strict"))
    except (ValueError,UnicodeError) as error: raise ProtocolError("invalid JSON") from error
    if type(value) is not dict or set(value)!={"lesson","version"} or type(value["lesson"]) is not str or type(value["version"]) is not int:
        raise ProtocolError("invalid lesson contract")
    return value

class SharedCache:
    def __init__(self): self.rows={}
    def store_public(self,key,body,max_age,now,private=False):
        if private: return False
        if type(max_age) is not int or max_age<0: raise ValueError("invalid max-age")
        self.rows[key]=(body,now+max_age)
        return True
    def get(self,key,now):
        row=self.rows.get(key)
        return row[0] if row and now < row[1] else None

def bounded_get(call,clock,deadline,max_attempts=3):
    if type(max_attempts) is not int or not 1<=max_attempts<=10 or not math.isfinite(deadline):
        raise ValueError("invalid retry budget")
    traces=[]
    for attempt in range(1,max_attempts+1):
        if clock()>=deadline: raise TimeoutError("overall deadline exhausted")
        status=call()
        traces.append({"attempt":attempt,"status":status})
        if status not in {502,503,504}: return status,traces
        if not retry_allowed("GET",attempt,max_attempts,deadline-clock()): return status,traces
    return status,traces

if __name__=="__main__":
    outcomes=iter([503,200])
    print(bounded_get(lambda:next(outcomes),lambda:0,deadline=1))
