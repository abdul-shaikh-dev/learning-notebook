const assert=require('node:assert/strict');
const M=require('../paths/financial-foundations/runtime/story-math.js');
for(const step of [0,1,2])for(const price of [80,90,100,104,120]){
 const r=M.positions(step,price);
 assert.equal(r.quantity,[10,15,11][step]);
 assert.equal(r.cash,[-1000,-1500,-1060][step]);
 assert.equal(r.total,r.value+r.cash);
 assert.equal(r.total,r.realised+r.unrealised);
 assert.equal(r.realised,step===2?40:0);
}
assert.equal(M.positions(2,104).total,84);
assert.equal(M.positions(2,90).total,-70);
const a=M.adjustments(2000,5000,true),b=M.adjustments(2000,5000,false);
assert.equal(a.fairValue,98000);assert.equal(a.movement,-1000);assert.equal(a.increment,3000);
assert.equal(b.fairValue,a.fairValue);assert.equal(b.increment,5000);
assert.equal(M.adjustments(6000,5000,true).increment,0);
assert.equal(M.adjustments(0,5000,true).movement,1000);
console.log('PASS: visual story position/cash/P&L identities, loss scenarios and adjustment separation.');
