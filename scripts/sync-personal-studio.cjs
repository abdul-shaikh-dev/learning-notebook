// One maintained studio, generated portable copies for independently downloadable courses.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const modes={'time-attention-energy':'week','task-project-management':'tasks','habits-behaviour-change':'habit','learning-how-to-learn':'learn','self-awareness-communication':'talk','weekly-planning-journey':'week'};
function sync(check=false){for(const [id,mode] of Object.entries(modes))for(const name of ['lab.html','lab.js','lab.css','lab-model.js']){let source=fs.readFileSync(path.join(root,'practice/personal-effectiveness-studio',name),'utf8').replace(/\r\n/g,'\n');if(name==='lab.html')source=source.replace('data-start="week"',`data-start="${mode}"`);const target=path.join(root,'paths',id,'practice',name);if(check){if(fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n')!==source)throw Error('Studio copy stale: '+id+'/'+name);}else fs.writeFileSync(target,source);}return true;}
if(require.main===module){sync(process.argv.includes('--check'));console.log('Personal studio copies match the maintained source.');}
module.exports={sync};
