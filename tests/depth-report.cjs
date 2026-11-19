// Depth report (#152): the script measures every ready lesson, and the lessons expanded in the depth pass keep a
// worked example and at least 150 words of explanation.
const assert=require('node:assert/strict'),{lessons,summary}=require('../scripts/depth-report.cjs');
const rows=lessons(),s=summary(rows);
assert.ok(rows.length>0&&rows.every(r=>Number.isInteger(r.words)&&typeof r.worked==='boolean'),'Every lesson is measured');
assert.equal(s.lessons,rows.length);assert.equal(s.withoutWorkedExample,rows.filter(r=>!r.worked).length);assert.ok(s.p10<=s.median&&s.median<=s.p90);
const expanded=['data-structures-algorithms/stacks-queues','cloud-infrastructure/dependencies','data-structures-algorithms/maps','messaging-events/launch-review','networking-web/protocol-evolution','full-stack-journey/response-validation','cloud-infrastructure/launch-review','full-stack-journey/parameters','testing-debugging/debug-report','data-structures-algorithms/heaps','networking-web/request-journey','networking-web/certificates','testing-debugging/failures','testing-debugging/fixtures','testing-debugging/contracts-adapters'];
for(const id of expanded){const r=rows.find(x=>x.course+'/'+x.lesson===id);assert.ok(r,id);assert.ok(r.worked,id+' has a worked example');assert.ok(r.words>=150,id+' has at least 150 words of explanation ('+r.words+')');}
console.log('Depth report: '+s.lessons+' lessons measured; '+expanded.length+' expanded lessons keep a worked example and 150+ words.');
