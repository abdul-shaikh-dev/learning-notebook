# Installing and saving the notebook offline

Open **Offline & install** from the notebook header, or **Save course offline** beside a course. Installation is optional: offline reading also works in the browser. When installation is supported, use the install button or the browser menu; on iPhone/iPad use Safari's Share → Add to Home Screen.

Choose **Save offline** for the paths you want. A course becomes ready only after every listed lesson/runtime/practice asset has downloaded and passed its build-time SHA-256 check. The common notebook UI, diagram renderer, code highlighter, navigation metadata and search index are cached during service-worker installation. External sources, live APIs and workshop dependencies remain outside the offline bundle.

**Remove** clears a course download and keeps progress. Progress remains local to the browser/site and is portable through the existing JSON backup. Browsers can evict storage: check readiness before travelling. A repeated course save repairs missing common files and incomplete course caches.

## Updates

Each publication generates a new worker from `scripts/sw-template.js` and an explicit asset inventory in `scripts/pwa-build.cjs`. The worker waits rather than forcing an update into an open session. **Update notebook** activates it and reloads already controlled notebook tabs; closing all tabs also permits normal browser activation. Unchanged course downloads are retained by their individual content versions. Changed courses show **Update download**. Reading progress is never written or deleted by the PWA layer.

Downloads use a temporary course cache, then commit its registry pointer only after verification. Failed downloads discard the temporary cache and retain any previous complete download. Cache names include this site's scope; removal and activation do not touch other applications' caches. Requests to external sites are not intercepted. Practice download links fetch the response through the worker before creating a browser download, so unavailable files produce a visible message instead of a misleading file.

## Build and validation

- Run `node scripts/build-pages.cjs`; `sw.js` exists only in `_site`, beside `manifest.webmanifest`.
- Preview with `python -m http.server 8877 --bind 127.0.0.1 --directory _site`. Plain authoring-root previews still support reading, but are not the PWA build.
- Run `node verify.cjs`; `tests/pwa.cjs` covers verified installation, failed/partial saves, rollback, scope isolation, offline responses, explicit activation, per-course updates, shell eviction and deterministic inventory generation.
- Browser-tested: two complete courses saved; server stopped; React and Finance lessons plus diagrams opened; search worked; ZIP prepared offline; unsaved course recovery; removal preserved a read marker; update retained unchanged downloads; 390px controls had no overflow.
- Home-screen installation itself is browser/OS dependent and was not performed on a physical iOS/Android device. Direct file URLs do not support service-worker installation.

Platform references: [MDN installation requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [service workers and updates](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [browser storage eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
