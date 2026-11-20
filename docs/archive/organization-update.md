# Organisation update — 26 September 2026

The learning path now groups the course into five expandable modules with duration, completion, goals and practice links. Topic search and unfinished-only filtering help find the next lesson. Lessons have section shortcuts and links to other lessons in the same module. The handbook contents use the same module grouping.

Files are separated into content, assets, practice, tests and docs. index.html and handbook.html remain at the root. The existing progress key and lesson IDs are unchanged. Original verification and preview snapshots were moved unchanged into docs.

Verification:
- All 53 existing arithmetic, content and local-entry-link checks pass through node verify.cjs.
- Application JavaScript syntax passes.
- Curriculum Git blob hash matches the original exactly: 3f7b90220bd93858b150a7652a862dde52f12da5.
- Browser checks covered topic search, no-result state, unfinished-only filtering (17 after marking one complete), section shortcuts, module progress and the handbook's five groups and 20 article sections.
- Mobile layout checked at 390px, with no document-level horizontal overflow.
- Original calculations and regulatory text were not changed.

Changes are local working-tree edits; no commit or push was performed for this update.
