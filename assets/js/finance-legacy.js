// Financial foundations moved from its own reader to the shared course page.
// Old links (course.html#lesson/3, #start/2, #foundations/capital, #reference, #sources) and progress saved
// under valuation-lab-v1 (main lessons 1-18 in `done`, introductions 1-6 in `starterDone`) map to the new lesson ids.
const FINANCE_LEGACY={
 path:'financial-foundations',
 start:['what-are-people-actually-trading','a-trade-is-an-event-a-position-is-what-remains','where-do-desks-books-and-portfolios-fit','price-value-cash-and-profit-are-not-the-same','who-checks-the-banks-numbers','read-one-trade-record-with-confidence'],
 foundations:{'cash-flows':'a-bond-is-a-timeline-of-payments','swaps-options':'swaps-and-options-payment-is-not-value','sensitivities':'translate-an-input-move-into-money','collateral-netting':'netting-and-collateral-change-exposure','capital':'from-a-balance-sheet-to-a-capital-ratio','probability':'read-a-percentile-before-using-it','daily-pnl':'reconcile-a-whole-day-including-cash-and-fx','curve-repricing':'reprice-the-same-cash-flows-with-different-inputs'},
 main:['from-a-trade-to-a-value','what-fair-value-is-trying-to-measure','market-data-and-the-model-underneath','ipv-an-independent-challenge','sources-tolerances-and-exceptions','reserves-and-the-accounting-value-bridge','bid-offer-liquidity-and-model-uncertainty','level-1-level-2-level-3','observability-and-significance-in-practice','fvh-classification-and-reporting-exercises','pruval-avas-and-capital','market-price-uncertainty','close-out-cost-and-concentration','model-risk-and-the-other-ava-categories','approaches-aggregation-and-cet1','day-one-pnl-and-valuation-movements','data-lineage-controls-and-debugging','put-it-all-together-at-month-end'],
 stages:{'Foundations':'foundations','Valuation control':'valuation-control','Fair value hierarchy':'fair-value-hierarchy','Prudent valuation':'prudent-valuation','Working knowledge':'working-knowledge'},
 key:'valuation-lab-v1',
 // The shared-page hash for an old finance route, or null when the route belongs to the practice studio.
 route(route,param){
  const path='#path/'+this.path,topic=id=>id?'#topic/'+this.path+'/'+id:path,n=Number(param);
  if(route==='lesson')return topic(this.main[n-1]);
  if(route==='start')return param?topic(this.start[n-1]):topic(this.start[0]);
  if(route==='foundations')return topic(this.foundations[param]||Object.values(this.foundations)[0]);
  if(route==='reference')return '#glossary/'+this.path;
  if(route==='learn'||route==='sources'||route==='')return path;
  return null;
 },
 // Reading marks saved by the old reader join the shared reading list once; the old arrays are then emptied
 // so a lesson later marked unread stays unread. Practice status and quiz answers stay with the studio.
 migrate(store){
  try{
   const saved=JSON.parse(store.getItem(this.key)||'null');if(!saved||typeof saved!=='object')return false;
   const pick=(list,ids)=>(Array.isArray(list)?list:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=ids.length).map(n=>ids[n-1]);
   const ids=[...pick(saved.starterDone,this.start),...pick(saved.done,this.main)];if(!ids.length)return false;
   const pathKey='learning-notebook:path:'+this.path+':v1';let read=[];
   try{const value=JSON.parse(store.getItem(pathKey)||'[]');if(Array.isArray(value))read=value.filter(x=>typeof x==='string');}catch{}
   store.setItem(pathKey,JSON.stringify([...new Set([...read,...ids])]));
   store.setItem(this.key,JSON.stringify({...saved,done:[],starterDone:[]}));
   return true;
  }catch{return false;}
 }
};
if(typeof module!=='undefined')module.exports={FINANCE_LEGACY};
else{try{FINANCE_LEGACY.migrate(localStorage);}catch{}}
