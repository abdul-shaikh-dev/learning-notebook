/* One fresh worker per attempt. Terminating it also stops an infinite Python loop. */
self.onmessage=async ({data})=>{
 try{
  importScripts(data.runtime+'pyodide.js');
  const py=await loadPyodide({indexURL:data.runtime,stdout:()=>{},stderr:()=>{}});
  self.postMessage({type:'ready'});
  py.globals.set('_payload',JSON.stringify({code:data.code,...data.problem}));
  const result=py.runPython(String.raw`
import json, copy, contextlib
p=json.loads(_payload)
def same(a,b):
    if type(a) is not type(b): return False
    if isinstance(b,list): return len(a)==len(b) and all(same(x,y) for x,y in zip(a,b))
    if isinstance(b,dict): return a.keys()==b.keys() and all(same(a[k],b[k]) for k in b)
    return a==b
class Quiet:
    def write(self, value): return len(value)
    def flush(self): pass
def check():
    ns={'__name__':'__challenge__'}
    try:
        with contextlib.redirect_stdout(Quiet()), contextlib.redirect_stderr(Quiet()):
            exec(compile(p['code'],'your_solution.py','exec'),ns)
        fn=ns.get(p['function'])
        if not callable(fn): return {'ok':False,'text':'Define '+p['function']+' with the signature shown in the problem.'}
        for i,case in enumerate(p['cases'],1):
            args=copy.deepcopy(case['args'])
            with contextlib.redirect_stdout(Quiet()), contextlib.redirect_stderr(Quiet()):
                actual=fn(*args)
            if not same(args,case['args']): return {'ok':False,'text':'Case '+str(i)+': the input arguments were changed. Keep them unchanged.'}
            if not same(actual,case['expected']):
                return {'ok':False,'text':'Case '+str(i)+' failed\nInput: '+repr(case['args'])[:1200]+'\nExpected: '+repr(case['expected'])[:1200]+'\nReturned: '+repr(actual)[:1200]}
        return {'ok':True,'text':str(len(p['cases']))+' / '+str(len(p['cases']))+' cases passed. Try another edge case or compare your reasoning below.'}
    except BaseException as error:
        import traceback
        return {'ok':False,'text':''.join(traceback.format_exception_only(type(error),error))[-3000:]}
json.dumps(check())
`);
  self.postMessage({type:'result',...JSON.parse(result)});
 }catch(error){self.postMessage({type:'error',text:String(error.message||error).slice(0,1500)});}
};
