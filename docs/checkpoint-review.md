# Checkpoint review

Each lesson's "Check your understanding" question saves the learner's first answer on that page view. Later clicks still show the explanation but do not change the record. After a save, an "Undo: I chose by mistake" button restores the previous record (or removes a first answer), and the next choice is saved instead. Outcomes are stored per course in `learning-notebook:path:<id>:checkpoints:v1` as `{lessonId: {correct, streak, at}}`, where `at` is a millisecond timestamp.

The schedule is deliberately small:

- A missed answer is due at once and stays due until it is answered correctly.
- Correct answers return after 1, 3 and then 7 days. A correct answer given after the 7-day gap retires the question.
- A correct answer before the due date, or after retirement, keeps the current schedule. Any miss restarts it.

The home page shows a Review card once any checkpoint has been answered: a count of due questions, or a one-line note of how many are scheduled and when the next returns, linking to the schedule. `#review` lists up to ten due questions, missed first, then oldest due. It loads only the course chunks those questions need. Below them, "Coming up" lists up to 20 scheduled questions, soonest first, from catalog titles alone. Answers given there follow the same rules and link back to the lesson.

Backups include a course's `checkpoints` only when it has saved answers, so older backups and older notebook versions keep working. On import the more recent answer for each lesson wins, with this browser winning a tie. Invalid entries reject the whole file before anything is written.

Code: `assets/js/notebook-review.js`. Tests: `tests/notebook-review.cjs`, the checkpoint cases in `tests/notebook-backup.cjs`, and the lesson-page check in `tests/programming-paths.cjs`.
