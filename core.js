'use strict';
const Calc = {
  bond(face,price,accrued=0){return {clean:face*price/100,dirty:face*price/100+accrued};},
  ipv(face,fo,ind,tolerance,reliable=true){const diff=face*(ind-fo)/100;const breach=Math.round(Math.abs(diff)*100)>Math.round(tolerance*100);return {fo:face*fo/100,ind:face*ind/100,diff,breach,status:!reliable?'Unverified source':breach?'Investigate difference':'Within amount tolerance'};},
  pv(cash,rate,years){return cash/Math.pow(1+rate/100,years);},
  bridge(raw,booked,gross,eligible){if(eligible>booked)throw Error('The eligible same-source amount cannot exceed the total booked deduction.');return {fv:raw-booked,increment:Math.max(0,gross-eligible),prudent:raw-booked-Math.max(0,gross-eligible)};},
  fvh(quote,unobservable){return quote?'Level 1':unobservable?'Level 3':'Level 2';},
  uncertainty(mean,sd,face,side){const price=mean+(side==='long'?-1:1)*1.2815515655*sd;return {price,deduction:Math.abs(face)*(1.2815515655*sd)/100,low:mean-1.2815515655*sd,high:mean+1.2815515655*sd};},
  capital(cet1,ava,rwa){return {after:cet1-ava,beforePct:cet1/rwa*100,afterPct:(cet1-ava)/rwa*100,changeBp:ava/rwa*10000};}
};
if(typeof module!=='undefined')module.exports=Calc;
