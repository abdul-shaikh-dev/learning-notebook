/* Search stays local: no query or progress data is sent to a service. */
// The index lists each searchable word once with the entries that contain it, instead of every entry's full text.
// scripts/search-index.cjs builds it with this same tokenizer, so a query is split exactly as the text was.
const SEARCH_STOP_WORDS=new Set('a an and are as at be but by can do does for from has have how if in into is it its may must not of on or so such than that the their then there these they this to was we were what when where which while who why will with without you your'.split(' '));
const SEARCH_KINDS={C:'Course',L:'Lesson',T:'Task',F:'File'};
// The index also splits long names and links into their parts, so test_zero_regression_distinguishes_starter is found by "regression".
function notebookTokens(text,parts=false){
 const keep=t=>t&&t.length<=40&&!SEARCH_STOP_WORDS.has(t)&&!/^(?=.*\d)(?=.*[a-z])[a-z0-9+\/=]{24,}$/i.test(t);
 const trim=t=>t.replace(/^[.\/-]+|[.\/-]+$/g,'');
 return [...new Set(String(text).toLocaleLowerCase().split(/[^\p{L}\p{N}_.&#+\/-]+/u).map(trim).flatMap(t=>parts&&t.length>40?[t,...t.split(/[_.#\/-]+/).map(trim)]:[t]).filter(keep))];
}
let notebookIndexCache=null;
function notebookIndex(){
 if(notebookIndexCache?.source===NOTEBOOK_SEARCH)return notebookIndexCache;
 // A page cached before the compact index can still hold the old list of entries; it then finds nothing rather than failing.
 const raw=Array.isArray(NOTEBOOK_SEARCH?.entries)?NOTEBOOK_SEARCH:{courses:{},entries:[],words:'',postings:[]},postings=new Map();
 const entries=raw.entries.map(([path,kind,title,href,excerpt])=>{const course=raw.courses[path]||path;return {path,kind:SEARCH_KINDS[kind],title,href,excerpt,course,titleKey:title.toLocaleLowerCase(),courseKey:course.toLocaleLowerCase()};});
 // Entry numbers are stored as base-36 gaps from the previous number; they are decoded only for words a query touches.
 const list=i=>{if(!postings.has(i)){let at=0;postings.set(i,raw.postings[i].split(',').map(gap=>at+=parseInt(gap,36)));}return postings.get(i);};
 return notebookIndexCache={source:NOTEBOOK_SEARCH,entries,words:raw.words?raw.words.split(' '):[],list};
}
function notebookMatches(query,course='',kind=''){
 const terms=notebookTokens(query);
 if(!terms.length)return [];
 const index=notebookIndex();let hits=null;
 for(const term of terms){
  const found=new Set();
  index.words.forEach((word,i)=>{if(word.includes(term))for(const id of index.list(i))found.add(id);});
  index.entries.forEach((item,id)=>{if(item.courseKey.includes(term))found.add(id);});
  hits=hits?new Set([...hits].filter(id=>found.has(id))):found;
  if(!hits.size)return [];
 }
 const whole=query.trim().toLocaleLowerCase();
 return [...hits].map(id=>index.entries[id]).filter(item=>(!course||item.path===course)&&(!kind||item.kind===kind))
  .map(item=>({item,score:terms.reduce((n,t)=>n+(item.titleKey.includes(t)?10:1),0)+(item.titleKey===whole?30:0)}))
  .sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title)).map(hit=>hit.item);
}
// Escapes text, then marks each query term where it occurs.
function notebookHighlight(text,query){
 const terms=notebookTokens(query).sort((a,b)=>b.length-a.length);
 if(!terms.length)return escapeText(text);
 const pattern=new RegExp('('+terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','giu');
 return String(text).split(pattern).map((part,i)=>i%2?'<mark>'+escapeText(part)+'</mark>':escapeText(part)).join('');
}
const SEARCH_RECENT_KEY='learning-notebook:recent-searches:v1',SEARCH_SUGGESTIONS=['dependency injection','retries and idempotency','joins','async','unit tests','P&L','test_projects.py','Kubernetes deployments'];
function notebookRecent(){try{const saved=JSON.parse(localStorage.getItem(SEARCH_RECENT_KEY)||'[]');return Array.isArray(saved)?saved.filter(q=>typeof q==='string'&&q.trim()).slice(0,5):[];}catch{return [];}}
function rememberSearch(query){const q=query.trim().slice(0,200);if(!q)return;try{localStorage.setItem(SEARCH_RECENT_KEY,JSON.stringify([q,...notebookRecent().filter(x=>x.toLocaleLowerCase()!==q.toLocaleLowerCase())].slice(0,5)));}catch{}}
// Before a query: recent searches, the course last read and suggested topics.
function notebookSearchStart(){
 const recent=notebookRecent();let current=null;
 try{const saved=JSON.parse(localStorage.getItem('learning-notebook:last-lesson:v1'));current=LEARNING_PATHS.find(p=>p.id===saved?.path&&p.status==='ready')||null;}catch{}
 const chips=(items,attr)=>`<ul class="search-chips">${items.map(([label,value])=>`<li><button type="button" ${attr}="${escapeText(value)}">${escapeText(label)}</button></li>`).join('')}</ul>`;
 return `${recent.length?`<section aria-labelledby="search-recent"><h2 id="search-recent">Recent searches</h2>${chips(recent.map(q=>[q,q]),'data-search')}<button type="button" class="quiet search-clear" data-clear-recent>Clear recent searches</button></section>`:''}${current?`<section aria-labelledby="search-current"><h2 id="search-current">The course you are reading</h2>${chips([['Search within '+current.title,current.id]],'data-search-course')}</section>`:''}<section aria-labelledby="search-suggested"><h2 id="search-suggested">Try a topic</h2>${chips(SEARCH_SUGGESTIONS.map(q=>[q,q]),'data-search')}</section>`;
}
function notebookSnippet(item){return item.excerpt;}
function notebookResults(matches,query){
 const groups=new Map();for(const item of matches){if(!groups.has(item.path))groups.set(item.path,[]);groups.get(item.path).push(item);}
 return [...groups.values()].map(items=>`<section class="search-group" aria-label="${escapeText(items[0].course)}"><h2>${escapeText(items[0].course)} <span>${items.length}</span></h2><ol class="notebook-results">${items.map(item=>`<li><p class="eyebrow">${item.kind}</p><h3><a href="${escapeText(item.href)}" ${item.kind==='File'?'download':''} data-result>${notebookHighlight(item.title,query)}${item.kind==='File'?' · Download':''}</a></h3><p>${notebookHighlight(notebookSnippet(item),query)}</p>${item.kind==='File'?`<a class="file-context" href="#resources/${escapeText(item.path)}">Open ${escapeText(item.course)} files & instructions →</a>`:''}</li>`).join('')}</ol></section>`).join('');
}
function notebookSearchView(){const params=new URLSearchParams(location.hash.split('?')[1]||'');return `<a class="back-link" href="#">← All learning paths</a><h1>Search your notebook</h1><p class="intro">Find a concept, lesson, task or exact filename across every learning path.</p><form id="notebook-search-form" role="search"><label for="notebook-query">What would you like to find?</label><input id="notebook-query" class="search" type="search" maxlength="200" autocomplete="off" aria-describedby="search-keys" value="${escapeText((params.get('q')||'').slice(0,200))}" placeholder="e.g. dependency injection, P&L, test_projects.py"><button class="primary" type="submit">Search notebook</button><p id="search-keys" class="search-keys">Press ↓ to move through results and Esc to return here.</p><details class="search-filter-disclosure" ${(params.get('course')||params.get('kind'))?'open':''}><summary>Filters</summary><div class="search-filters"><label>Learning path<select id="notebook-course"><option value="">All paths</option>${LEARNING_PATHS.filter(p=>p.status==='ready').map(p=>`<option value="${p.id}" ${params.get('course')===p.id?'selected':''}>${escapeText(p.title)}</option>`).join('')}</select></label><label>Content type<select id="notebook-kind"><option value="">Everything</option>${['Course','Lesson','Task','File'].map(k=>`<option ${params.get('kind')===k?'selected':''}>${k}</option>`).join('')}</select></label></div></details></form><p id="notebook-search-count" role="status" aria-live="polite"></p><div id="notebook-search-start"></div><div id="notebook-results"></div><button class="quiet" id="notebook-more" hidden>Show more results</button>`;}
function bindNotebookSearch(){const form=document.getElementById('notebook-search-form');if(!form)return;const q=document.getElementById('notebook-query'),course=document.getElementById('notebook-course'),kind=document.getElementById('notebook-kind'),results=document.getElementById('notebook-results'),start=document.getElementById('notebook-search-start'),count=document.getElementById('notebook-search-count'),more=document.getElementById('notebook-more');let limit=30;
 const update=()=>{if(!form.isConnected)return;const query=q.value.slice(0,200);const matches=notebookMatches(query,course.value,kind.value);const shown=matches.slice(0,limit);
  count.textContent=!query.trim()?'':matches.length?`${matches.length} results in ${new Set(matches.map(m=>m.path)).size} ${new Set(matches.map(m=>m.path)).size===1?'course':'courses'} · showing ${shown.length}`:'No results. Try fewer words or choose all paths and content types.';
  start.innerHTML=query.trim()?'':notebookSearchStart();results.innerHTML=notebookResults(shown,query);more.hidden=matches.length<=limit;
  const params=new URLSearchParams();if(query)params.set('q',query);if(course.value)params.set('course',course.value);if(kind.value)params.set('kind',kind.value);if(typeof history!=='undefined')history.replaceState(null,'','#search'+(params.size?'?'+params:''));};
 const run=value=>{q.value=value;clearTimeout(timer);limit=30;update();rememberSearch(value);q.focus();};
 let timer; q.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{limit=30;update();},180);});[course,kind].forEach(select=>select.addEventListener('change',()=>{clearTimeout(timer);limit=30;update();}));form.addEventListener('submit',event=>{event.preventDefault();clearTimeout(timer);limit=30;update();rememberSearch(q.value);});more.addEventListener('click',()=>{const previous=limit;limit+=30;update();results.querySelectorAll('[data-result]')[previous]?.focus();});
 start.addEventListener('click',event=>{const button=event.target.closest?.('button');if(!button)return;if(button.dataset.search!==undefined)run(button.dataset.search);else if(button.dataset.searchCourse){course.value=button.dataset.searchCourse;form.querySelector('.search-filter-disclosure')?.setAttribute('open','');q.focus();update();}else if(button.dataset.clearRecent!==undefined){try{localStorage.removeItem(SEARCH_RECENT_KEY);}catch{}update();q.focus();}});
 // Following a result remembers the query that found it.
 results.addEventListener('click',event=>{if(event.target.closest?.('[data-result]'))rememberSearch(q.value);});
 // Arrow keys move between the field and the result links; Esc returns to the field.
 form.parentElement.addEventListener('keydown',event=>{const links=[...results.querySelectorAll('[data-result]')],at=links.indexOf(document.activeElement);
  if(event.key==='ArrowDown'&&(event.target===q||at>=0)){const next=links[at+1];if(next){event.preventDefault();next.focus();}}
  else if(event.key==='ArrowUp'&&at>=0){event.preventDefault();(at?links[at-1]:q).focus();}
  else if(event.key==='Escape'&&at>=0){event.preventDefault();q.focus();}});
 update();
}
