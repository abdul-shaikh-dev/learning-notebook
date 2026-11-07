/* The studio and the handbook read the lessons, glossary and sources from the shared course data
   (content/courses/financial-foundations.js, built from path.json), which is loaded after this file. */
var FINANCE_COURSE;
var NotebookLoader={register(p){if(p.id==='financial-foundations')FINANCE_COURSE=p;}};
