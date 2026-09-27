const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const source=path.resolve(__dirname,'../../paths/react/practice');
const scratch=fs.mkdtempSync(path.join(__dirname,'.check-'));
function run(args){const r=cp.spawnSync(process.execPath,args,{cwd:scratch,stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error('React verification failed: '+r.status);}
try {
 for(const file of fs.readdirSync(source).filter(n=>/\.(tsx?|json|html)$/.test(n)))fs.copyFileSync(path.join(source,file),path.join(scratch,file));
 run([path.join(__dirname,'node_modules/typescript/bin/tsc'),'--noEmit']);
 run(['--experimental-strip-types','tracker-core.test.ts']);
 run([path.join(__dirname,'node_modules/vitest/vitest.mjs'),'run']);
 run([path.join(__dirname,'node_modules/vite/bin/vite.js'),'build']);
}finally {if(path.dirname(scratch)!==__dirname||!path.basename(scratch).startsWith('.check-'))throw Error('Unsafe scratch');fs.rmSync(scratch,{recursive:true,force:true});}
