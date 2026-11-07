/* The studio and the handbook read the lessons, glossary, sources and practice content from the shared course data
   (content/courses/financial-foundations.js, built from path.json and practice.json), which is loaded after this file. */
var FINANCE_COURSE,LABS,LAB_GUIDES,CASE_STEPS,EXERCISES,TRADE_JOURNEY,VISUAL_STORIES,PRACTICE_ROWS,PRACTICE_KEY;
var NotebookLoader={register(p){if(p.id!=='financial-foundations')return;FINANCE_COURSE=p;const x=p.practice;
 LABS=x.labs;LAB_GUIDES=x.labGuides;CASE_STEPS=x.caseSteps;EXERCISES=x.exercises;TRADE_JOURNEY=x.journey;VISUAL_STORIES=x.visualStories;PRACTICE_ROWS=x.population.rows;PRACTICE_KEY=x.population.key;}};
