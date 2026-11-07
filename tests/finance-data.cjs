// Loads Financial foundations the way course.html and handbook.html do: the loader, then the built course data.
// Returns the lessons (FINANCE_COURSE) and the practice content from practice.json under the globals the studio uses.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const NAMES=['FINANCE_COURSE','LABS','LAB_GUIDES','CASE_STEPS','EXERCISES','TRADE_JOURNEY','VISUAL_STORIES','PRACTICE_ROWS','PRACTICE_KEY'];
function financeData(){const source=['paths/financial-foundations/runtime/course-data.js','content/courses/financial-foundations.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
 return vm.runInNewContext(source+';({'+NAMES.join(',')+'})');}
module.exports={financeData,NAMES};
