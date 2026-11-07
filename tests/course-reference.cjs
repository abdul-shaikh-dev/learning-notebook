// Glossary pages, plain-language word help, evidence notes, calculation exercises and source registers on the shared course page.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {checkGlossary}=require('../scripts/manifest.cjs');

const glossary={title:'Find the term.',intro:'Desk reference.',placeholder:'Try: clean',terms:[{term:'Clean price',definition:'Price excluding <accrued> interest.'},{term:'AVA',definition:'Additional valuation adjustment.'}],plainTerms:[{term:'Trade / Deal',definition:'An agreement to exchange something.'},{term:'Desk',definition:'A team that manages positions.'}],plainIntro:'New here? Start with lesson 1.',reference:[{title:'Formula card',columns:['Calculation','Expression'],rows:[['Clean value','Face × price / 100']]},{title:'Questions worth asking',items:['Which valuation date applies?']}]};
const lesson={id:'bond',title:'1. Value a bond',takeaway:'A trade becomes a position.',sections:[{title:'Concept',paragraphs:['Each trade is booked once.'],evidence:[{label:'IFRS 13 paragraph 72',url:'https://example.org/ifrs13',paragraph:'Fair value hierarchy',checked:'2026-09-26',status:'Referenced edition'}]}],exercise:{prompt:'Face 2,000,000 at 97.40 with accrued 12,000. Dirty value?',solution:'USD 1,960,000.',solutionFormat:'prose',numericAnswer:1960000,tolerance:0.01,rubric:['Divide the quote by 100.','Add accrued interest once.']},quiz:{question:'Q',options:['A','B'],correct:0,explanation:'Because'}};
const course={id:'fixture-finance',title:'Fixture finance',status:'ready',description:'Fixture',category:'Finance',level:'Beginner',lessons:[lesson,{id:'plain',title:'2. Nothing to define',takeaway:'Empty.',sections:[{title:'Text',paragraphs:['Unrelated words.']}]}],glossary,sources:[{title:'IFRS 13',url:'https://example.org/ifrs13',note:'Accounting reference.',edition:'2023 compilation',checked:'2026-09-26',access:'Open access',changeTrigger:'Recheck when amended.'},{title:'Plain source',url:'https://example.org/plain'}],sourcesNote:'Dated teaching references.'};

const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{id,innerHTML:'',textContent:'',value:'',addEventListener(type,fn){this[type]=fn;},querySelectorAll(){return [];}});return elements.get(id);};
const context={LEARNING_PATHS:[course],document:{getElementById:element},location:{hash:'#glossary/fixture-finance'},window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:()=>null,setItem(){}}};
vm.runInNewContext(fs.readFileSync('assets/js/learning-tools.js','utf8')+'\n'+fs.readFileSync('assets/js/catalog.js','utf8'),context);
const html=()=>element('main').innerHTML;

// Glossary page: every term, escaped, with reference tables, lists and plain-language words; the filter narrows it.
assert.ok(html().includes('Find the term.')&&html().includes('Price excluding &lt;accrued&gt; interest.'));
assert.ok(html().includes('2 of 2 terms')&&html().includes('<th>Expression</th>')&&html().includes('Face × price / 100')&&html().includes('<li>Which valuation date applies?</li>'));
assert.ok(html().includes('Plain-language words')&&html().includes('Trade / Deal'));
assert.equal(context.document.title,'Glossary · Fixture finance · Learning Notebook');
element('glossary-search').value='ava';element('glossary-search').input();
assert.equal(element('glossary-count').textContent,'1 of 2 terms');assert.ok(element('glossary-terms').innerHTML.includes('Additional valuation')&&!element('glossary-terms').innerHTML.includes('Clean price'));
element('glossary-search').value='zzz';element('glossary-search').input();assert.ok(element('glossary-terms').innerHTML.includes('No matching terms'));
console.log('PASS: glossary page lists escaped terms, reference tables and plain-language words, and filters them.');

