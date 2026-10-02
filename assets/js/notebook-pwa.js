/* Install and offline-library controls. Reading progress is deliberately owned by the notebook. */
(function () {
  'use strict';
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return;
  const script = document.currentScript;
  const root = new URL('../../', script && script.src ? script.src : new URL('assets/js/notebook-pwa.js', location.href));
  const manager = document.getElementById('pwa-course-list');
  const $ = id => document.getElementById(id);
  let registration, installPrompt, busy = false, knownStatus;
  const hadController = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
  let requestedUpdate = false, updateReloaded = false;
  function message(text, error) {
    const el = $('pwa-message');
    if (el) { el.textContent = text; el.className = error ? 'pwa-error' : ''; }
  }
  function connection() {
    const el = $('pwa-connection');
    if (el) { el.textContent = navigator.onLine ? 'Online · ready to save' : 'Offline · open a saved path'; el.classList.toggle('is-offline', !navigator.onLine); }
    if (knownStatus && !busy) render(knownStatus);
  }
  function installed() {
    return (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function installState(text) {
    const status = $('pwa-install-status'), button = $('pwa-install-button');
    if (status) status.textContent = text || (installed() ? 'Your notebook is running as an installed app.' : 'Installation is optional. Offline reading works in this browser too.');
    if (button) button.hidden = !installPrompt || installed();
    if ($('pwa-install-help')) $('pwa-install-help').hidden = installed();
  }
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; installState(); });
  window.addEventListener('appinstalled', () => { installPrompt = null; installState('Notebook installed. Open it from your home screen or app launcher.'); });
  if ($('pwa-install-button')) $('pwa-install-button').addEventListener('click', async () => {
    if (!installPrompt) return;
    const prompt = installPrompt; installPrompt = null; installState();
    try { await prompt.prompt(); const result = await prompt.userChoice; installState(result.outcome === 'accepted' ? 'Installation accepted. Your browser will finish installing the notebook.' : 'Installation cancelled. You can still use the notebook here.'); }
    catch (_) { installState('Installation is unavailable here. Try the browser menu instructions below.'); }
  });
  window.addEventListener('online', () => { connection(); if (registration) refresh(); });
  window.addEventListener('offline', connection);
  installState(); connection();
  function unavailable(text) {
    message(text, true);
    if (manager) manager.setAttribute('aria-busy', 'false');
    if ($('pwa-library-summary')) $('pwa-library-summary').textContent = 'Offline storage unavailable';
  }
  if (location.protocol === 'file:') { unavailable('Open the hosted notebook to save courses offline. Directly opened files do not support installation or offline storage.'); return; }
  if (!('serviceWorker' in navigator) || !window.isSecureContext) { unavailable('This browser does not support offline storage here. Use a modern browser on the HTTPS notebook site.'); return; }
  // Fetch within the controlled page before handing the file to the browser.
  // This keeps offline practice downloads on the same cache path as lesson assets.
  document.addEventListener('click', async event => {
    const link=event.target.closest?.('a[download]');
    if(!link || event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !navigator.serviceWorker.controller)return;
    const url=new URL(link.href,location.href);
    if(!url.href.startsWith(root.href)||!['paths/','practice/'].some(prefix=>url.pathname.slice(root.pathname.length).startsWith(prefix)))return;
    event.preventDefault();
    let status=document.getElementById('pwa-download-status');
    if(!status){status=document.createElement('p');status.id='pwa-download-status';status.setAttribute('role','status');link.after(status);}
    status.textContent='Preparing download…';
    try{
      const response=await fetch(url.href);if(!response.ok)throw Error('This file is not available offline. Save its course from Offline & install, then try again.');
      const blob=URL.createObjectURL(await response.blob()),download=document.createElement('a');
      const filename=link.getAttribute('download')||decodeURIComponent(url.pathname.split('/').pop());
      download.href=blob;download.download=filename;download.click();setTimeout(()=>URL.revokeObjectURL(blob),60000);
      status.textContent='Download ready: '+filename;
    }catch(error){status.textContent=error.message||'Download unavailable. Reconnect and try again.';}
  });
  function request(type, id, onProgress) {
    return new Promise((resolve, reject) => {
      const worker = registration && registration.active;
      if (!worker) { reject(new Error('Offline storage is still starting. Wait a moment, then refresh status.')); return; }
      const channel = new MessageChannel(); let timer;
      const finish = (error, data) => { clearTimeout(timer); channel.port1.close(); error ? reject(error) : resolve(data); };
      const reset = () => { clearTimeout(timer); timer = setTimeout(() => finish(new Error('The download stopped responding. Refresh status before trying again.')), 120000); };
      channel.port1.onmessage = event => {
        const result = event.data || {};
        if (result.progress) { reset(); if (onProgress) onProgress(result.progress); return; }
        finish(result.ok ? null : new Error(result.error || 'Offline storage could not complete this request.'), result.data);
      };
      reset(); worker.postMessage({type, id}, [channel.port2]);
    });
  }
  function size(bytes) { return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB'; }
  function element(tag, text, className) { const el = document.createElement(tag); if (text) el.textContent = text; if (className) el.className = className; return el; }
  function render(data) {
    knownStatus = data;
    if (!manager) return;
    const focus = document.activeElement, focusId = focus && focus.dataset.course, focusAction = focus && focus.dataset.action;
    manager.replaceChildren(); manager.setAttribute('aria-busy', 'false');
    const selectedCourse = new URL(location.href).searchParams.get('course');
    const courses = (data.courses || []).slice().sort((a, b) => Number(b.id === selectedCourse) - Number(a.id === selectedCourse)), saved = courses.filter(c => c.saved && !c.outdated);
    $('pwa-library-summary').textContent = saved.length + ' of ' + courses.length + ' paths ready offline' + (data.shellReady ? ' · notebook shell saved' : ' · notebook shell is still preparing');
    for (const course of courses) {
      const row = element('article', '', 'pwa-course-row'); row.id = 'offline-' + course.id;
      const info = element('div'); if (course.id === selectedCourse) info.append(element('p', 'Selected path', 'pwa-saved')); const heading = element('h3', course.title); info.append(heading);
      info.append(element('p', course.outdated ? 'Update needed · download again for this notebook version' : course.saved ? 'Saved on this device' : 'Not saved · ' + size(course.bytes || 0) + ' estimated download', course.outdated ? 'pwa-outdated' : course.saved ? 'pwa-saved' : ''));
      const actions = element('div', '', 'pwa-course-actions');
      const save = element('button', course.outdated ? 'Update download' : course.saved ? 'Download again' : 'Save offline', 'secondary');
      save.type = 'button'; save.dataset.course = course.id; save.dataset.action = 'save'; save.setAttribute('aria-label', save.textContent + ': ' + course.title); save.disabled = busy || !navigator.onLine;
      save.addEventListener('click', () => mutate('SAVE_COURSE', course, row)); actions.append(save);
      if (course.saved || course.outdated) {
        const remove = element('button', 'Remove', 'quiet'); remove.type = 'button'; remove.dataset.course = course.id; remove.dataset.action = 'remove'; remove.setAttribute('aria-label', 'Remove offline download: ' + course.title); remove.disabled = busy;
        remove.addEventListener('click', () => mutate('REMOVE_COURSE', course, row)); actions.append(remove);
      }
      const open = element('a', 'Open path →'); open.href = course.id === 'financial-foundations' ? new URL('course.html', root).href : new URL('index.html#path/' + encodeURIComponent(course.id), root).href;
      actions.append(open); row.append(info, actions); manager.append(row);
    }
    if (focusId) {
      const target = Array.from(manager.querySelectorAll('button')).find(b => b.dataset.course === focusId && b.dataset.action === focusAction) || Array.from(manager.querySelectorAll('button')).find(b => b.dataset.course === focusId);
      if (target) target.focus({preventScroll:true});
    }
    if ($('pwa-refresh')) $('pwa-refresh').disabled = busy;
  }
  async function mutate(type, course) {
    if (busy) return;
    const restoreFocus = () => { const target = Array.from(manager.querySelectorAll('button')).find(button => button.dataset.course === course.id && !button.disabled); if (target) target.focus({preventScroll:true}); };
    busy = true; render(knownStatus);
    const row = $('offline-' + course.id), progress = element('progress'); progress.max = 1; progress.value = 0; progress.setAttribute('aria-label', 'Saving ' + course.title);
    if (type === 'SAVE_COURSE') row.append(progress);
    message(type === 'SAVE_COURSE' ? 'Saving ' + course.title + '… Keep this page open until it finishes.' : 'Removing ' + course.title + ' download…');
    try {
      const data = await request(type, course.id, state => { progress.max = state.total || 1; progress.value = state.done || 0; progress.setAttribute('aria-valuetext', state.done + ' of ' + state.total + ' files'); });
      busy = false; render(data); restoreFocus(); message(type === 'SAVE_COURSE' ? course.title + ' is ready offline.' : course.title + ' download removed. Your reading progress is unchanged.');
    } catch (error) { busy = false; render(knownStatus); restoreFocus(); message(error.message + ' Check your connection and available storage, then refresh status.', true); }
  }
  async function refresh() {
    if (busy || !manager) return;
    try { render(await request('STATUS')); message(''); }
    catch (error) { unavailable(error.message); if ($('pwa-refresh')) $('pwa-refresh').disabled = false; }
  }
  if ($('pwa-refresh')) $('pwa-refresh').addEventListener('click', refresh);
  function updateNotice() {
    if (!registration.waiting || !registration.active || registration.active === registration.waiting || registration.active.state !== 'activated' || $('pwa-update-notice')) return;
    const notice = element('section', '', 'pwa-notice'); notice.id = 'pwa-update-notice'; notice.setAttribute('aria-label', 'Notebook update'); notice.setAttribute('role', 'status');
    notice.append(element('strong', 'A notebook update is ready'));
    notice.append(element('p', 'Apply the update and reload notebook tabs. Saved progress stays. Refresh offline course downloads afterward.'));
    const actions = element('div', '', 'pwa-notice-actions'), apply = element('button', 'Update notebook', 'primary'), later = element('button', 'Later', 'quiet'); apply.type = later.type = 'button';
    apply.addEventListener('click', () => { if (!registration.waiting) return; if (busy) { message('Let the current download finish before updating.', true); return; } requestedUpdate = true; apply.disabled = true; apply.textContent = 'Updating…'; registration.waiting.postMessage({type:'ACTIVATE_UPDATE'}); });
    later.addEventListener('click', () => notice.remove()); actions.append(apply, later); notice.append(actions); document.body.append(notice);
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => { if ((requestedUpdate || hadController) && !updateReloaded) { updateReloaded = true; location.reload(); } });
  navigator.serviceWorker.register(new URL('sw.js', root).href, {scope:root.href, updateViaCache:'none'}).then(async reg => {
    registration = reg; updateNotice();
    const watch = worker => { if (!worker) return; if (worker.state === 'installed') updateNotice(); else worker.addEventListener('statechange', () => { if (worker.state === 'installed') updateNotice(); }); };
    reg.addEventListener('updatefound', () => watch(reg.installing)); watch(reg.installing);
    await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Offline setup timed out.')), 45000))]); await refresh();
  }).catch(error => unavailable('Offline setup could not finish. Reconnect and reload this page. ' + error.message));
})();



