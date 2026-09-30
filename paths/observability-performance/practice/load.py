"""20 requests, four closed-loop workers, loopback-only fixed target."""
import argparse,concurrent.futures,json,time,urllib.request,urllib.error
from telemetry import summary
def run_one(n,profile):
 start=time.perf_counter()
 try:
  with urllib.request.urlopen(f"http://127.0.0.1:8891/work?n={n}&profile={profile}",timeout=3) as response:response.read();status=response.status
 except urllib.error.HTTPError as error:
  with error:status=error.code;error.read()
 return {"request_id":f"lab-{n}","status":status,"duration_ms":(time.perf_counter()-start)*1000}
if __name__=="__main__":
 parser=argparse.ArgumentParser();parser.add_argument("--profile",choices=["healthy","slow","fail"],default="healthy");args=parser.parse_args();start=time.perf_counter()
 try:
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(lambda n:run_one(n,args.profile),range(1,21)))
 except (OSError,urllib.error.URLError) as error:parser.exit(1,f"Local service unavailable: {error}. Start service.py first.\n")
 elapsed=time.perf_counter()-start
 print(json.dumps({"profile":args.profile,"model":"four-worker closed loop","elapsed_s":elapsed,"achieved_requests_s":len(rows)/elapsed,"analysis":summary(rows,100),"rows":rows},indent=2))
