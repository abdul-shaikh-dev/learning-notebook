"""Run against an owned loopback API. Creates synthetic tasks; does not delete existing data."""
import json, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit

def check(base):
    parsed=urlsplit(base)
    if parsed.scheme!='http' or parsed.hostname not in ('127.0.0.1','localhost') or parsed.path not in ('','/'):
        raise ValueError('Use an owned loopback HTTP API')
    def call(method,path,body=None):
        raw=None if body is None else json.dumps(body).encode()
        req=urllib.request.Request(base.rstrip('/')+path,data=raw,method=method,headers={'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(req,timeout=10) as r:return r.status,json.load(r)
        except urllib.error.HTTPError as e:
            text=e.read().decode();return e.code,json.loads(text) if text else None
    assert call('GET','/health')[0]==200
    for body in ({'title':' ','minutes':25},{'title':'x','minutes':-1},{'title':'x','minutes':1441},{'title':'x','minutes':True},{'title':'x'}, {'title':'x','minutes':1,'owner':'admin'}):
        assert call('POST','/api/tasks',body)[0]==400,body
    status, task=call('POST','/api/tasks',{'title':'SQL study','minutes':0}); assert status==201 and task['version']==1 and task['done'] is False
    assert call('GET','/api/tasks/'+task['id'])==(200,task)
    assert call('GET','/api/tasks/00000000-0000-0000-0000-000000000000')[0]==404
    payload={'title':'SQL study','minutes':25,'done':True,'version':1}
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(lambda _:call('PUT','/api/tasks/'+task['id'],payload),range(2)))
    assert sorted(x[0] for x in results)==[200,409],results
    status,rows=call('GET','/api/tasks'); saved=next(x for x in rows if x['id']==task['id'])
    assert saved['version']==2 and saved['minutes']==25 and saved['done'] is True
    assert call('PUT','/api/tasks/00000000-0000-0000-0000-000000000000',payload)[0]==404
    assert call('PUT','/api/tasks/'+task['id'],{'title':'x','minutes':1,'version':2})[0]==400
    print('PASS: HTTP validation, missing fields, create/list, concurrent stale write, missing ID and required completion flag')
    return task['id']
if __name__=='__main__':check(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:5087')
