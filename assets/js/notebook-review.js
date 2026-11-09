/* Checkpoint outcomes, exercise attempts and spaced review. Both stay in this browser and travel only in backups. */
const NotebookReview = (() => {
  'use strict';
  const DAY = 864e5, INTERVALS = [1,3,7], LIMIT = 10;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = id => 'learning-notebook:path:' + id + ':checkpoints:v1';
  const exerciseKey = id => 'learning-notebook:path:' + id + ':exercises:v1';
  const ANSWER = 5000, RATINGS = ['matched','partly','missed'];
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
  // Exercise attempts: the latest answer and when it was saved, and once compared, a self-rating against the checklist.
  // Partly and missed ratings take the checkpoint schedule (correct = matched); a first attempt that matches is not scheduled.
  function validExercise(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).some(k => !['answer','saved','rating','correct','streak','at'].includes(k))) return false;
    if (typeof entry.answer !== 'string' || entry.answer.length > ANSWER || !Number.isInteger(entry.saved) || entry.saved <= 0) return false;
    if (entry.rating !== undefined && !RATINGS.includes(entry.rating)) return false;
    const timed = ['correct','streak','at'].filter(k => entry[k] !== undefined).length;
    if (timed === 0) return true;
    return timed === 3 && entry.rating !== undefined && valid({correct:entry.correct,streak:entry.streak,at:entry.at}) && entry.correct === (entry.rating === 'matched');
  }
  const scheduled = entry => entry.correct !== undefined;
  // Exercise records are keyed by lesson id; practice-ladder steps by "<lesson>/practice/<1-4>".
  function exerciseTarget(path, key) {
    const match = /^(.+)\/practice\/([1-4])$/.exec(key), lesson = path.lessons.find(l => l.id === (match ? match[1] : key));
    return lesson ? {lesson, step:match ? Number(match[2]) : 0} : null;
  }
  function readExercises(id) {
    const path = courses().find(p => p.id === id), result = {};
    if (!path) return result;
    try {
      const data = JSON.parse(localStorage.getItem(exerciseKey(id)) || '{}');
      if (!data || typeof data !== 'object' || Array.isArray(data)) return result;
      for (const [lesson, entry] of Object.entries(data)) if (exerciseTarget(path, lesson) && validExercise(entry)) result[lesson] = {...entry};
    } catch {}
    return result;
  }
  function writeExercise(path, lesson, entry) {
    const saved = readExercises(path.id);
    if (entry) saved[lesson] = entry; else delete saved[lesson];
    try { localStorage.setItem(exerciseKey(path.id), JSON.stringify(saved)); return true; }
    catch { return false; }
  }
  // Clearing an unrated answer removes the record; a rated one keeps its rating and schedule.
  function saveAnswer(path, lesson, answer, now = Date.now()) {
    const before = readExercises(path.id)[lesson], text = String(answer).slice(0, ANSWER);
    if (!text.trim() && !before?.rating) return {saved:writeExercise(path, lesson, null),entry:null};
    const entry = {...before,answer:text,saved:now};
    return {saved:writeExercise(path, lesson, entry),entry};
  }
  // base is the entry before this showing's first rating, so changing the rating replaces it rather than stacking.
  function rate(path, lesson, rating, base, now = Date.now()) {
    const current = readExercises(path.id)[lesson] || {answer:'',saved:now}, matched = rating === 'matched';
    let timing = null;
    if (!matched) timing = {correct:false,streak:0,at:now};
    else if (base && scheduled(base)) timing = base.correct && (dueAt(base) === null || now < dueAt(base)) ? {correct:base.correct,streak:base.streak,at:base.at} : {correct:true,streak:base.correct ? base.streak + 1 : 1,at:now};
    const entry = {answer:current.answer,saved:current.saved,rating,...timing};
    return {saved:writeExercise(path, lesson, entry),entry};
  }
  function exerciseNote(result, now = Date.now()) {
    if (!result.saved) return 'This browser could not save the rating.';
    if (!scheduled(result.entry)) return 'Rating saved. An attempt that matches first time is not scheduled for review.';
    const due = dueAt(result.entry);
    if (due === null) return 'Matched again after a week. This exercise leaves your review.';
    if (!result.entry.correct) return 'Saved for review. It stays there until an attempt matches the checklist.';
    const days = Math.max(1, Math.round((due - now) / DAY));
    return 'Saved for review. It returns in ' + days + (days === 1 ? ' day.' : ' days.');
  }
  const RATING_LABELS = {matched:'Matched it',partly:'Partly',missed:'Missed it'};
  // The answer box, and the worked solution that opens after an attempt (or on request) with the self-rating.
  // In review the box starts empty and the earlier answer appears beside the solution.
  function attemptView(path, lesson, prefix, solution, previous = null) {
    const review = previous !== null, entry = readExercises(path.id)[lesson.id], shown = !!entry?.rating && !review;
    return '<div class="exercise-attempt" data-attempt="' + esc(lesson.id) + '" data-prefix="' + esc(prefix) + '"' + (review ? ' data-review-mode' : '') + '>' +
      '<label class="exercise-label" for="' + prefix + '-answer">Your answer</label>' +
      '<p class="muted exercise-help" id="' + prefix + '-help">Write your attempt, then compare it with the worked solution. It is saved in this browser.</p>' +
      '<textarea id="' + prefix + '-answer" class="exercise-answer" rows="6" maxlength="' + ANSWER + '" aria-describedby="' + prefix + '-help ' + prefix + '-status">' + (review ? '' : esc(entry?.answer || '')) + '</textarea>' +
      '<p id="' + prefix + '-status" class="muted exercise-status" role="status"></p>' +
      '<div class="exercise-actions"' + (shown ? ' hidden' : '') + '><button type="button" class="primary" data-attempt-compare>Compare with the worked solution</button><button type="button" class="text-action" data-attempt-skip>Show the solution without answering</button></div>' +
      '<section class="exercise-solution" data-attempt-solution aria-labelledby="' + prefix + '-solution-title"' + (shown ? '' : ' hidden') + '><h3 id="' + prefix + '-solution-title" tabindex="-1">Worked solution</h3>' + solution +
      (review && previous.trim() ? '<details class="exercise-previous"><summary>Your previous answer</summary><p>' + esc(previous) + '</p></details>' : '') +
      '<fieldset class="exercise-rating"><legend>How did your answer compare with the checklist?</legend>' + RATINGS.map(r => '<button type="button" class="option" data-rating="' + r + '" aria-pressed="' + (shown && entry.rating === r) + '">' + RATING_LABELS[r] + '</button>').join('') + '</fieldset>' +
      '<p class="muted exercise-note" data-rating-note role="status"></p></section></div>';
  }
  function bindAttempt(root, path, lesson, now = () => Date.now()) {
    const box = root?.querySelector?.('[data-attempt="' + lesson.id + '"]');
    if (!box) return;
    const prefix = box.dataset.prefix, answer = box.querySelector('textarea'), status = box.querySelector('.exercise-status');
    const solution = box.querySelector('[data-attempt-solution]'), actions = box.querySelector('.exercise-actions');
    let timer = null, base;
    // In review an empty box is a fresh start, not a reason to forget the earlier answer.
    const save = () => {
      clearTimeout(timer); timer = null;
      if (box.hasAttribute('data-review-mode') && !answer.value.trim()) return;
      const result = saveAnswer(path, lesson.id, answer.value, now());
      status.textContent = result.saved ? (result.entry ? 'Saved in this browser.' : '') : 'This browser could not save your answer.';
    };
    answer.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(save, 400); });
    const open = () => { if (timer) save(); actions.hidden = true; solution.hidden = false; box.querySelector('#' + prefix + '-solution-title')?.focus(); };
    box.querySelector('[data-attempt-compare]').addEventListener('click', () => {
      if (!answer.value.trim()) { status.textContent = 'Write an attempt first, or choose "Show the solution without answering".'; answer.focus(); return; }
      open();
    });
    box.querySelector('[data-attempt-skip]').addEventListener('click', open);
    box.querySelectorAll('[data-rating]').forEach(button => button.addEventListener('click', () => {
      if (timer) save();
      if (base === undefined) base = readExercises(path.id)[lesson.id] || null;
      const result = rate(path, lesson.id, button.dataset.rating, base, now());
      box.querySelectorAll('[data-rating]').forEach(b => b.setAttribute('aria-pressed', String(b === button && result.saved)));
      box.querySelector('[data-rating-note]').textContent = exerciseNote(result, now());
    }));
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
      for (const [id, entry] of Object.entries(readExercises(path.id))) {
        const {lesson, step} = exerciseTarget(path, id), due = scheduled(entry) ? dueAt(entry) : null;
        // A practice step's content is undefined until the course loads, or if the step was removed.
        const exercise = step ? lesson.practice?.[step - 1] : lesson.exercise;
        if (due !== null) all.push({path,key:id,exercise:true,question:{record:{id},exercise,title:plainTitle(lesson.title) + (step ? ' · Practice ' + step : ' · Exercise'),href:'#topic/' + path.id + '/' + lesson.id},entry,due,ready:due <= now});
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
  // "2 questions", "1 exercise" or "2 questions and 1 exercise".
  function counted(list) {
    const ex = list.filter(item => item.exercise).length, qs = list.length - ex;
    return [qs ? qs + (qs === 1 ? ' question' : ' questions') : '', ex ? ex + (ex === 1 ? ' exercise' : ' exercises') : ''].filter(Boolean).join(' and ');
  }
  function card(now = Date.now()) {
    const all = items(now), due = all.filter(item => item.ready);
    if (!all.length) return '';
    if (!due.length) return '<section class="review-card is-quiet" aria-label="Review"><p><strong>Review</strong> · Nothing due. ' + counted(all) + (all.length === 1 ? ' is' : ' are') + ' scheduled; the next returns ' + when(all.reduce((t,item) => Math.min(t,item.due), Infinity), now) + '. <a href="#review">See the schedule</a></p></section>';
    const missed = due.filter(item => !item.entry.correct).length, paths = new Set(due.map(item => item.path.id)).size;
    return '<section class="resume-card review-card" aria-labelledby="review-card-title"><div><p>Review</p><h2 id="review-card-title">' + counted(due) + ' to review</h2><small>' +
      (missed ? missed + ' missed · ' : '') + 'From ' + paths + (paths === 1 ? ' course' : ' courses') + '</small></div><a href="#review">Start review <span aria-hidden="true">→</span></a></section>';
  }
  // Items whose content has loaded: a question's quiz or an exercise's prompt.
  const ready = due => due.filter(item => item.exercise ? item.question.exercise : item.question.quiz).slice(0, LIMIT);
  const prose = (path, text) => typeof lessonText === 'function' ? lessonText(path, text) : esc(text);
  function exerciseItem(item, i) {
    const e = item.question.exercise, solution = typeof workedSolution === 'function' ? workedSolution(e) + (typeof exerciseExplanation === 'function' ? exerciseExplanation(e) : '') : '';
    return '<li class="review-item review-exercise" data-review-exercise="' + i + '"><p class="review-source"><a href="' + esc(item.question.href) + '">' + esc(item.path.title) + ' · ' + esc(item.question.title) + '</a> <span class="review-missed">' + (item.entry.rating === 'partly' ? 'Partly' : item.entry.rating === 'missed' ? 'Missed' : 'Due') + '</span></p>' +
      '<h2 id="review-question-' + i + '">' + prose(item.path, e.prompt) + '</h2><h3>Check your result</h3><ul>' + (e.checks || []).map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>' +
      attemptView(item.path, item.question.record, 'review-exercise-' + i, solution, item.entry.answer) + '</li>';
  }
  function view(now = Date.now()) {
    const due = dueItems(now), shown = ready(due);
    const upcoming = items(now).filter(item => !item.ready).sort((a,b) => a.due - b.due);
    const head = '<a class="back-link" href="#">← All learning paths</a><h1>Review</h1><p class="intro">What you missed comes first, then what is due again. Answer from memory before opening the lesson.</p>';
    // The schedule needs only catalog titles, so it never loads course content.
    const schedule = upcoming.length ? '<section class="review-schedule" aria-labelledby="review-schedule-title"><h2 id="review-schedule-title">Coming up</h2><ul>' + upcoming.slice(0, 20).map(item =>
      '<li><a href="' + esc(item.question.href) + '">' + esc(item.path.title) + ' · ' + esc(item.question.title) + '</a><span>Returns ' + when(item.due, now) + '</span></li>').join('') + '</ul>' +
      (upcoming.length > 20 ? '<p class="muted">And ' + (upcoming.length - 20) + ' more.</p>' : '') + '</section>' : '';
    if (!shown.length) return '<section class="review-page">' + head + '<p role="status">Nothing to review right now.' + (upcoming.length ? '' : ' Answer a lesson checkpoint to start your review list.') + '</p>' + schedule + '</section>';
    return '<section class="review-page">' + head + '<p class="muted">' + shown.length + ' of ' + due.length + ' due ' + (due.some(item => item.exercise) ? 'items' : 'questions') + ' shown.</p><ol class="review-list">' + shown.map((item, i) => item.exercise ? exerciseItem(item, i) :
      '<li class="quiz review-item" data-review="' + i + '"><p class="review-source"><a href="' + esc(item.question.href) + '">' + esc(item.path.title) + ' · ' + esc(item.question.title) + '</a>' + (item.entry.correct ? '' : ' <span class="review-missed">Missed</span>') + '</p>' +
      '<h2 id="review-question-' + i + '">' + esc(item.question.quiz.question) + '</h2><div role="group" aria-labelledby="review-question-' + i + '">' + choices(item.path, item.key, item.question).map(c => '<button class="option" type="button" data-review-choice="' + c.index + '">' + esc(c.text) + '</button>').join('') + '</div>' +
      '<p class="review-feedback" role="status"></p><p class="review-note muted"></p></li>').join('') + '</ol>' + schedule + '</section>';
  }
  function bind(main, now = () => Date.now()) {
    const shown = ready(dueItems(now()));
    shown.forEach((item, i) => { if (item.exercise) bindAttempt(main.querySelector('[data-review-exercise="' + i + '"]'), item.path, item.question.record, now); });
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
  return {key,exerciseKey,exerciseTarget,known,question,valid,validExercise,read,readExercises,saveAnswer,rate,exerciseNote,attemptView,bindAttempt,record,undo,note,showNote,dueAt,items,dueCourses,card,view,bind,INTERVALS,ANSWER};
})();
