/* Portable progress and challenge drafts. Imported code is stored as text, never executed here. */
const NotebookBackup = (() => {
  'use strict';
  // The limit is above anything browser storage can hold (about 5 million characters per site), so a full
  // backup does not fail in practice (#149); per-course files remain as a fallback if one ever does.
  const APP = 'learning-notebook', VERSION = 1, LIMIT = 20 * 1024 * 1024, LIMIT_TEXT = '20 MB';
  const bytes = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const FINANCE = 'valuation-lab-v1', LAST = 'learning-notebook:last-lesson:v1';
  const STUDY = ['foundations','valuation-control','fair-value-hierarchy','prudent-valuation','working-knowledge','integrated-investigations','revision'];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const key = id => 'learning-notebook:path:' + id + ':v1';
  const challengeKey = id => 'learning-notebook:challenges:' + id + ':v1';
  const challengeLessons = path => path.lessons.filter(l => l.exercise?.challenge);
  const assessment = id => 'learning-notebook:path:' + id + ':assessments:v1';
  const checkpointKey = id => 'learning-notebook:path:' + id + ':checkpoints:v1';
  const exerciseKey = id => 'learning-notebook:path:' + id + ':exercises:v1';
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
  // Checkpoint review: the first answer, its streak (0 after a miss, 1-4 correct in a row) and when it was given.
  // Keys are "<lesson>", "<lesson>/<n>" (n 2-9) for extra lesson questions and "stage/<stage>/<n>" (n 1-9) for stage checks.
  function checkpointKnown(id, path) {
    const parts = id.split('/'), lesson = path.lessons.some(l => l.id === parts[0]);
    if (parts.length === 1) return lesson;
    if (parts.length === 2) return lesson && /^[2-9]$/.test(parts[1]);
    return parts.length === 3 && parts[0] === 'stage' && /^[1-9]$/.test(parts[2]) && !!path.stages?.some(s => s.id === parts[1]);
  }
  function checkpoints(value, path) {
    object(value, 'Checkpoint answers');
    const result = {};
    for (const [id, entry] of Object.entries(value)) {
      if (!checkpointKnown(id, path)) fail('Checkpoint answers contain an unknown question.');
      fields(entry, ['correct','streak','at'], 'Checkpoint answer');
      if (typeof entry.correct !== 'boolean' || !Number.isInteger(entry.streak) || entry.streak < 0 || entry.streak > 4 || entry.correct !== entry.streak > 0) fail('Checkpoint answer streak is invalid.');
      if (!Number.isInteger(entry.at) || entry.at <= 0 || entry.at > Date.now() + 864e5) fail('Checkpoint answer date is invalid.');
      result[id] = {correct:entry.correct,streak:entry.streak,at:entry.at};
    }
    return result;
  }
  // Exercise attempts: the latest answer (at most 5,000 characters), when it was saved, and an optional rating with its review schedule.
  function exercises(value, path) {
    object(value, 'Exercise answers');
    const result = {};
    for (const [id, entry] of Object.entries(value)) {
      if (!path.lessons.some(l => l.id === id.replace(/\/practice\/[1-4]$/, ''))) fail('Exercise answers contain an unknown lesson.');
      fields(entry, ['answer','saved','rating','correct','streak','at'], 'Exercise answer');
      if (typeof entry.answer !== 'string' || entry.answer.length > 5000) fail('An exercise answer must be text of at most 5,000 characters.');
      if (!Number.isInteger(entry.saved) || entry.saved <= 0 || entry.saved > Date.now() + 864e5) fail('Exercise answer date is invalid.');
      if (own(entry,'rating') && !['matched','partly','missed'].includes(entry.rating)) fail('Exercise rating is invalid.');
      const timed = ['correct','streak','at'].filter(k => own(entry,k));
      if (timed.length && (timed.length < 3 || !own(entry,'rating') || entry.correct !== (entry.rating === 'matched'))) fail('Exercise review schedule is invalid.');
      if (timed.length && (typeof entry.correct !== 'boolean' || !Number.isInteger(entry.streak) || entry.streak < 0 || entry.streak > 4 || entry.correct !== entry.streak > 0 || !Number.isInteger(entry.at) || entry.at <= 0 || entry.at > Date.now() + 864e5)) fail('Exercise review schedule is invalid.');
      result[id] = {answer:entry.answer,saved:entry.saved,...(own(entry,'rating') ? {rating:entry.rating} : {}),...(timed.length ? {correct:entry.correct,streak:entry.streak,at:entry.at} : {})};
    }
    return result;
  }
  // The practice studio's own progress: practised/checked flags by module. Reading marks are course progress.
  function finance(value) {
    object(value, 'Financial progress');
    object(value.study ?? {}, 'Financial study progress');
    const study = {};
    for (const [id, flags] of Object.entries(value.study ?? {})) {
      if (!STUDY.includes(id)) fail('Financial study progress contains an unknown section.');
      fields(flags, ['practised','checked'], 'Financial study flags');
      if (typeof flags.practised !== 'boolean' || typeof flags.checked !== 'boolean' || (flags.checked && !flags.practised)) fail('Financial study flags are inconsistent.');
      study[id] = {practised:flags.practised, checked:flags.checked};
    }
    return {study};
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
      fields(entry, ['read','assessed','checkpoints','exercises', ...(challengeLessons(path).length ? ['challenges'] : [])], 'Course progress');
      paths[id] = {
        read:ids(entry.read, path.lessons.map(l=>l.id), path.title + ' readings'),
        assessed:ids(entry.assessed, (path.stages || []).map(s=>s.id), path.title + ' projects'),
        ...(own(entry,'challenges') ? {challenges:challenges(entry.challenges,path)} : {}),
        ...(own(entry,'checkpoints') ? {checkpoints:checkpoints(entry.checkpoints,path)} : {}),
        ...(own(entry,'exercises') ? {exercises:exercises(entry.exercises,path)} : {})
      };
    }
    return {paths,financial:value.financial == null ? null : finance(value.financial),
            lastLesson:value.lastLesson == null ? null : lastLesson(value.lastLesson)};
  }
  function parse(raw) {
    if (typeof raw !== 'string' || raw.length > LIMIT || new TextEncoder().encode(raw).length > LIMIT) fail('The backup is too large. Choose a JSON progress file smaller than ' + LIMIT_TEXT + '.');
    let data;
    try { data = JSON.parse(raw); } catch { fail('This is not a valid JSON progress file.'); }
    object(data, 'Backup');
    fields(data, ['app','version','createdAt','progress'], 'Backup');
    if (data.app !== APP || data.version !== VERSION) fail('This is not a supported Learning Notebook backup.');
    if (own(data,'createdAt') && (typeof data.createdAt !== 'string' || data.createdAt.length > 100 || !Number.isFinite(Date.parse(data.createdAt)))) fail('The backup date is invalid.');
    return {progress:progress(data.progress)};
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
      const answers = get(checkpointKey(path.id), path.title + ' checkpoint answers');
      if (answers !== null && Object.keys(object(answers, path.title + ' checkpoint answers')).length) result.paths[path.id].checkpoints = checkpoints(answers,path);
      const attempts = get(exerciseKey(path.id), path.title + ' exercise answers');
      if (attempts !== null && Object.keys(object(attempts, path.title + ' exercise answers')).length) result.paths[path.id].exercises = exercises(attempts,path);
    }
    const financial = get(FINANCE,'Financial progress');
    if (financial !== null) result.financial = finance(financial);
    const last = get(LAST,'Last opened lesson');
    if (last !== null) result.lastLesson = lastLesson(last);
    return {progress:result,raw};
  }
  // create(id) backs up one course. Imports merge and never reset, so a set of per-course files restores
  // the same progress as one full backup.
  function create(only, limit = LIMIT) {
    const all = read().progress;
    const progress = only ? {paths:{[only]:all.paths[only] || {read:[],assessed:[]}}, financial:only === 'financial-foundations' ? all.financial : null, lastLesson:null} : all;
    const text = JSON.stringify({app:APP,version:VERSION,createdAt:new Date().toISOString(),progress},null,2);
    if (new TextEncoder().encode(text).length > limit) throw Object.assign(new Error('The backup is larger than ' + LIMIT_TEXT + '. Download it course by course below instead.'), {tooLarge:true});
    return text;
  }
  function backupSize() { try { return new TextEncoder().encode(create()).length; } catch { return null; } }
  function sizeLine(n) { return n === null ? '' : 'Backup size: ' + bytes(n) + ' of the ' + LIMIT_TEXT + ' limit.' + (n > LIMIT * 0.8 ? ' It is close to the limit; back up course by course if it fails.' : ''); }
  const union = (a,b) => [...new Set([...a,...b])];
  function merge(current, imported) {
    const result = {paths:{},financial:null,lastLesson:current.lastLesson || imported.lastLesson};
    for (const path of courses()) {
      const a = current.paths[path.id] || {read:[],assessed:[]}, b = imported.paths[path.id] || {read:[],assessed:[]};
      result.paths[path.id] = {read:union(a.read,b.read),assessed:union(a.assessed,b.assessed)};
      if (challengeLessons(path).length) result.paths[path.id].challenges = {...b.challenges,...a.challenges};
      // The more recent answer reflects current recall; this browser wins a tie.
      if (a.checkpoints || b.checkpoints) {
        const answers = {...b.checkpoints};
        for (const [id, entry] of Object.entries(a.checkpoints || {})) if (!answers[id] || entry.at >= answers[id].at) answers[id] = entry;
        result.paths[path.id].checkpoints = answers;
      }
      // An exercise keeps its most recent change, an answer or a rating; this browser wins a tie.
      if (a.exercises || b.exercises) {
        const latest = entry => Math.max(entry.saved, entry.at || 0), attempts = {...b.exercises};
        for (const [id, entry] of Object.entries(a.exercises || {})) if (!attempts[id] || latest(entry) >= latest(attempts[id])) attempts[id] = entry;
        result.paths[path.id].exercises = attempts;
      }
    }
    const a = current.financial, b = imported.financial;
    if (!a || !b) result.financial = a || b;
    else {
      const study = {};
      for (const id of STUDY) {
        const old = a.study[id], incoming = b.study[id];
        if (old || incoming) study[id] = {practised:!!(old?.practised || incoming?.practised),checked:!!(old?.checked || incoming?.checked)};
      }
      result.financial = {study};
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
      if (own(incoming.paths[path.id],'checkpoints')) writes.push([checkpointKey(path.id),JSON.stringify(after.paths[path.id].checkpoints)]);
      if (own(incoming.paths[path.id],'exercises')) writes.push([exerciseKey(path.id),JSON.stringify(after.paths[path.id].exercises)]);
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
      answers:Object.keys(value.paths[path.id]?.checkpoints || {}).length,
      exercises:Object.values(value.paths[path.id]?.exercises || {}).filter(e => e.answer.trim()).length,
      drafts:Object.keys(value.paths[path.id]?.challenges || {}).length,
      attempted:Object.values(value.paths[path.id]?.challenges || {}).filter(a=>a.status==='attempted').length,
      solved:Object.values(value.paths[path.id]?.challenges || {}).filter(a=>a.status==='solved').length}));
    // The practice studio's self-checks count towards the Financial foundations row.
    const finance = all.find(row => row.id === 'financial-foundations');
    if (finance) finance.checks += Object.values(value.financial?.study || {}).filter(s=>s.checked).length;
    return all;
  }
  const count = row => `${row.read} read · ${row.checks} self-checked` + (row.answers ? ` · ${row.answers} checkpoints answered` : '') + (row.exercises ? ` · ${row.exercises} exercises attempted` : '') + (row.drafts ? ` · ${row.drafts} code drafts · ${row.attempted} attempted · ${row.solved} solved` : '');
  function summary(value) {
    const all = rows(value), active = all.filter(row=>row.read || row.checks || row.answers || row.exercises || row.drafts);
    const list = items => '<ul class="backup-counts">'+items.map(row=>'<li><strong>'+esc(row.title)+'</strong><span>'+esc(count(row))+' · '+row.total+' lessons</span></li>').join('')+'</ul>';
    return '<p>'+all.reduce((n,row)=>n+row.read,0)+' lessons read. Saved progress across '+active.length+' '+(active.length===1?'path':'paths')+'.</p>'+(active.length?list(active):'<p>No saved progress yet. Mark a lesson read or start a challenge to record your progress.</p>')+'<details><summary>All learning paths</summary>'+list(all)+'</details>';
  }
  function previewHtml(value) {
    const before = rows(value.before), incoming = rows(value.incoming), after = rows(value.after);
    let challengeConflicts = 0;
    for (const [id, entry] of Object.entries(value.incoming.paths)) {
      for (const [lesson, attempt] of Object.entries(entry.challenges || {})) {
        const local = value.before.paths[id]?.challenges?.[lesson];
        if (local && (local.code !== attempt.code || local.status !== attempt.status)) challengeConflicts++;
      }
    }
    return '<h2>Review the merge</h2>'+
      '<div class="backup-table-wrap" tabindex="0" role="region" aria-label="Progress comparison; scroll horizontally on small screens"><table><thead><tr><th scope="col">Path</th><th scope="col">Saved here</th><th scope="col">From file</th><th scope="col">After merge</th></tr></thead><tbody>'+
      after.map((row,i)=>'<tr><th scope="row">'+esc(row.title)+'</th><td>'+esc(count(before[i]))+'</td><td>'+esc(count(incoming[i]))+'</td><td>'+esc(count(row))+'</td></tr>').join('')+'</tbody></table></div>'+
      '<p>Conflicting challenge drafts kept from this browser: '+challengeConflicts+'.</p>'+
      '<p>Read lessons and self-checks are combined. Missing challenge drafts are imported. Existing local code, challenge status and last-opened locations win conflicts. For review checkpoints and exercise answers, the more recent one is kept. Nothing is marked unread or reset.</p>';
  }
  // Safety (#148): ask the browser to keep this site's storage, and remember when a backup was last downloaded,
  // so the notebook can say when progress has changed since. The fingerprint covers progress keys only, not the
  // last-opened lesson, so opening lessons alone never makes a backup look out of date.
  const BACKUP_KEY = 'learning-notebook:last-backup:v1', PERSIST_KEY = 'learning-notebook:persist-requested:v1', NUDGE_DAYS = 14;
  const progressKey = name => name.startsWith('learning-notebook:path:') || name.startsWith('learning-notebook:challenges:') || name === FINANCE;
  function progressEntries() {
    let store; try { store = storage(); } catch { return []; }
    const names = [];
    try { for (let i = 0; i < store.length; i++) { const name = store.key(i); if (name && progressKey(name)) names.push(name); } } catch { return []; }
    return names.sort().map(name => [name, store.getItem(name)]).filter(([, value]) => value !== null && value !== '[]' && value !== '{}');
  }
  function fingerprint(entries = progressEntries()) {
    const text = JSON.stringify(entries); let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(36) + ':' + text.length;
  }
  function lastBackup() {
    try { const value = JSON.parse(storage().getItem(BACKUP_KEY)); return value && Number.isFinite(value.at) && typeof value.fingerprint === 'string' ? value : null; }
    catch { return null; }
  }
  function remember(now = Date.now()) { try { storage().setItem(BACKUP_KEY, JSON.stringify({at: now, fingerprint: fingerprint()})); } catch {} }
  function safety(now = Date.now()) {
    const entries = progressEntries(), last = lastBackup(), has = entries.length > 0;
    const days = last ? Math.max(0, Math.floor((now - last.at) / 864e5)) : null, changed = has && (!last || last.fingerprint !== fingerprint(entries));
    return {has, last, days, changed, nudge: has && (!last || changed && days >= NUDGE_DAYS)};
  }
  const ago = days => days === 0 ? 'today' : days === 1 ? 'yesterday' : days + ' days ago';
  function backupLine(state) {
    if (!state.has) return 'No progress to back up yet.';
    if (!state.last) return 'Not backed up yet. Your progress exists only in this browser.';
    return 'Last backup: ' + ago(state.days) + (state.changed ? ', with new progress since.' : '. Nothing has changed since.');
  }
  // A quiet home-page line, shown only when a backup is due.
  function reminder(now = Date.now()) {
    const state = safety(now);
    if (!state.nudge) return '';
    return '<section class="review-card is-quiet backup-reminder" aria-label="Backup"><p><strong>Backup</strong> · ' + esc(backupLine(state)) + ' <a href="#backup">Back up now</a></p></section>';
  }
  // Asked once, after progress exists; Chrome and Edge answer silently, Firefox may ask. The answer is shown on Progress & backups.
  async function protect(force = false) {
    const api = typeof navigator !== 'undefined' && navigator.storage;
    if (!api || typeof api.persist !== 'function') return 'unsupported';
    try {
      if (await api.persisted()) return 'persisted';
      if (!force) { if (!progressEntries().length || storage().getItem(PERSIST_KEY)) return 'not-persisted'; storage().setItem(PERSIST_KEY, String(Date.now())); }
      return await api.persist() ? 'persisted' : 'not-persisted';
    } catch { return 'unsupported'; }
  }
  const persistText = {persisted: 'Protected: this browser has agreed to keep the notebook’s storage, even when space runs low.',
    'not-persisted': 'Not protected: the browser may clear the notebook’s storage when space runs low, or after weeks without a visit in Safari. Keep a recent backup.',
    unsupported: 'This browser does not say whether it will keep the notebook’s storage. Keep a recent backup.'};
  function view() {
    let saved, failed = false;
    try { saved = summary(read().progress); }
    catch (error) { saved = '<p role="alert">'+esc(error.message)+'</p>'; failed = true; }
    const dashboard = typeof NotebookProgress === 'undefined' ? '' : '<div id="nb-dashboard">'+NotebookProgress.view()+'</div>';
    return '<section class="notebook-backup backup-panel"><p class="eyebrow">Your learning, in this browser</p><h1>Progress & backups</h1>'+dashboard+
      '<h2>Back up progress</h2>'+
      '<p class="intro">Keep all learning paths together in one JSON backup. Downloads and imports happen in this browser; nothing is uploaded.</p>'+
      '<p>Progress belongs to this browser and site address. Move it between your phone and computer by downloading a backup, transferring the file yourself, then previewing and importing it here.</p>'+
      '<div class="backup-safety"><p id="nb-last-backup"'+(safety().nudge?' class="backup-due"':'')+'>'+esc(backupLine(safety()))+'</p><p id="nb-persist">Checking whether this browser will keep your progress…</p><button type="button" class="quiet" id="nb-persist-ask" hidden>Ask the browser to keep it</button></div>'+
      '<details class="backup-contents"'+(failed?' open':'')+'><summary>What a backup holds</summary><div id="nb-local">'+saved+'</div></details>'+
      '<div class="backup-actions"><button type="button" class="primary" id="nb-export">Download notebook backup</button></div><p id="nb-size" class="muted">'+esc(sizeLine(backupSize()))+'</p><div id="nb-split"></div>'+
      '<h2>Restore from a file</h2><p>Import combines completed readings and self-checks with your current progress. Missing challenge drafts are added. Local code and challenge status win conflicts. Nothing is reset.</p>'+
      '<label for="nb-file">Choose a Learning Notebook JSON backup (up to '+LIMIT_TEXT+')</label><input id="nb-file" type="file" accept=".json,application/json">'+
      '<div id="nb-preview" aria-live="polite"></div><div class="backup-actions"><button type="button" class="primary" id="nb-apply" disabled>Merge reviewed progress</button></div>'+
      '<p id="nb-status" role="status" aria-live="polite"></p><p class="muted">Backups contain completion choices, checkpoint answers for review, exercise answers and ratings, and code and status saved in the challenge editor. They do not include course content or downloaded practice files. Journey/lab slider positions are temporary and are not stored as progress.</p></section>';
  }
  function bind(main) {
    const get = id => main.querySelector('#'+id), status = get('nb-status'), input = get('nb-file'), button = get('nb-apply');
    if (!status || !input || !button) return;
    let candidate = null, request = 0;
    const persist = get('nb-persist'), ask = get('nb-persist-ask');
    const showPersist = state => { if (persist) persist.textContent = persistText[state]; if (ask) ask.hidden = state !== 'not-persisted'; };
    if (persist) protect().then(showPersist);
    ask?.addEventListener('click', async () => { ask.disabled = true; showPersist(await protect(true)); ask.disabled = false; });
    const download = (text, name) => {
      const blob = new Blob([text],{type:'application/json'}), url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = name; anchor.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    const backedUp = () => { remember(); const line = get('nb-last-backup'); if (line) { line.textContent = backupLine(safety()); line.className = ''; } };
    // Fallback when the full backup is too large: one file per course with progress. Each imports on its own.
    function split() {
      const box = get('nb-split'); if (!box) return;
      const active = rows(read().progress).filter(row => row.read || row.checks || row.answers || row.exercises || row.drafts), done = new Set();
      box.innerHTML = '<p>Download each course’s progress as its own file. Import them one after another to restore everything.</p><div class="backup-actions">' +
        active.map(row => '<button type="button" class="secondary" data-course="'+esc(row.id)+'">'+esc(row.title)+'</button>').join('') + '</div>';
      for (const button of box.querySelectorAll('button[data-course]')) button.addEventListener('click', () => {
        try {
          download(create(button.dataset.course), 'learning-notebook-backup-' + button.dataset.course + '.json');
          done.add(button.dataset.course); button.textContent += ' ✓';
          if (done.size === active.length) { backedUp(); status.textContent = 'Every course is downloaded. Keep all the files together.'; }
          else status.textContent = done.size + ' of ' + active.length + ' course files downloaded.';
        } catch (error) { status.textContent = error.message || 'This course could not be downloaded.'; }
      });
    }
    get('nb-export')?.addEventListener('click',()=>{
      try {
        download(create(), 'learning-notebook-backup.json');
        backedUp();
        status.textContent = 'Backup download started. Save the file before changing browsers or clearing site data.';
      } catch (error) { status.textContent = error.message || 'The backup could not be downloaded.'; if (error?.tooLarge) split(); }
    });
    input.addEventListener('change',async()=>{
      const token = ++request, file = input.files?.[0]; candidate = null; button.disabled = true; get('nb-preview').innerHTML = ''; status.textContent = '';
      if (!file) return;
      try {
        if (file.size > LIMIT) fail('The backup is too large. Choose a JSON progress file smaller than ' + LIMIT_TEXT + '.');
        const imported = parse(await file.text());
        if (token !== request) return;
        const proposed = plan(imported.progress);
        candidate = {plan:proposed};
        get('nb-preview').innerHTML = previewHtml(proposed); button.disabled = false;
        status.textContent = 'Preview ready. No progress has been changed. Review the merge, then choose Merge reviewed progress.';
      } catch (error) { if (token === request) status.textContent = error.message || 'This backup could not be read.'; }
    });
    button.addEventListener('click',()=>{
      if (!candidate) return;
      try {
        if (!unchanged(candidate.plan.raw)) {
          candidate.plan = plan(candidate.plan.incoming);
          get('nb-preview').innerHTML = previewHtml(candidate.plan);
          status.textContent = 'Progress changed since the preview. The preview is updated; review it and choose Merge again.';
          return;
        }
        const after = apply(candidate.plan);
        get('nb-local').innerHTML = summary(after);
        const dashboard = main.querySelector('#nb-dashboard');
        if (dashboard && typeof NotebookProgress !== 'undefined') dashboard.innerHTML = NotebookProgress.view();
        candidate = null; button.disabled = true; input.value = '';
        get('nb-preview').innerHTML = '';
        status.textContent = 'Progress merged and saved in this browser. Reopen any other notebook tabs to load the updated progress.';
      } catch (error) { status.textContent = error.message || 'The import could not be saved.'; }
    });
  }
  return Object.freeze({parse,read,create,plan,apply,view,bind,LIMIT,backupSize,safety,reminder,protect,remember});
})();
function notebookBackupView() { return NotebookBackup.view(); }
function bindNotebookBackup(main) { NotebookBackup.bind(main); }
// Once progress exists, ask the browser to keep it (asked once; see protect).
if (typeof window !== 'undefined' && typeof document !== 'undefined') setTimeout(() => { NotebookBackup.protect(); }, 4000);
