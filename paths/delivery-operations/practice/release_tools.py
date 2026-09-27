"""Offline helpers, not a deployment orchestrator."""
import argparse
import hashlib
import json
from pathlib import Path
import statistics
import time
import urllib.error
import urllib.request
from release_app import backup

def digest(file):return hashlib.sha256(Path(file).read_bytes()).hexdigest()
def budget(total,errors,target):
    if total<=0 or not 0<=errors<=total or not 0<target<1:raise ValueError("Invalid SLO inputs")
    allowed=total*(1-target);return {"allowed_bad":round(allowed,8),"bad":errors,"remaining":round(allowed-errors,8),"burn_rate":errors/allowed}
def percentile(values,p):
    if not values:raise ValueError("No samples")
    return sorted(values)[min(len(values)-1,max(0,int(len(values)*p+0.999999)-1))]

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):return None

def local_load(url,count=50):
    from urllib.parse import urlparse
    parsed=urlparse(url)
    if parsed.scheme!="http" or parsed.hostname not in {"127.0.0.1","localhost"} or parsed.username is not None or parsed.password is not None or parsed.fragment or not isinstance(count,int) or not 1<=count<=200:
        raise ValueError("Loopback HTTP URL without credentials/fragments and 1..200 requests required")
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    samples=[];errors=0
    for _ in range(count):
        start=time.perf_counter()
        try:
            with opener.open(url,timeout=2) as response:
                if len(response.read(65537))>65536:raise ValueError("Response exceeds 64KiB")
        except urllib.error.HTTPError as error:
            error.close();errors+=1
        except (urllib.error.URLError,TimeoutError,ValueError):errors+=1
        samples.append((time.perf_counter()-start)*1000)
    return {"model":"sequential closed-loop","requests":count,"errors":errors,"p50_ms":percentile(samples,.5),"p95_ms":percentile(samples,.95)}

if __name__=="__main__":
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest="cmd",required=True)
    d=sub.add_parser("digest");d.add_argument("file")
    b=sub.add_parser("backup");b.add_argument("source");b.add_argument("destination")
    s=sub.add_parser("slo");s.add_argument("--total",type=int,default=10000);s.add_argument("--errors",type=int,default=12);s.add_argument("--target",type=float,default=.999)
    l=sub.add_parser("load");l.add_argument("url");l.add_argument("--count",type=int,default=50)
    args=p.parse_args()
    if args.cmd=="digest":print(digest(args.file))
    elif args.cmd=="backup":backup(args.source,args.destination);print("Backup complete; perform a separate restore check.")
    elif args.cmd=="slo":print(json.dumps(budget(args.total,args.errors,args.target)))
    else:print(json.dumps(local_load(args.url,args.count)))
