// Page scripts share assets/js/escape-text.js (#156), which every page loads first. Tests that run page scripts in
// their own vm contexts require this file: each new context gets the same helper, unless the test supplies its own.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/escape-text.js'),'utf8');
if(!vm.createContext.escapeShared){
 const create=vm.createContext.bind(vm),runNew=vm.runInNewContext.bind(vm);
 vm.createContext=(sandbox={},...rest)=>{const ctx=create(sandbox,...rest);if(!('escapeText' in ctx))vm.runInContext(source,ctx);return ctx;};
 vm.createContext.escapeShared=true;
 vm.runInNewContext=(code,sandbox={},...rest)=>vm.runInContext(code,vm.isContext(sandbox)?sandbox:vm.createContext(sandbox),...rest);
}
module.exports=source;
