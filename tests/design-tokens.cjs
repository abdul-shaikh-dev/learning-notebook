// Colours, type sizes and type families are defined once, in assets/css/tokens.css.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sheets=[...fs.readdirSync('assets/css').map(f=>'assets/css/'+f),...fs.readdirSync('paths/financial-foundations/styles').map(f=>'paths/financial-foundations/styles/'+f)].filter(f=>f.endsWith('.css')&&!f.endsWith('/tokens.css'));
const tokens=fs.readFileSync('assets/css/tokens.css','utf8');
// Custom properties may also be set by other sheets or inline by scripts (positions, counts).
const everything=[tokens,...sheets.map(f=>fs.readFileSync(f,'utf8')),...fs.readdirSync('assets/js').map(f=>fs.readFileSync('assets/js/'+f,'utf8')),...fs.readdirSync('paths/financial-foundations/runtime').filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync('paths/financial-foundations/runtime/'+f,'utf8'))].join('\n');
const defined=new Set([...everything.matchAll(/(--[a-z0-9-]+)['"]?\s*[:,]/g)].map(m=>m[1]));
const own=new Set([...tokens.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m=>m[1]));
const colour=/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|(?<![-\w])(white|black)(?![-\w])/;
const problems=[];
for(const file of sheets){
 const css=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 for(const m of css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/g)){
  const [,prop,value]=m;
  if(/^(content|grid-template-areas|font-feature-settings|quotes)$/.test(prop))continue;
  if(colour.test(value))problems.push(file+': hard-coded colour in '+prop+': '+value.trim().slice(0,60));
  if(prop==='font-size'||prop==='font'){
   const sizes=value.replace(/var\([^)]*\)/g,'').match(/\b\d*\.?\d+(px|rem)\b/g);
   if(sizes&&!(prop==='font'&&/^\s*inherit/.test(value)))problems.push(file+': font size outside the type scale in '+prop+': '+value.trim().slice(0,60));
  }
  if(prop==='font-family'||prop==='font'){
   if(/Georgia|Consolas|Segoe|system-ui|monospace|sans-serif|serif\b/.test(value.replace(/var\([^)]*\)/g,'')))problems.push(file+': font family outside the tokens in '+prop+': '+value.trim().slice(0,60));
  }
 }
 for(const m of css.matchAll(/[{;]\s*(--[a-z0-9-]+)\s*:/g))if(own.has(m[1]))problems.push(file+': redefines token '+m[1]);
 for(const m of css.matchAll(/var\((--[a-z0-9-]+)\s*\)/g))if(!defined.has(m[1]))problems.push(file+': unknown custom property '+m[1]);
}
assert.deepEqual(problems,[],'\n'+problems.slice(0,30).join('\n'));
// Every colour role has a dark value.
const light=tokens.slice(tokens.indexOf(':root{'),tokens.indexOf('html[data-theme=dark]{')),dark=tokens.slice(tokens.indexOf('html[data-theme=dark]{'));
for(const role of ['page','surface','sunken','raised','text','muted','line','control','brand','on-brand','highlight','on-highlight','link','focus','code-bg','code-header','green-bg','green-line','green-text','blue-bg','blue-text','amber-bg','amber-text','red-bg','red-text','purple-bg','purple-text','syntax-keyword','syntax-string','syntax-comment'])
 {assert.match(light,new RegExp('--'+role+':'),'light value for '+role);assert.match(dark,new RegExp('--'+role+':'),'dark value for '+role);}
// Every page loads the tokens before any other stylesheet.
for(const page of ['index.html','course.html','offline.html','handbook.html']){
 const links=[...fs.readFileSync(page,'utf8').matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
 assert.match(links[0]||'',/^assets\/css\/tokens\.css/,page+' loads tokens.css first');
}
console.log('PASS: no hard-coded colours, sizes or font families outside tokens.css in '+sheets.length+' stylesheets; every colour role has a dark value; every page loads the tokens first.');
