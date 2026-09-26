// Compile the actual downloads with pinned dependencies, then execute their domain tests.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const source=path.resolve(__dirname,'../../paths/react/practice');
const scratch=fs.mkdtempSync(path.join(__dirname,'.check-'));
function run(args){const result=cp.spawnSync(process.execPath,args,{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw Error('React verification failed: '+result.status);}
try{
  const files=fs.readdirSync(source).filter(name=>/\.tsx?$/.test(name));
  for(const file of files)fs.copyFileSync(path.join(source,file),path.join(scratch,file));
  run([path.join(__dirname,'node_modules/typescript/bin/tsc'),'--noEmit','--strict','--target','ES2022','--module','ESNext','--moduleResolution','bundler','--jsx','react-jsx','--lib','ES2022,DOM','--allowImportingTsExtensions',...files.map(file=>path.join(scratch,file))]);
  run(['--experimental-strip-types',path.join(scratch,'tracker-core.test.ts')]);
}finally{
  if(path.dirname(scratch)!==__dirname||!path.basename(scratch).startsWith('.check-'))throw Error('Unsafe scratch path');
  fs.rmSync(scratch,{recursive:true,force:true});
}
