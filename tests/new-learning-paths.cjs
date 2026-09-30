const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const paths=require('../scripts/manifest.cjs').readPaths();
const ids=['linux-operating-systems','data-engineering','ui-accessibility','observability-performance','messaging-events','cloud-infrastructure','full-stack-journey'];
for(const id of ids){const p=paths.find(p=>p.id===id);assert(p&&p.status==='ready',id);assert(p.lessons.length>=20,id);for(const stage of p.stages){assert(p.resources.tasks.some(t=>t.id===stage.id),id+'/'+stage.id);}for(const l of p.lessons){const task=p.resources.lessonTasks[l.id];assert(task,id+'/'+l.id);assert(p.resources.tasks.some(t=>t.id===(Array.isArray(task)?task[0]:task)),id+'/'+l.id);}}
for(const file of ['contrast.test.cjs','semantics.test.cjs']){const r=cp.spawnSync(process.execPath,[file],{cwd:'paths/ui-accessibility/practice',encoding:'utf8'});assert.equal(r.status,0,r.stderr||r.stdout);process.stdout.write(r.stdout);}
console.log('PASS: seven complete paths, all lesson/stage task links and UI practice checks.');
