/* Concrete learning scenes use the same authored snapshots as the text explanations. */
(function(root){
 'use strict';
 const renderers=new Map();
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 root.NotebookScenes={escape,register(key,render){if(renderers.has(key))throw Error('Duplicate scene: '+key);renderers.set(key,render);},keys:()=>[...renderers.keys()],render(key,step,meta={}){const render=renderers.get(key);return render?`<div class="concrete-scene" data-scene="${escape(key)}">${render(step,meta)}</div>`:'';}};
})(globalThis);
