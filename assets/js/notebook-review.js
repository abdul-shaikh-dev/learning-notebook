/* Checkpoint outcomes and spaced review. Outcomes stay in this browser and travel only in backups. */
const NotebookReview = (() => {
  'use strict';
  const DAY = 864e5, INTERVALS = [1,3,7], LIMIT = 10;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = id => 'learning-notebook:path:' + id + ':checkpoints:v1';
  const courses = () => LEARNING_PATHS.filter(p => p.status === 'ready' && Array.isArray(p.lessons));
  const plainTitle = title => String(title).replace(/^\d+\.\s*/, '');
  // Question keys: "<lesson>" is the lesson checkpoint, "<lesson>/<n>" (n 2-9) an extra lesson question, "stage/<stage>/<n>" (n 1-9) a stage check.
  function known(path, id) {
    const parts = String(id).split('/');
    if (parts.length === 1) return path.lessons.some(l => l.id === id);
    if (parts.length === 2) return /^[2-9]$/.test(parts[1]) && path.lessons.some(l => l.id === parts[0]);
    return parts.length === 3 && parts[0] === 'stage' && /^[1-9]$/.test(parts[2]) && !!path.stages?.some(s => s.id === parts[1]);
  }
  // Resolves a key to its quiz (present once the course content has loaded), a label and a link.
  function question(path, id) {
    if (!known(path, id)) return null;
    const parts = id.split('/');
    if (parts[0] === 'stage') {
      const index = path.stages.findIndex(s => s.id === parts[1]);
      return {quiz:path.stages[index].stageCheck?.[parts[2] - 1],title:'Stage ' + (index + 1) + ' check · Question ' + parts[2],href:'#path/' + path.id};
    }
    const lesson = path.lessons.find(l => l.id === parts[0]);
    return {lesson,quiz:parts[1] ? lesson.extraQuiz?.[parts[1] - 2] : lesson.quiz,title:plainTitle(lesson.title) + (parts[1] ? ' · Question ' + parts[1] : ''),href:'#topic/' + path.id + '/' + lesson.id};
  }
  // The lesson checkpoint keeps its course-balanced order; other questions take a stable order from their key.
  const choices = (path, id, q) => id.includes('/') ? keyedQuizChoices(q.quiz, path.id + '/' + id) : quizChoices(path, q.lesson);
  // A miss resets the streak; each correct answer waits 1, 3, then 7 days; a correct answer after 7 days retires it.
  function valid(entry) {
    return !!entry && typeof entry === 'object' && !Array.isArray(entry) && Object.keys(entry).every(k => ['correct','streak','at'].includes(k)) &&
      typeof entry.correct === 'boolean' && Number.isInteger(entry.streak) && entry.streak >= 0 && entry.streak <= INTERVALS.length + 1 &&
      entry.correct === entry.streak > 0 && Number.isInteger(entry.at) && entry.at > 0;
  }
  function read(id) {
    const path = courses().find(p => p.id === id), result = {};
    if (!path) return result;
    try {
      const data = JSON.parse(localStorage.getItem(key(id)) || '{}');
      if (!data || typeof data !== 'object' || Array.isArray(data)) return result;
      for (const [id, entry] of Object.entries(data)) if (known(path, id) && valid(entry)) result[id] = {correct:entry.correct,streak:entry.streak,at:entry.at};
    } catch {}
    return result;
  }
  function dueAt(entry) {
    if (!entry.correct) return entry.at;
    return entry.streak > INTERVALS.length ? null : entry.at + INTERVALS[entry.streak - 1] * DAY;
  }
  // Only the first answer on each showing counts. A correct answer before the due date, or after retirement, keeps the current schedule.
  function record(path, id, correct, now = Date.now()) {
    const saved = read(path.id), before = saved[id];
    let entry;
    if (!correct) entry = {correct:false,streak:0,at:now};
    else if (before?.correct && (dueAt(before) === null || now < dueAt(before))) entry = before;
    else entry = {correct:true,streak:before?.correct ? before.streak + 1 : 1,at:now};
    try { localStorage.setItem(key(path.id), JSON.stringify({...saved,[id]:entry})); }
    catch { return {saved:false,entry}; }
    return {saved:true,entry,previous:before || null};
  }
  // Undo restores what was saved before a mis-click, so the next choice counts instead.
  function undo(path, id, previous) {
    const saved = read(path.id);
    if (previous) saved[id] = previous; else delete saved[id];
    try { localStorage.setItem(key(path.id), JSON.stringify(saved)); return true; }
    catch { return false; }
  }
  // Shows where the answer went, with an undo for mis-clicks; reset() lets the next choice be saved.
  function showNote(element, path, id, result, reset, now = Date.now()) {
    if (!element) return;
    element.textContent = note(result, now);
    if (!result.saved || typeof document === 'undefined' || !element.append) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'text-action review-undo'; button.textContent = 'Undo: I chose by mistake';
    button.addEventListener('click', () => {
      element.textContent = undo(path, id, result.previous) ? 'Answer removed. Your next choice will be saved.' : 'This browser could not remove the answer.';
      reset();
    });
    element.append(' ', button);
  }
  function note(result, now = Date.now()) {
    if (!result.saved) return 'This browser could not save the answer for review.';
    const due = dueAt(result.entry);
    if (due === null) return 'Answered correctly after a week. This question leaves your review.';
    if (!result.entry.correct) return 'Saved for review. It stays there until you answer it correctly.';
    const days = Math.max(1, Math.round((due - now) / DAY));
    return 'Saved for review. It returns in ' + days + (days === 1 ? ' day.' : ' days.');
  }
  function items(now = Date.now()) {
    const all = [];
    for (const path of courses()) {
      for (const [id, entry] of Object.entries(read(path.id))) {
        const due = dueAt(entry);
        if (due !== null) all.push({path,key:id,question:question(path, id),entry,due,ready:due <= now});
      }
    }
    return all.sort((a,b) => Number(a.entry.correct) - Number(b.entry.correct) || a.due - b.due);
  }
  const dueItems = (now = Date.now()) => items(now).filter(item => item.ready);
  const dueCourses = (now = Date.now()) => [...new Set(dueItems(now).slice(0, LIMIT).map(item => item.path.id))];
  function when(time, now = Date.now()) {
    const days = Math.ceil((time - now) / DAY);
    return days <= 1 ? 'tomorrow' : 'in ' + days + ' days';
  }
  function card(now = Date.now()) {
    const all = items(now), due = all.filter(item => item.ready);
    if (!all.length) return '';
    if (!due.length) return '<section class="review-card is-quiet" aria-label="Review"><p><strong>Review</strong> · Nothing due. ' + all.length + (all.length === 1 ? ' question is' : ' questions are') + ' scheduled; the next returns ' + when(all.reduce((t,item) => Math.min(t,item.due), Infinity), now) + '. <a href="#review">See the schedule</a></p></section>';
    const missed = due.filter(item => !item.entry.correct).length, paths = new Set(due.map(item => item.path.id)).size;
    return '<section class="resume-card review-card" aria-labelledby="review-card-title"><div><p>Review</p><h2 id="review-card-title">' + due.length + (due.length === 1 ? ' question' : ' questions') + ' to review</h2><small>' +
      (missed ? missed + ' missed · ' : '') + 'From ' + paths + (paths === 1 ? ' course' : ' courses') + '</small></div><a href="#review">Start review <span aria-hidden="true">→</span></a></section>';
  }
  function view(now = Date.now()) {
    const due = dueItems(now), shown = due.filter(item => item.question.quiz).slice(0, LIMIT);
    const upcoming = items(now).filter(item => !item.ready).sort((a,b) => a.due - b.due);
    const head = '<a href="#">← All learning paths</a><h1>Review</h1><p class="intro">Questions you missed come first, then questions due again. Answer from memory before opening the lesson.</p>';
    // The schedule needs only catalog titles, so it never loads course content.
    const schedule = upcoming.length ? '<section class="review-schedule" aria-labelledby="review-schedule-title"><h2 id="review-schedule-title">Coming up</h2><ul>' + upcoming.slice(0, 20).map(item =>
      '<li><a href="' + esc(item.question.href) + '">' + esc(item.path.title) + ' · ' + esc(item.question.title) + '</a><span>Returns ' + when(item.due, now) + '</span></li>').join('') + '</ul>' +
      (upcoming.length > 20 ? '<p class="muted">And ' + (upcoming.length - 20) + ' more.</p>' : '') + '</section>' : '';
    if (!shown.length) return '<section class="review-page">' + head + '<p role="status">Nothing to review right now.' + (upcoming.length ? '' : ' Answer a lesson checkpoint to start your review list.') + '</p>' + schedule + '</section>';
    return '<section class="review-page">' + head + '<p class="muted">' + shown.length + ' of ' + due.length + ' due questions shown.</p><ol class="review-list">' + shown.map((item, i) =>
      '<li class="quiz review-item" data-review="' + i + '"><p class="review-source"><a href="' + esc(item.question.href) + '">' + esc(item.path.title) + ' · ' + esc(item.question.title) + '</a>' + (item.entry.correct ? '' : ' <span class="review-missed">Missed</span>') + '</p>' +
      '<h2 id="review-question-' + i + '">' + esc(item.question.quiz.question) + '</h2><div role="group" aria-labelledby="review-question-' + i + '">' + choices(item.path, item.key, item.question).map(c => '<button class="option" type="button" data-review-choice="' + c.index + '">' + esc(c.text) + '</button>').join('') + '</div>' +
      '<p class="review-feedback" role="status"></p><p class="review-note muted"></p></li>').join('') + '</ol>' + schedule + '</section>';
  }
  function bind(main, now = () => Date.now()) {
    const shown = dueItems(now()).filter(item => item.question.quiz).slice(0, LIMIT);
    main.querySelectorAll('[data-review]').forEach(row => {
      const item = shown[Number(row.dataset.review)];
      if (!item) return;
      let answered = false;
      row.querySelectorAll('[data-review-choice]').forEach(button => button.addEventListener('click', () => {
        const quiz = item.question.quiz, correct = Number(button.dataset.reviewChoice) === quiz.correct;
        row.querySelector('.review-feedback').textContent = (correct ? 'Correct. ' : 'Not quite. ') + quiz.explanation;
        if (answered) return;
        answered = true;
        showNote(row.querySelector('.review-note'), item.path, item.key, record(item.path, item.key, correct, now()), () => { answered = false; }, now());
      }));
    });
  }
  return {key,known,question,valid,read,record,undo,note,showNote,dueAt,items,dueCourses,card,view,bind,INTERVALS};
})();
