/* One fresh worker per attempt or run. Terminating it also stops an infinite Python loop. */
self.onmessage=async ({data})=>{
 try{
  importScripts(data.runtime+'pyodide.js');
  const py=await loadPyodide({indexURL:data.runtime,stdout:()=>{},stderr:()=>{}});
  self.postMessage({type:'ready'});
  // Lesson starters: run as a script, keep at most 20,000 characters of output and show only the learner's frames.
  if(data.mode==='run'){
   py.globals.set('_code',data.code);
   const output=py.runPython(String.raw`
import json, contextlib, traceback, sys, io
LIMIT=20000
class Capped:
    def __init__(self): self.parts=[]; self.size=0; self.cut=False
    def write(self, value):
        room=LIMIT-self.size
        if room>0:
            self.parts.append(value[:room]); self.size+=min(len(value),room)
        if len(value)>max(room,0): self.cut=True
        return len(value)
    def flush(self): pass
out=Capped()
sys.stdin=io.StringIO('')
import linecache
linecache.cache['main.py']=(len(_code),None,_code.splitlines(True),'main.py')
def run():
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            exec(compile(_code,'main.py','exec'),{'__name__':'__main__'})
        return True,''
    except SystemExit as error:
        if error.code in (None,0): return True,''
        return False,'Exited with status '+repr(error.code)+'.'
    except BaseException as error:
        frames=[f for f in traceback.extract_tb(error.__traceback__) if f.filename=='main.py']
        hint='\ninput() has nothing to read here. Assign a value instead.' if isinstance(error,EOFError) else ''
        return False,('Traceback (most recent call last):\n'+''.join(traceback.format_list(frames)) if frames else '')+''.join(traceback.format_exception_only(type(error),error)).rstrip()+hint
ok,problem=run()
json.dumps({'ok':ok,'output':''.join(out.parts),'truncated':out.cut,'error':problem[-3000:]})
`);
   self.postMessage({type:'result',...JSON.parse(output)});
   return;
  }
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
