const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {TRADE_JOURNEY,journeyNumbers,journeyPrint}=require('../paths/financial-foundations/content/journey.js');
assert.equal(TRADE_JOURNEY.length,8);assert.equal(new Set(TRADE_JOURNEY.map(s=>s.id)).size,8);
for(const s of TRADE_JOURNEY)for(const key of ['owner','input','output','control','data','question','answer'])assert.ok(s[key],key);
for(const usable of [true,false]){const n=journeyNumbers(usable);assert.equal(n.closing,n.desk+n.correction);assert.equal(n.pnl,n.closing+n.cash);assert.equal(n.candidate-n.desk,-500);assert.equal(n.pnl,usable?3500:4000);assert.equal(n.approved,usable);}
const events={},node={innerHTML:''},ctx={TRADE_JOURNEY,journeyNumbers,esc:s=>s,money:n=>'$'+n,signedMoney:n=>(n>0?'+':'')+'$'+n,document:{addEventListener:(name,fn)=>events[name]=fn,getElementById:()=>node}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('paths/financial-foundations/runtime/journey.js','utf8'),ctx);
for(const s of TRADE_JOURNEY){const html=vm.runInContext('journeyView('+JSON.stringify(s.id)+')',ctx);assert.ok(html.includes(s.title));assert.ok(html.includes('aria-current="step"'));assert.ok(journeyPrint().includes(s.answer));}
events.change({target:{id:'journey-evidence',value:'stale'}});assert.ok(node.innerHTML.includes('Open exception'));assert.ok(node.innerHTML.includes('+$4000'));
events.change({target:{id:'journey-evidence',value:'usable'}});assert.ok(node.innerHTML.includes('Resolved'));assert.ok(node.innerHTML.includes('+$3500'));
assert.ok(vm.runInContext("journeyView('unknown')",ctx).includes(TRADE_JOURNEY[0].title));
console.log('PASS: eight lifecycle stages, arithmetic reconciliation, evidence switch, fallback route and printable coverage.');
