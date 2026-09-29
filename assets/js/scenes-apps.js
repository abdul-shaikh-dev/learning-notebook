(function () {
  'use strict';
  var api = window.NotebookScenes;
  if (!api || typeof api.register !== 'function') return;

  function esc(value) { return api.escape(String(value == null ? '' : value)); }
  function node(step, id) { return (step.nodes || []).find(function (item) { return item.id === id; }) || { id:id, label:id, detail:'', tone:'neutral' }; }
  function tone(item) { return ' is-' + (/^(active|success|warning)$/.test(item.tone) ? item.tone : 'neutral'); }
  function motion(key, item) { return ' data-motion-node="apps-' + esc(key + '-' + item.id) + '"'; }
  function detail(item) { return '<span class="scene-apps-detail">' + esc(item.detail) + '</span>'; }
  function next(label) { return '<button type="button" class="scene-apps-next" data-scene-next>' + esc(label || 'Continue') + '<span aria-hidden="true"> →</span></button>'; }
  function shell(kind, caption, body, action) { return '<div class="scene-apps scene-apps-' + kind + '"><div class="scene-apps-caption">' + esc(caption) + '</div>' + body + (action || '') + '</div>'; }
  function chip(text, cls) { return '<span class="scene-apps-chip ' + (cls || '') + '">' + esc(text) + '</span>'; }

  api.register('components', function (step, meta) {
    var app=node(step,'app'), types=node(step,'types'), state=node(step,'state');
    var callback=meta.scenario && meta.scenario.id === 'callback', i=meta.index;
    var firstTitle=callback ? 'Types' : (i === 2 ? 'Data types' : 'Types');
    var done=callback && i === 2;
    var records=callback ? '<span>types.done: <b>' + (done ? 'true' : 'false') + '</b></span>' : '<span>types.title: <b>' + esc(i === 0 ? 'Types' : 'Data types') + '</b></span>';
    var appBody='<div class="scene-apps-source'+tone(app)+'"'+motion('components',app)+'><span class="scene-apps-eyebrow">Parent state · App</span><div class="scene-apps-records">' + records + '<span>state.title: <b>State</b></span></div>' + detail(app) + '</div>';
    var rows=[{item:types,title:firstTitle,key:'types',done:done},{item:state,title:'State',key:'state',done:false}].map(function (row) {
      var control='';
      if (callback && row.key==='types' && i===0) control='<button type="button" class="scene-apps-row-action" data-scene-next aria-label="Complete '+esc(row.title)+'">Complete</button>';
      else if (callback) control='<span class="scene-apps-row-status">'+(row.done?'✓ Done':row.key==='types'&&i===1?'Callback invoked':'Not done')+'</span>';
      return '<li class="scene-apps-lesson-row'+tone(row.item)+'"'+motion('components',row.item)+'><span class="scene-apps-row-icon" aria-hidden="true">'+(row.done?'✓':row.key==='types'?'T':'S')+'</span><span class="scene-apps-row-main"><strong>'+esc(row.title)+'</strong><small>key: '+esc(row.key)+'</small></span>'+control+detail(row.item)+'</li>';
    }).join('');
    var transfer='<div class="scene-apps-transfer" aria-hidden="true"><span>props ↓</span><span>'+(callback && i===1 ? 'onComplete ↑' : 'render ↓')+'</span></div>';
    return shell('components',callback?'Lesson completion':'Lesson list',appBody+transfer+'<div class="scene-apps-device"><div class="scene-apps-device-head"><span class="scene-apps-dots" aria-hidden="true">● ● ●</span><strong>Lessons</strong></div><ul class="scene-apps-lesson-list">'+rows+'</ul></div>',i===1 && !callback ? next('Render updated title') : i===1 && callback ? next('Render completed row') : '');
  });

  api.register('state', function (step, meta) {
    var snap=node(step,'snapshot'), handler=node(step,'handler'), queue=node(step,'queue'), screen=node(step,'screen');
    var replacement=meta.scenario && meta.scenario.id==='replace', i=meta.index;
    var shown=i===2?(replacement?'1':'3'):'0';
    var updates=i!==1?[]:replacement?['replace 1','replace 1','replace 1']:['0 → 1','1 → 2','2 → 3'];
    var queueHtml=updates.length?updates.map(function (v,j) { return '<span class="scene-apps-update" data-motion-node="apps-state-update-'+j+'">'+esc(v)+'</span>'; }).join(''):'<span class="scene-apps-empty">Empty</span>';
    var body='<div class="scene-apps-counter"'+motion('state',screen)+'><span class="scene-apps-eyebrow">Rendered screen</span><div class="scene-apps-count">Count: <strong>'+shown+'</strong></div><button type="button"'+(i===0?' data-scene-next':' disabled')+' aria-label="Run the three updates">+1 × 3</button>'+detail(screen)+'</div><div class="scene-apps-state-flow"><div class="scene-apps-snapshot'+tone(snap)+'"'+motion('state',snap)+'><span class="scene-apps-eyebrow">Handler’s render snapshot</span><strong>count = '+(i===2?shown:'0')+'</strong>'+detail(snap)+'</div><div class="scene-apps-handler'+tone(handler)+'"'+motion('state',handler)+'><span class="scene-apps-eyebrow">Click handler</span><code>'+esc(replacement?'setCount(count + 1)':'setCount(c => c + 1)')+'</code><span>'+esc(i===0?'Ready for click':i===1?'Called three times':'Three calls in prior click')+'</span>'+detail(handler)+'</div><div class="scene-apps-queue'+tone(queue)+'"'+motion('state',queue)+'><span class="scene-apps-eyebrow">Pending updates</span><div class="scene-apps-updates">'+queueHtml+'</div>'+detail(queue)+'</div></div>';
    return shell('state',replacement?'Replacement updates':'Updater functions',body,i===1?next('Process updates'):'');
  });

  api.register('effects', function (step, meta) {
    var selection=node(step,'selection'), effect=node(step,'effect'), a=node(step,'roomA'), b=node(step,'roomB');
    var missing=meta.scenario && meta.scenario.id==='missing', i=meta.index;
    var room= i===0?'A':i===1?'B':missing?'Unmounted':'B → unmounted';
    function connection(item, letter, live) { return '<div class="scene-apps-room'+tone(item)+(live?' is-live':'')+'"'+motion('effects',item)+'><span class="scene-apps-port" aria-hidden="true">◉</span><strong>Room '+letter+'</strong><span class="scene-apps-wire" aria-hidden="true"></span><span class="scene-apps-socket" aria-hidden="true">⌁</span>'+detail(item)+'</div>'; }
    var aLive=missing || i===0, bLive=missing && i>0 || !missing && i===2 && false;
    var body='<div class="scene-apps-effect-head"><div class="scene-apps-selector'+tone(selection)+'"'+motion('effects',selection)+'><span class="scene-apps-eyebrow">Selected room</span><strong>'+esc(room)+'</strong>'+detail(selection)+'</div><div class="scene-apps-effect-code'+tone(effect)+'"'+motion('effects',effect)+'><span class="scene-apps-eyebrow">Effect [roomId]</span><span class="scene-apps-effect-symbol" aria-hidden="true">'+(missing?'↗':'↗ ↙')+'</span>'+detail(effect)+'</div></div><div class="scene-apps-rooms">'+connection(a,'A',aLive)+connection(b,'B',bLive)+'</div>';
    return shell('effects',missing?'Connection without cleanup':'Connection lifecycle',body,i<2?next(i===0?'Change room':'Unmount component'):'');
  });

  api.register('race-safe-loading', function (step, meta) {
    var selection=node(step,'selection'), a=node(step,'reqA'), b=node(step,'reqB'), screen=node(step,'screen');
    var guarded=meta.scenario && meta.scenario.id==='guarded', i=meta.index, heading=i===0?'A':'B', data=i===0?'Loading…':i===2&&!guarded?'Data A':'Data B';
    function ticket(item, letter) { var d=item.detail.toLowerCase(); return '<div class="scene-apps-ticket'+tone(item)+'"'+motion('race',item)+'><span class="scene-apps-ticket-id">REQ '+letter+'</span><span class="scene-apps-ticket-state">'+esc(/not started/.test(d)?'Not started':/pending/.test(d)?'Pending':/abort requested/.test(d)?'Abort requested':/commit skipped/.test(d)?'Commit skipped':'Resolved')+'</span>'+detail(item)+'</div>'; }
    var body='<div class="scene-apps-loading-top"><div class="scene-apps-selector'+tone(selection)+'"'+motion('race',selection)+'><span class="scene-apps-eyebrow">Selection</span><strong>'+heading+'</strong>'+detail(selection)+'</div><div class="scene-apps-request-line">'+ticket(a,'A')+ticket(b,'B')+'</div></div><div class="scene-apps-result'+tone(screen)+'"'+motion('race',screen)+'><div class="scene-apps-device-head"><span class="scene-apps-dots" aria-hidden="true">● ● ●</span><strong>Screen</strong></div><h4>Heading '+heading+'</h4><div class="scene-apps-result-data '+(i===0?'is-loading':'')+'">'+esc(data)+'</div>'+detail(screen)+'</div>';
    return shell('race',guarded?'Guarded request':'Unguarded request',body,i<2?next(i===0?'Select B':'Resolve A late'):'');
  });

  api.register('objects', function (step, meta) {
    var first=node(step,'first'), second=node(step,'second'), one=node(step,'one'), two=node(step,'two');
    var copy=meta.scenario && meta.scenario.id==='copy', i=meta.index;
    function variable(item,label,target) { return '<div class="scene-apps-variable'+tone(item)+'"'+motion('objects',item)+'><span class="scene-apps-eyebrow">Variable</span><code>'+label+'</code><span class="scene-apps-pointer">'+(target?'→ #'+target:'—')+'</span>'+detail(item)+'</div>'; }
    function object(item,num,visible,done) { return '<div class="scene-apps-object'+tone(item)+(visible?'':' is-unbuilt')+'"'+motion('objects',item)+'><span class="scene-apps-object-id">Heap · TaskItem #'+num+'</span><div><strong>Title</strong><span>'+esc(visible?'Read':'Not constructed')+'</span></div><div><strong>Done</strong><span>'+esc(visible?done?'true':'false':'—')+'</span></div>'+detail(item)+'</div>'; }
    var body='<div class="scene-apps-memory"><div class="scene-apps-stack"><span class="scene-apps-eyebrow">References</span>'+variable(first,'first',1)+variable(second,'second',i===0?null:copy?2:1)+'</div><div class="scene-apps-heap"><span class="scene-apps-eyebrow">Objects</span>'+object(one,1,true,!copy&&i===2)+(copy?object(two,2,i>0,i===2):'')+'</div></div>';
    return shell('objects',copy?'Independent copy':'Shared reference',body,i<2?next(i===0?copy?'Copy selected data':'Assign second = first':'Call Complete()'):'');
  });

  api.register('api-di', function (step, meta) {
    var request=node(step,'request'), singleton=node(step,'singleton'), scoped=node(step,'scoped'), transient=node(step,'transient');
    var across=meta.scenario && meta.scenario.id==='across', i=meta.index;
    var label=across&&i===2?'Request B':'Request A';
    function service(item,kind,icon) { var instance=(item.detail.match(/\b[SCT][12]\b/)||[])[0]; var identity=instance||'unresolved-'+item.id; return '<div class="scene-apps-service'+tone(item)+'" data-motion-node="apps-di-'+esc(identity)+'"><span class="scene-apps-service-icon" aria-hidden="true">'+icon+'</span><div><strong>'+kind+'</strong>'+detail(item)+'</div></div>'; }
    var body='<div class="scene-apps-di"><div class="scene-apps-request'+tone(request)+'" data-motion-node="apps-di-request-'+esc(label.slice(-1))+'"><span class="scene-apps-eyebrow">HTTP request scope</span><strong>'+label+'</strong>'+detail(request)+'</div><div class="scene-apps-service-lanes">'+service(singleton,'Singleton','∞')+service(scoped,'Scoped','▣')+service(transient,'Transient','✦')+'</div></div>';
    return shell('di',across?'Across requests':'Within one request',body,i<2?next(across?i===0?'End request A':'Resolve request B':i===0?'Resolve services':'Resolve again'):'');
  });

  api.register('async', function (step, meta) {
    var caller=node(step,'caller'), method=node(step,'method'), wait=node(step,'wait'), token=node(step,'token');
    var passed=meta.scenario && meta.scenario.id==='passed', i=meta.index;
    function stage(item,symbol) { return '<div class="scene-apps-async-stage'+tone(item)+'"'+motion('async',item)+'><span class="scene-apps-async-symbol" aria-hidden="true">'+symbol+'</span><strong>'+esc(item.label)+'</strong>'+detail(item)+'</div>'; }
    var body='<div class="scene-apps-async-chain">'+stage(caller,'↳')+'<span class="scene-apps-chain-arrow" aria-hidden="true">→</span>'+stage(method,'{ }')+'<span class="scene-apps-chain-arrow" aria-hidden="true">→</span>'+stage(wait,'◷')+'</div><div class="scene-apps-token'+tone(token)+'"'+motion('async',token)+'><span class="scene-apps-token-icon" aria-hidden="true">◉</span><strong>Token source</strong>'+detail(token)+'<span class="scene-apps-token-path">'+(passed?'token supplied to Task.Delay':'token omitted from Task.Delay')+'</span></div>';
    return shell('async',passed?'Token observed by delay':'Token omitted from delay',body,i<2?next(i===0?'Request cancellation':passed?'Observe cancellation':'Finish delay'):'');
  });

  api.register('auth-boundaries', function (step, meta) {
    var identity=node(step,'identity'), policy=node(step,'policy'), owner=node(step,'owner'), response=node(step,'response');
    var other=meta.scenario && meta.scenario.id==='other-owner', i=meta.index, subject=other?'B':'A';
    function gate(item,icon,heading,body) { return '<div class="scene-apps-gate'+tone(item)+'"'+motion('auth',item)+'><span class="scene-apps-gate-icon" aria-hidden="true">'+icon+'</span><div><span class="scene-apps-eyebrow">'+heading+'</span><strong>'+body+'</strong>'+detail(item)+'</div></div>'; }
    var body='<div class="scene-apps-credential"><span class="scene-apps-eyebrow">Bearer identity</span><div class="scene-apps-avatar" aria-hidden="true">'+subject+'</div><strong>Subject '+subject+'</strong><span>tasks.write</span></div><div class="scene-apps-gates">'+gate(identity,'✓','1 · Authentication','Token validated')+gate(policy,i===0?'◯':'✓','2 · Write policy',i===0?'Awaiting check':'tasks.write')+gate(owner,i===2?(other?'×':'✓'):'◯','3 · Resource owner','Task 7 · Owner A')+'</div><div class="scene-apps-auth-response'+tone(response)+'"'+motion('auth',response)+'><span class="scene-apps-eyebrow">HTTP response</span><strong>'+esc(i===2?other?'404':'200':'Pending')+'</strong>'+detail(response)+'</div>';
    return shell('auth',other?'Other owner attempts write':'Owner writes task 7',body,i<2?next(i===0?'Check write policy':'Check owner'):'');
  });
}());
