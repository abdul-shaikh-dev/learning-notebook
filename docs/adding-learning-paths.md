# Adding a learning path

The root index is a subject-independent catalog. The existing finance course lives at course.html with its labs and unchanged progress key. Old root hash bookmarks redirect there.

Add an entry to content/paths.js. Use a unique, stable lowercase hyphenated id. A planned entry has status planned and no working link. To publish a standard course, set status ready, omit href, and give lessons an array using the shape below. The shared catalog reader provides lesson navigation, checkpoints and completion saved separately by path ID. Text is escaped; HTML is not accepted in lesson strings.

```js
{id:'example-topic',title:'Example topic',category:'Technology',status:'ready',
 description:'What you will learn',level:'Beginner',lessons:[
 {id:'first-steps',title:'First steps',takeaway:'One key idea',
 sections:[{title:'The idea',paragraphs:['Explain the concept.'],example:'Optional worked example'}],
 quiz:{question:'A useful question?',options:['A','B','C'],correct:0,explanation:'Why A is correct.'}}
]}
```

A specialized interactive course can instead set href to its own relative HTML entry point. Add its files explicitly to scripts/build-pages.cjs. Keep its storage key unique. Never rename published path or lesson IDs without a migration.

Run node verify.cjs and node scripts/build-pages.cjs. Preview at the project subpath, check lessons and phone layout, then publish using the GitHub Actions workflow with publish enabled. Planned AI paths contain no teaching content yet. Generic courses currently save completion locally; the finance course also offers backup/import.
