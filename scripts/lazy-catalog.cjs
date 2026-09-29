const {readPaths}=require('./manifest.cjs');
const {createHash}=require('node:crypto');
function lazyFiles(){
 const files={},summaries=[];
 for(const {publicFiles,...p} of readPaths()){
  if(p.status!=='ready'){const {id,title,category,status,description,level}=p;summaries.push({id,title,category,status,description,level,lessons:[]});continue;}
  const source='NotebookLoader.register('+JSON.stringify(p)+');\n';
  const revision=createHash('sha256').update(source).digest('hex').slice(0,12);
  const file='content/courses/'+p.id+'.js';files[file]=source;
  const {id,title,category,status,description,level,href}=p;
  summaries.push({id,title,category,status,description,level,href,lessons:Array.isArray(p.lessons)?p.lessons.map(({id,title,stage})=>({id,title,stage})):p.lessons,stages:p.stages?.map(({id})=>({id})),dataFile:file+'?v='+revision});
 }
 const search=require('./search-index.cjs').searchSource();
 const version=createHash('sha256').update(search).digest('hex').slice(0,12);
 files['content/catalog.js']='// Generated lightweight navigation metadata.\nconst LEARNING_PATHS = '+JSON.stringify(summaries)+';\nconst NOTEBOOK_SEARCH_FILE = '+JSON.stringify('content/search.js?v='+version)+';\n';
 return files;
}
module.exports={lazyFiles};
