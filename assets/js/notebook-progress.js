/* Progress dashboard: every figure is computed from this browser's storage, and nothing leaves the device. */
const NotebookProgress = (() => {
  'use strict';
  const DAY = 864e5, FINANCE = 'valuation-lab-v1', LAST = 'learning-notebook:last-lesson:v1';
  const FINANCE_SECTIONS = ['foundations','valuation-control','fair-value-hierarchy','prudent-valuation','working-knowledge','integrated-investigations','revision'];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plainTitle = title => String(title).replace(/^\d+\.\s*/, '');
  const plural = (n, one, many = one + 's') => n + ' ' + (n === 1 ? one : many);
  function load(name, fallback) {
    try { const value = JSON.parse(localStorage.getItem(name)); return value ?? fallback; } catch { return fallback; }
  }
  const strings = (value, allowed) => Array.isArray(value) ? [...new Set(value.filter(x => allowed.includes(x)))] : [];
  // Review outcomes for one course: due now (missed first), scheduled for later, or retired after a week.
  function review(p, now) {
    const result = {due:0, dueExercises:0, missed:0, scheduled:0, retired:0, next:null, attempted:0};
    if (typeof NotebookReview === 'undefined') return result;
    // Exercises join the counts once rated partly or missed; a first attempt that matched is never scheduled.
    const exercises = Object.values(NotebookReview.readExercises(p.id));
    result.attempted = exercises.filter(e => e.answer.trim()).length;
    for (const [entry, exercise] of [...Object.values(NotebookReview.read(p.id)).map(e => [e, false]), ...exercises.filter(e => e.correct !== undefined).map(e => [e, true])]) {
      const due = NotebookReview.dueAt(entry);
      if (due === null) result.retired++;
      else if (due <= now) { result.due++; if (exercise) result.dueExercises++; if (!entry.correct) result.missed++; }
      else { result.scheduled++; result.next = Math.min(result.next ?? Infinity, due); }
    }
    return result;
  }
  // Financial foundations reads like any course; its self-checks are the practice studio's study sections.
  function financeStudy() {
    const saved = load(FINANCE, {}), data = saved && typeof saved === 'object' ? saved : {};
    const study = data.study && typeof data.study === 'object' ? data.study : {};
    return {done:FINANCE_SECTIONS.filter(id => study[id]?.checked === true).length, total:FINANCE_SECTIONS.length, label:'study sections', href:'course.html#practice'};
  }
  // One course's state and the single next step that moves it forward.
  function course(p, now) {
    const attempts = p.challenges ? load('learning-notebook:challenges:' + p.id + ':v1', {}) : {};
    const entries = attempts && typeof attempts === 'object' && !Array.isArray(attempts) ? Object.entries(attempts) : [];
    const solved = new Set(entries.filter(([, a]) => a?.status === 'solved').map(([id]) => id));
    let state;
    {
      const lessons = Array.isArray(p.lessons) ? p.lessons : [], ids = lessons.map(l => l.id);
      const read = new Set(strings(load('learning-notebook:path:' + p.id + ':v1', []), ids));
      const stages = (p.stages || []).map(s => s.id);
      // A solved challenge needs no further visit, so the next step skips it as well as read lessons.
      state = {read:read.size, total:lessons.length, next:lessons.find(l => !read.has(l.id) && !solved.has(l.id)) || null,
        projects:p.id === 'financial-foundations' ? financeStudy() : {done:strings(load('learning-notebook:path:' + p.id + ':assessments:v1', []), stages).length, total:stages.length, label:'projects'}};
    }
    state.challenges = {solved:solved.size, attempted:entries.filter(([, a]) => a?.status === 'attempted').length, total:p.challenges || 0};
    state.review = review(p, now);
    state.started = !!(state.read || state.projects.done || state.challenges.solved || state.challenges.attempted || state.review.due + state.review.scheduled + state.review.retired || state.review.attempted);
    const home = p.href || '#path/' + p.id;
    state.step = state.read < state.total
      ? (state.next ? {label:(state.read || state.challenges.solved ? 'Next: ' : 'Start: ') + plainTitle(state.next.title), href:'#topic/' + p.id + '/' + state.next.id} : {label:'Continue the course', href:home})
      : state.projects.done < state.projects.total ? {label:'Self-check your ' + state.projects.label, href:state.projects.href || home}
      : {label:'Course complete · revisit it', href:home};
    return {p, ...state};
  }
  function summary(now = Date.now()) {
    const all = LEARNING_PATHS.filter(p => p.status === 'ready').map(p => course(p, now));
    const last = load(LAST, null)?.path;
    // The course read most recently comes first, then the furthest along.
    const started = all.filter(c => c.started).sort((a,b) => (b.p.id === last) - (a.p.id === last) || b.read / (b.total || 1) - a.read / (a.total || 1) || a.p.title.localeCompare(b.p.title));
    const sum = pick => all.reduce((n, c) => n + pick(c), 0);
    const next = all.map(c => c.review.next).filter(Boolean);
    return {started, waiting:all.filter(c => !c.started), courses:all.length,
      read:sum(c => c.read), attempted:sum(c => c.review.attempted), projects:sum(c => c.p.id === 'financial-foundations' ? 0 : c.projects.done), solved:sum(c => c.challenges.solved),
      challenges:sum(c => c.challenges.total),
      review:{due:sum(c => c.review.due), dueExercises:sum(c => c.review.dueExercises), missed:sum(c => c.review.missed), scheduled:sum(c => c.review.scheduled), retired:sum(c => c.review.retired), next:next.length ? Math.min(...next) : null}};
  }
  // "2 questions", "1 exercise" or "2 questions and 1 exercise".
  const dueText = r => [r.due - r.dueExercises ? plural(r.due - r.dueExercises, 'question') : '', r.dueExercises ? plural(r.dueExercises, 'exercise') : ''].filter(Boolean).join(' and ');
  function when(time, now) { const days = Math.ceil((time - now) / DAY); return days <= 1 ? 'tomorrow' : 'in ' + days + ' days'; }
  function reviewHtml(r, now) {
    const total = r.due + r.scheduled + r.retired;
    const body = !total ? '<p>Answer a lesson checkpoint and it joins your review. A question you miss comes back the next day; one you get right returns after 1, 3 and then 7 days, and leaves once you answer it after a week. An exercise you rate partly or missed follows the same schedule.</p>'
      : '<dl class="progress-review-counts"><div><dt>Due now</dt><dd>' + r.due + '</dd></div><div><dt>Missed</dt><dd>' + r.missed + '</dd></div><div><dt>Scheduled</dt><dd>' + r.scheduled + '</dd></div><div><dt>Retired</dt><dd>' + r.retired + '</dd></div></dl>' +
        (r.due ? '<a class="progress-action" href="#review">Review ' + dueText(r) + ' <span aria-hidden="true">→</span></a>'
          : '<p>Nothing is due.' + (r.next ? ' The next question returns ' + when(r.next, now) + '.' : '') + (r.scheduled ? ' <a href="#review">See the schedule</a>' : '') + '</p>');
    return '<section class="progress-review" aria-labelledby="progress-review-title"><h3 id="progress-review-title">Review</h3>' + body + '</section>';
  }
  function cardHtml(c) {
    const percent = c.total ? Math.round(c.read / c.total * 100) : 0, facts = [c.projects.done + ' of ' + c.projects.total + ' ' + c.projects.label + ' self-checked'];
    if (c.challenges.total) facts.push(c.challenges.solved + ' of ' + c.challenges.total + ' challenges solved' + (c.challenges.attempted ? ' · ' + c.challenges.attempted + ' in progress' : ''));
    if (c.review.attempted) facts.push(plural(c.review.attempted, 'exercise') + ' attempted');
    if (c.review.due) facts.push(dueText(c.review) + ' due for review');
    return '<li class="progress-course" data-subject="' + esc(c.p.id) + '"><div class="progress-course-head"><h4><a href="' + esc(c.p.href || '#path/' + c.p.id) + '">' + esc(c.p.title) + '</a></h4><span>' + c.read + ' of ' + c.total + ' lessons read</span></div>' +
      '<span class="progress-meter" aria-hidden="true"><span style="width:' + percent + '%"></span></span><ul class="progress-facts">' + facts.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
      '<a class="progress-next" href="' + esc(c.step.href) + '">' + esc(c.step.label) + ' <span aria-hidden="true">→</span></a></li>';
  }
  function view(now = Date.now()) {
    const s = summary(now);
    const stats = [['Lessons read', s.read], ['Courses started', s.started.length + ' of ' + s.courses], ['Projects self-checked', s.projects], ...(s.attempted ? [['Exercises attempted', s.attempted]] : []), ...(s.challenges ? [['Challenges solved', s.solved + ' of ' + s.challenges]] : []), ['Due for review', s.review.due]];
    const waiting = '<details class="progress-waiting"><summary>Not started yet (' + s.waiting.length + ')</summary><ul>' + s.waiting.map(c => '<li><a href="' + esc(c.p.href || '#path/' + c.p.id) + '">' + esc(c.p.title) + '</a> <span>' + plural(c.total, 'lesson') + '</span></li>').join('') + '</ul></details>';
    const courses = s.started.length
      ? '<section aria-labelledby="progress-courses-title"><h3 id="progress-courses-title">Courses in progress</h3><ol class="progress-courses">' + s.started.map(cardHtml).join('') + '</ol>' + (s.waiting.length ? waiting : '') + '</section>'
      : '<section class="progress-empty" aria-labelledby="progress-courses-title"><h3 id="progress-courses-title">No progress yet</h3><p>Progress is recorded as you learn, and stays in this browser:</p><ul><li><strong>Mark as read</strong> at the end of a lesson counts it towards its course.</li><li>Answering a <strong>checkpoint</strong> question schedules it for review.</li><li>Writing an <strong>exercise</strong> answer saves it; rating it partly or missed schedules it for review.</li><li>Ticking a <strong>project self-check</strong> on a course page records the project.</li><li>Code you run in a <strong>challenge</strong> is saved as a draft.</li></ul><a class="progress-action" href="#">Choose a course <span aria-hidden="true">→</span></a></section>';
    return '<section class="progress-dashboard" aria-labelledby="progress-title"><h2 id="progress-title" class="visually-hidden">Your progress</h2>' +
      (s.started.length ? '<dl class="progress-stats">' + stats.map(([label, value]) => '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>').join('') + '</dl>' : '') +
      '<div class="progress-columns">' + courses + reviewHtml(s.review, now) + '</div></section>';
  }
  return Object.freeze({course, summary, view});
})();
