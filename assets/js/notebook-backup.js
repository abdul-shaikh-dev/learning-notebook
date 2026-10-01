/* Portable progress and challenge drafts. Imported code is stored as text, never executed here. */
const NotebookBackup = (() => {
  'use strict';
  const APP = 'learning-notebook', VERSION = 1, LIMIT = 1024 * 1024;
  const FINANCE = 'valuation-lab-v1', LAST = 'learning-notebook:last-lesson:v1';
  const STUDY = ['foundations','valuation-control','fair-value-hierarchy','prudent-valuation','working-knowledge','integrated-investigations','revision'];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const key = id => 'learning-notebook:path:' + id + ':v1';
  const challengeKey = id => 'learning-notebook:challenges:' + id + ':v1';
  const challengeLessons = path => path.lessons.filter(l => l.exercise?.challenge);
  const assessment = id => 'learning-notebook:path:' + id + ':assessments:v1';
  const courses = () => LEARNING_PATHS.filter(p => p.status === 'ready' && Array.isArray(p.lessons));
  const fail = message => { throw new Error(message); };
  function object(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label + ' must be an object.');
    return value;
  }
  function fields(value, allowed, label) {
    object(value, label);
    if (Object.keys(value).some(k => !allowed.includes(k))) fail(label + ' contains unsupported fields.');
  }
  function ids(value, allowed, label) {
    if (!Array.isArray(value) || value.some(x => !allowed.includes(x))) fail(label + ' contains an unknown lesson or stage.');
    return [...new Set(value)];
  }
  function challenges(value, path) {
    object(value, 'Challenge progress');
    const allowed = challengeLessons(path).map(l => l.id), result = {};
    for (const [id, attempt] of Object.entries(value)) {
      if (!allowed.includes(id)) fail('Challenge progress contains an unknown challenge.');
      fields(attempt, ['code','status'], 'Challenge attempt');
      if (typeof attempt.code !== 'string' || attempt.code.length > 20000) fail('Challenge code must be text of at most 20,000 characters.');
      if (!['not-started','attempted','solved'].includes(attempt.status)) fail('Challenge status is invalid.');
      result[id] = {code:attempt.code,status:attempt.status};
    }
    return result;
  }
  function finance(value, legacy = false) {
    fields(value, ['done','answers','last','starterDone','study', ...(legacy ? ['version'] : [])], 'Financial progress');
    if (legacy && own(value,'version') && value.version !== 1) fail('Unsupported financial backup version.');
    const done = ids(value.done, Array.from({length:18},(_,i)=>i+1), 'Financial lessons');
    const starterDone = ids(value.starterDone ?? [], [1,2,3,4,5,6], 'Financial introductions');
    object(value.answers, 'Financial answers');
    const answers = {};
    for (const [id, answer] of Object.entries(value.answers)) {
      if (!/^([1-9]|1[0-8])$/.test(id) || !Number.isInteger(answer) || answer < 0 || answer > 2) fail('Financial answers contain an invalid question or choice.');
      answers[id] = answer;
    }
    const last = value.last ?? 1;
    if (!Number.isInteger(last) || last < 1 || last > 18) fail('Financial last lesson is invalid.');
    object(value.study ?? {}, 'Financial study progress');
    const study = {};
    for (const [id, flags] of Object.entries(value.study ?? {})) {
      if (!STUDY.includes(id)) fail('Financial study progress contains an unknown section.');
      fields(flags, ['practised','checked'], 'Financial study flags');
      if (typeof flags.practised !== 'boolean' || typeof flags.checked !== 'boolean' || (flags.checked && !flags.practised)) fail('Financial study flags are inconsistent.');
      study[id] = {practised:flags.practised, checked:flags.checked};
    }
    return {done,answers,last,starterDone,study};
  }
  function lastLesson(value) {
    if (value === null) return null;
    fields(value, ['path','lesson'], 'Last opened lesson');
    const path = courses().find(p => p.id === value.path);
    if (!path || !path.lessons.some(l => l.id === value.lesson)) fail('The last opened lesson is not in this notebook version.');
    return {path:value.path,lesson:value.lesson};
  }
  function progress(value) {
    fields(value, ['paths','financial','lastLesson'], 'Progress');
    object(value.paths, 'Course progress');
    const paths = {};
    for (const [id, entry] of Object.entries(value.paths)) {
      const path = courses().find(p => p.id === id);
      if (!path) fail('This backup contains a course not available in this notebook version.');
      fields(entry, ['read','assessed', ...(challengeLessons(path).length ? ['challenges'] : [])], 'Course progress');
      paths[id] = {
        read:ids(entry.read, path.lessons.map(l=>l.id), path.title + ' readings'),
        assessed:ids(entry.assessed, (path.stages || []).map(s=>s.id), path.title + ' projects'),
        ...(own(entry,'challenges') ? {challenges:challenges(entry.challenges,path)} : {})
      };
    }
    return {paths,financial:value.financial == null ? null : finance(value.financial),
            lastLesson:value.lastLesson == null ? null : lastLesson(value.lastLesson)};
  }
  function parse(raw) {
    if (typeof raw !== 'string' || raw.length > LIMIT || new TextEncoder().encode(raw).length > LIMIT) fail('The backup is too large. Choose a JSON progress file smaller than 1 MB.');
    let data;
    try { data = JSON.parse(raw); } catch { fail('This is not a valid JSON progress file.'); }
    object(data, 'Backup');
    if (!own(data,'app') && own(data,'done') && own(data,'answers')) {
      return {progress:{paths:{},financial:finance(data,true),lastLesson:null},legacy:true};
    }
    fields(data, ['app','version','createdAt','progress'], 'Backup');
    if (data.app !== APP || data.version !== VERSION) fail('This is not a supported Learning Notebook backup.');
    if (own(data,'createdAt') && (typeof data.createdAt !== 'string' || data.createdAt.length > 100 || !Number.isFinite(Date.parse(data.createdAt)))) fail('The backup date is invalid.');
    return {progress:progress(data.progress),legacy:false};
  }
  function storage() {
    try { if (typeof localStorage === 'undefined' || !localStorage) throw Error(); return localStorage; }
    catch { fail('Browser storage is unavailable. Open the notebook in a browser that allows local storage.'); }
  }
  function read() {
    const store = storage(), raw = {}, result = {paths:{},financial:null,lastLesson:null};
    function get(name, label) {
      let value;
      try { value = store.getItem(name); } catch { fail('Cannot read browser storage. Check browser privacy settings and try again.'); }
      raw[name] = value;
      if (value === null) return null;
      try { return JSON.parse(value); } catch { fail(label + ' is unreadable in this browser. No progress has been changed.'); }
    }
    for (const path of courses()) {
      const reads = get(key(path.id), path.title + ' reading progress');
      const checks = get(assessment(path.id), path.title + ' project progress');
      result.paths[path.id] = {
        read:reads === null ? [] : ids(reads,path.lessons.map(l=>l.id),path.title + ' readings'),
        assessed:checks === null ? [] : ids(checks,(path.stages||[]).map(s=>s.id),path.title + ' projects')
      };
      if (challengeLessons(path).length) {
        const attempts = get(challengeKey(path.id), path.title + ' challenge progress');
        result.paths[path.id].challenges = attempts === null ? {} : challenges(attempts,path);
      }
    }
    const financial = get(FINANCE,'Financial progress');
    if (financial !== null) result.financial = finance(financial);
    const last = get(LAST,'Last opened lesson');
    if (last !== null) result.lastLesson = lastLesson(last);
    return {progress:result,raw};
  }
  function create() {
    const text = JSON.stringify({app:APP,version:VERSION,createdAt:new Date().toISOString(),progress:read().progress},null,2);
    if (new TextEncoder().encode(text).length > LIMIT) fail('The backup exceeds 1 MB. Save copies of challenge code before removing drafts to reduce its size.');
    return text;
  }
  const union = (a,b) => [...new Set([...a,...b])];
  function merge(current, imported) {
    const result = {paths:{},financial:null,lastLesson:current.lastLesson || imported.lastLesson};
    for (const path of courses()) {
      const a = current.paths[path.id] || {read:[],assessed:[]}, b = imported.paths[path.id] || {read:[],assessed:[]};
      result.paths[path.id] = {read:union(a.read,b.read),assessed:union(a.assessed,b.assessed)};
      if (challengeLessons(path).length) result.paths[path.id].challenges = {...b.challenges,...a.challenges};
    }
    const a = current.financial, b = imported.financial;
    if (!a || !b) result.financial = a || b;
    else {
      const study = {};
      for (const id of STUDY) {
        const old = a.study[id], incoming = b.study[id];
        if (old || incoming) study[id] = {practised:!!(old?.practised || incoming?.practised),checked:!!(old?.checked || incoming?.checked)};
      }
      result.financial = {done:union(a.done,b.done),starterDone:union(a.starterDone,b.starterDone),
        answers:{...b.answers,...a.answers},last:a.last,study};
    }
    return result;
  }
  function plan(imported) {
    // Revalidate the structured import too: callers cannot bypass the JSON boundary.
    const incoming = progress(imported), current = read(), after = merge(current.progress,incoming), writes = [];
    for (const path of courses()) {
      if (!own(incoming.paths,path.id)) continue;
      writes.push([key(path.id),JSON.stringify(after.paths[path.id].read)],
                  [assessment(path.id),JSON.stringify(after.paths[path.id].assessed)]);
      if (own(incoming.paths[path.id],'challenges')) writes.push([challengeKey(path.id),JSON.stringify(after.paths[path.id].challenges)]);
    }
    if (incoming.financial !== null) writes.push([FINANCE,JSON.stringify(after.financial)]);
    if (!current.progress.lastLesson && incoming.lastLesson) writes.push([LAST,JSON.stringify(incoming.lastLesson)]);
    return {before:current.progress,incoming,after,raw:current.raw,
            writes:writes.filter(([name,value]) => current.raw[name] !== value)};
  }
  function unchanged(raw) {
    const store = storage();
    try { return Object.entries(raw).every(([name,value]) => store.getItem(name) === value); }
    catch { fail('Cannot read browser storage. Nothing has been imported.'); }
  }
  function apply(preview) {
    // Build a new allowlisted plan instead of trusting arbitrary supplied writes.
    const fresh = plan(preview.incoming);
    if (!unchanged(preview.raw)) fail('Progress changed after the preview. Preview the file again before importing.');
    const store = storage(), changed = [];
    try {
      for (const [name,value] of fresh.writes) { changed.push(name); store.setItem(name,value); }
    } catch {
      let restored = true;
      for (const name of changed.reverse()) {
        try { fresh.raw[name] === null ? store.removeItem(name) : store.setItem(name,fresh.raw[name]); }
        catch { restored = false; }
      }
      if (!restored) fail('Import failed and browser storage also blocked rollback. Some progress may have changed. Keep your backup file and retry when storage is available.');
      fail('Import could not be saved. Your previous progress was restored; check storage space or browser settings.');
    }
    return fresh.after;
  }
  function rows(value) {
    const all = courses().map(path => ({id:path.id,title:path.title,
      read:value.paths[path.id]?.read.length || 0, checks:value.paths[path.id]?.assessed.length || 0,
      total:path.lessons.length,
      drafts:Object.keys(value.paths[path.id]?.challenges || {}).length,
      attempted:Object.values(value.paths[path.id]?.challenges || {}).filter(a=>a.status==='attempted').length,
      solved:Object.values(value.paths[path.id]?.challenges || {}).filter(a=>a.status==='solved').length}));
    const financePath = LEARNING_PATHS.find(p=>p.id==='financial-foundations');
    if (financePath) all.unshift({id:financePath.id,title:financePath.title,total:24,
      read:(value.financial?.done.length || 0)+(value.financial?.starterDone.length || 0),
      checks:Object.values(value.financial?.study || {}).filter(s=>s.checked).length});
    return all;
  }
  const count = row => `${row.read} read · ${row.checks} self-checked` + (row.drafts ? ` · ${row.drafts} code drafts · ${row.attempted} attempted · ${row.solved} solved` : '');
  function summary(value) {
    const all = rows(value), active = all.filter(row=>row.read || row.checks || row.drafts);
    const list = items => '<ul class="backup-counts">'+items.map(row=>'<li><strong>'+esc(row.title)+'</strong><span>'+esc(count(row))+' · '+row.total+' lessons</span></li>').join('')+'</ul>';
    return '<p>'+all.reduce((n,row)=>n+row.read,0)+' lessons read. Saved progress across '+active.length+' '+(active.length===1?'path':'paths')+'.</p>'+(active.length?list(active):'<p>No saved progress yet. Mark a lesson read or start a challenge to record your progress.</p>')+'<details><summary>All learning paths</summary>'+list(all)+'</details>';
  }
  function previewHtml(value, legacy) {
    const before = rows(value.before), incoming = rows(value.incoming), after = rows(value.after);
    let conflicts = 0;
    for (const [id,choice] of Object.entries(value.incoming.financial?.answers || {})) {
      if (own(value.before.financial?.answers || {},id) && value.before.financial.answers[id] !== choice) conflicts++;
    }
    let challengeConflicts = 0;
    for (const [id, entry] of Object.entries(value.incoming.paths)) {
      for (const [lesson, attempt] of Object.entries(entry.challenges || {})) {
        const local = value.before.paths[id]?.challenges?.[lesson];
        if (local && (local.code !== attempt.code || local.status !== attempt.status)) challengeConflicts++;
      }
    }
    return '<h2>Review the merge</h2>'+(legacy?'<p>This is an older Financial foundations backup. Other courses will stay as they are.</p>':'')+
      '<div class="backup-table-wrap" tabindex="0" role="region" aria-label="Progress comparison; scroll horizontally on small screens"><table><thead><tr><th scope="col">Path</th><th scope="col">Saved here</th><th scope="col">From file</th><th scope="col">After merge</th></tr></thead><tbody>'+
      after.map((row,i)=>'<tr><th scope="row">'+esc(row.title)+'</th><td>'+esc(count(before[i]))+'</td><td>'+esc(count(incoming[i]))+'</td><td>'+esc(count(row))+'</td></tr>').join('')+'</tbody></table></div>'+
      '<p>Financial quiz answers after merge: '+Object.keys(value.after.financial?.answers || {}).length+'. Conflicting answers kept from this browser: '+conflicts+'.</p>'+
      '<p>Conflicting challenge drafts kept from this browser: '+challengeConflicts+'.</p>'+
      '<p>Read lessons and self-checks are combined. Missing challenge drafts are imported. Existing local code, challenge status, quiz answers and last-opened locations win conflicts. Nothing is marked unread or reset.</p>';
  }
  function view() {
    let saved;
    try { saved = summary(read().progress); }
    catch (error) { saved = '<p role="alert">'+esc(error.message)+'</p>'; }
    return '<section class="notebook-backup backup-panel"><p class="eyebrow">Your learning, portable</p><h1>Progress & backups</h1>'+
      '<section aria-label="Saved progress"><h2>Your progress</h2><div id="nb-local">'+saved+'</div></section><h2>Back up progress</h2>'+
      '<p class="intro">Keep all learning paths together in one JSON backup. Downloads and imports happen in this browser; nothing is uploaded.</p>'+
      '<p>Progress belongs to this browser and site address. Move it between your phone and computer by downloading a backup, transferring the file yourself, then previewing and importing it here.</p>'+
      '<div class="backup-actions"><button type="button" class="primary" id="nb-export">Download notebook backup</button></div>'+
      '<h2>Restore from a file</h2><p>Import combines completed readings and self-checks with your current progress. Missing challenge drafts are added. Local code, challenge status and quiz answers win conflicts. Nothing is reset.</p>'+
      '<label for="nb-file">Choose a Learning Notebook JSON backup (up to 1 MB)</label><input id="nb-file" type="file" accept=".json,application/json">'+
      '<div id="nb-preview" aria-live="polite"></div><div class="backup-actions"><button type="button" class="primary" id="nb-apply" disabled>Merge reviewed progress</button></div>'+
      '<p id="nb-status" role="status" aria-live="polite"></p><p class="muted">Backups contain completion choices, financial quiz answers, and code and status saved in the challenge editor. They do not include course content or downloaded practice files. An older finance-only backup can also be merged. Journey/lab slider positions are temporary and are not stored as progress.</p></section>';
  }
  function bind(main) {
    const get = id => main.querySelector('#'+id), status = get('nb-status'), input = get('nb-file'), button = get('nb-apply');
    if (!status || !input || !button) return;
    let candidate = null, request = 0;
    get('nb-export')?.addEventListener('click',()=>{
      try {
        const blob = new Blob([create()],{type:'application/json'}), url = URL.createObjectURL(blob), anchor = document.createElement('a');
        anchor.href = url; anchor.download = 'learning-notebook-backup.json'; anchor.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        status.textContent = 'Backup download started. Save the file before changing browsers or clearing site data.';
      } catch (error) { status.textContent = error.message || 'The backup could not be downloaded.'; }
    });
    input.addEventListener('change',async()=>{
      const token = ++request, file = input.files?.[0]; candidate = null; button.disabled = true; get('nb-preview').innerHTML = ''; status.textContent = '';
      if (!file) return;
      try {
        if (file.size > LIMIT) fail('The backup is too large. Choose a JSON progress file smaller than 1 MB.');
        const imported = parse(await file.text());
        if (token !== request) return;
        const proposed = plan(imported.progress);
        candidate = {plan:proposed,legacy:imported.legacy};
        get('nb-preview').innerHTML = previewHtml(proposed,imported.legacy); button.disabled = false;
        status.textContent = 'Preview ready. No progress has been changed. Review the merge, then choose Merge reviewed progress.';
      } catch (error) { if (token === request) status.textContent = error.message || 'This backup could not be read.'; }
    });
    button.addEventListener('click',()=>{
      if (!candidate) return;
      try {
        if (!unchanged(candidate.plan.raw)) {
          candidate.plan = plan(candidate.plan.incoming);
          get('nb-preview').innerHTML = previewHtml(candidate.plan,candidate.legacy);
          status.textContent = 'Progress changed since the preview. The preview is updated; review it and choose Merge again.';
          return;
        }
        const after = apply(candidate.plan);
        get('nb-local').innerHTML = summary(after);
        candidate = null; button.disabled = true; input.value = '';
        get('nb-preview').innerHTML = '';
        status.textContent = 'Progress merged and saved in this browser. Reopen any other notebook tabs to load the updated progress.';
      } catch (error) { status.textContent = error.message || 'The import could not be saved.'; }
    });
  }
  return Object.freeze({parse,read,create,plan,apply,view,bind,LIMIT});
})();
function notebookBackupView() { return NotebookBackup.view(); }
function bindNotebookBackup(main) { NotebookBackup.bind(main); }