// A course without a glossary has no glossary page.
context.LEARNING_PATHS.push({...course,id:'no-glossary',glossary:undefined});
context.location.hash='#glossary/no-glossary';vm.runInNewContext('renderCatalog()',context);assert.ok(html().includes('Path unavailable'));

// Lesson page: word help lists only the plain terms the lesson uses (plurals included), evidence notes and the course tools link.
context.location.hash='#topic/fixture-finance/bond';vm.runInNewContext('renderCatalog()',context);
assert.ok(html().includes('Words for this lesson')&&html().includes('<h3>Trade / Deal</h3>')&&!html().includes('<h3>Desk</h3>'));
assert.ok(html().includes('<a href="#topic/fixture-finance/bond" aria-label="1. Value a bond">lesson 1</a>'),'plain intro links lesson numbers');
assert.ok(html().includes('Evidence for this section')&&html().includes('IFRS 13 paragraph 72')&&html().includes('Checked 2026-09-26 · Referenced edition'));
assert.ok(html().includes('href="#glossary/fixture-finance">Glossary</a>'));
// Calculation check: tolerance, wrong answers and empty input each give their own feedback; the rubric sits with the worked answer.
assert.ok(html().includes('Your numerical answer (units in the question)')&&html().includes('Self-check rubric')&&html().includes('<li>Add accrued interest once.</li>'));
for(const [value,message] of [['1960000.005','The number matches.'],['1948000','Not yet.'],['','Enter a number first.']]){element('numeric-answer-bond').value=value;element('numeric-check').click();assert.ok(element('numeric-feedback').textContent.startsWith(message),value);}
context.location.hash='#topic/fixture-finance/plain';vm.runInNewContext('renderCatalog()',context);
assert.ok(!html().includes('Words for this lesson')&&!html().includes('Evidence for this section')&&!html().includes('numeric-check'));
console.log('PASS: lessons show matching word help, evidence notes and a tolerance-checked calculation with its rubric.');

// Course overview: sources keep their notes and the register lists only sources with edition or check details.
context.location.hash='#path/fixture-finance';vm.runInNewContext('renderCatalog()',context);
assert.ok(html().includes('Accounting reference.')&&html().includes('Source register: editions, checks and review triggers')&&html().includes('Checked/reviewed: 2026-09-26. Open access')&&html().includes('Recheck when amended.')&&html().includes('Dated teaching references.'));
assert.equal((html().match(/<section><h3><a /g)||[]).length,1);assert.ok(html().includes('href="#glossary/fixture-finance">Glossary</a>'));
// Printed course pack: glossary, evidence, the rubric and the answer are printed; the interactive check is not.
context.location.hash='#pack/fixture-finance';vm.runInNewContext('renderCatalog()',context);
assert.ok(html().includes('id="pack-glossary"')&&html().includes('Formula card')&&html().includes('Evidence for this section')&&html().includes('Self-check rubric')&&html().includes('USD 1,960,000.')&&!html().includes('numeric-check'));
console.log('PASS: overview source register and printed pack carry the glossary, evidence and calculation rubric.');

// Manifest validation rejects malformed glossaries.
assert.doesNotThrow(()=>checkGlossary(glossary,'fixture'));
for(const bad of [{},{terms:[]},{terms:[{term:'A'}]},{terms:[{term:'A',definition:'x'},{term:'a',definition:'y'}]},{...glossary,extra:1},{...glossary,reference:[{title:'T',columns:['A','B'],rows:[['only one']]}]},{...glossary,reference:[{title:'T'}]},{...glossary,plainTerms:[{term:'',definition:'x'}]}])assert.throws(()=>checkGlossary(bad,'bad'));
// Search index entries of the new kind decode in the reader.
assert.match(fs.readFileSync('assets/js/notebook-search.js','utf8'),/G:'Glossary'/);assert.match(fs.readFileSync('scripts/search-index.cjs','utf8'),/Glossary:'G'/);
console.log('PASS: glossary validation rejects malformed entries; search decodes glossary results.');
