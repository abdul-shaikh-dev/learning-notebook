const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {readPaths}=require('./manifest.cjs');
function configFor(root,files){
 const inventory={};for(const file of [...new Set(files)].sort()){const data=fs.readFileSync(path.join(root,file));inventory[file]={hash:crypto.createHash('sha256').update(data).digest('hex'),bytes:data.length};}
 const shell=Object.keys(inventory).filter(f=>f.startsWith('assets/')||['index.html','offline.html','manifest.webmanifest','content/catalog.js','content/search.js'].includes(f));
 const courses=readPaths().filter(p=>p.status==='ready').map(p=>{
  const own=[...new Set(['content/courses/'+p.id+'.js',...p.publicFiles.map(f=>'paths/'+p.id+'/'+f),...(p.id==='financial-foundations'?['course.html','handbook.html','practice/sample-positions.csv','practice/answers.md']:[])])];
  for(const f of own)if(!inventory[f])throw Error('Offline file is not published: '+f);
  const version=crypto.createHash('sha256').update(JSON.stringify(own.map(f=>[f,inventory[f].hash]))).digest('hex').slice(0,16);
  return {id:p.id,title:p.title,version,files:own,bytes:own.reduce((n,f)=>n+inventory[f].bytes,0)};
 });
 const version=crypto.createHash('sha256').update(JSON.stringify(inventory)).update(fs.readFileSync(path.join(root,'scripts/sw-template.js'))).digest('hex').slice(0,16);
 return {version,files:inventory,shell,courses};
}
function buildPwa(root,out,files){const config=configFor(root,files);const source=fs.readFileSync(path.join(root,'scripts/sw-template.js'),'utf8').replace('__PWA_CONFIG__',JSON.stringify(config));fs.writeFileSync(path.join(out,'sw.js'),source);return config;}
module.exports={configFor,buildPwa};
