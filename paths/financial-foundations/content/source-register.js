// Traceable evidence metadata; source access is separate from legal applicability.
SOURCES.push({id:'aasb13',title:'AASB 13 · accessible IFRS-aligned text',url:'https://standards.aasb.gov.au/aasb-13-dec-2022',note:'December 2022 amendments in the compilation dated 31 December 2023, operative from 1 January 2024: use IFRS-aligned paragraphs only, not Australian-specific additions. Accessible companion to the IFRS standard; not a substitute for the applicable reporting edition.'});
for(const l of LESSONS)if([2,7,8,9,10].includes(l.id)&&!l.sources.includes('aasb13'))l.sources.push('aasb13');
SOURCES.find(s=>s.id==='ifrsdetail').note+=' Access check 26 September 2026: PDF redirected to sign-in. Use the official standard landing page and accessible IFRS-aligned companion.';
SOURCES.push({id:'aasb9',title:'AASB 9 · accessible IFRS-aligned day-one requirements',url:'https://standards.aasb.gov.au/aasb-9-dec-2022',note:'December 2022 edition: paragraphs 5.1.1–5.1.1A and B5.1.2A corroborate the dated day-one recognition lesson. Read IFRS-aligned provisions, excluding Australian-specific additions. This companion does not certify the edition applicable to a later reporting date.'});
for(const l of LESSONS)if(l.id===16&&!l.sources.includes('aasb9'))l.sources.push('aasb9');
const SOURCE_REGISTER = SOURCES.map(s=>({id:s.id,title:s.title,url:s.url,edition:s.note,checkedDate:'2026-09-26',access:s.id==='ifrsdetail'?'Sign-in required at last check':s.id==='opq'?'403 during review; rejection status not independently reverified':s.id==='eu'?'Direct access restricted; official indexed provisions and amendment checked':['ifrs','aasb13','ifrs9','basel'].includes(s.id)?'Primary text or landing page retrieved during review':['uk','uk2027'].includes(s.id)?'Primary instrument/policy checked during regulatory review':'Carried forward from original source set; not individually re-fetched in this revision',changeTrigger:'New edition, amendment, reporting-date change or supervisory clarification: recheck claims, calculations and exercises together.'}));
// A new access check supplements, rather than rewrites, earlier source-access history.
for(const id of ['aasb13','aasb9']){
 const entry=SOURCE_REGISTER.find(s=>s.id===id);
 entry.checkedDate='2026-10-02';
 entry.access=id==='aasb13'?'Official adopted full text retrieved; paragraphs 16–26, 42–44, 69–90 checked for market, credit, spread and hierarchy claims':'Official adopted full text retrieved; B5.1.2A checked for the qualifying evidence test, deferral and later recognition';
}
// Fresh factual audit: record successful and restricted source checks separately.
const FACTUAL_ACCESS_20261002={
 basel:'Official CAP50 text retrieved; independent verification and valuation-control provisions checked',
 eu:'Direct retrieval restricted; official indexed Articles 1, 4-18 and 2020/866 Annex amendment checked for the dated teaching mechanics',
 crr:'Official indexed Article 34 and Article 105 text checked in the January 2026 consolidation; not a certification of all later amendments',
 crr3:'Official indexed CRR3 operational-risk reform text checked; historical AMA wording is not presented as a current method',
 opq:'Direct retrieval restricted; official indexed question confirms rejection on 30 October 2025, with no substantive interpretive answer',
 qna:'Direct retrieval restricted; official indexed answer checked for accounting-value distinction and tax treatment',
 consult:'Official indexed consultation notice checked; proposed amendments are not treated as adopted law',
 minutes:'Direct PDF retrieval failed; official indexed April 2025 minutes corroborate the stated postponement',
 uk:'Official PRA2021/13 instrument retrieved; Article 4 GBP13bn threshold and eligibility provisions checked',
 uk2027:'Official PS3/26 retrieved; 1 January 2027 effective date checked'
};
for(const [id,access] of Object.entries(FACTUAL_ACCESS_20261002)){
 const entry=SOURCE_REGISTER.find(s=>s.id===id);
 entry.checkedDate='2026-10-02';
 entry.access=access;
}
const LESSON_REFERENCES={2:'IFRS 13: 16–26, 69–71; market selection and price conventions.',4:'Basel CAP50.7–50.8: independent price verification.',7:'IFRS 13: 42–44, 48–56, 69; credit, portfolios and premiums/discounts.',8:'IFRS 13: 72–90; hierarchy and input significance.',9:'IFRS 13: 73, 81–90; significance and observability.',10:'IFRS 13: 93–95; reporting and transfers.',11:'CRR Article 34; RTS Articles 1 and 8; purpose and overlap.',12:'RTS Articles 7 and 9; fallback and MPU.',13:'RTS Articles 10 and 14; close-out and concentration.',14:'RTS Articles 11–17; other categories and allocation.',15:'RTS Articles 4–8 and Annex as amended by 2020/866; eligibility and aggregation.',16:'IFRS 9 B5.1.2A; initial difference and subsequent recognition.'};
function sourceRegisterView(){return `<details><summary>Source register: editions, checks and review triggers</summary><div><p>These are dated teaching references. An access check is not a legal-currentness certification. New technical sections provide their specific paragraph references.</p><p class="muted">${SOURCE_REGISTER[0].changeTrigger}</p>${SOURCE_REGISTER.map(s=>`<section><h3><a href="${s.url}">${s.title}</a></h3><p>${s.edition}</p><p>Checked/reviewed: ${s.checkedDate}. ${s.access}.</p></section>`).join('')}</div></details>`;}
