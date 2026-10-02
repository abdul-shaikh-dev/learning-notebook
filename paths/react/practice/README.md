# React staged workshop

Extract the complete kit into a new folder. With Node.js 24 and npm:

```powershell
npm ci
npm test
npm run build
npm run dev
```

index.html and main.tsx are downloadable source files for this local Vite project. Start npm run dev to run the workshop; the published notebook serves these files as learning resources and does not compile their TypeScript in the browser.

The package and lockfile pin React 19.3, TypeScript 5.9, Vite 8.3, Vitest 5.0, jsdom 26 and Testing Library. The repository check compiles, tests and builds these exact downloadable sources. For the smaller beginner app change the import in main.tsx from AdvancedApp to App.

AdvancedApp supports in-memory add/toggle/remove/search, JSON backup preparation and validation. The tracker and backup format share a 1,000-record limit; at capacity the title draft is preserved. Invalid titles expose aria-invalid and a linked alert, and focus returns to the input. Successful Enter submission clears the error. Selection changes preserve the title draft. No import silently replaces work.

RemoteLesson is a small URL-selected async screen, using local delayed demo data by default. Inject a Loader to control success, failure and ordering. Cleanup aborts the old request and ignores its callback even if the adapter ignores cancellation. pushState updates the component directly; a popstate listener handles Back/Forward. Query parameters preserve selection on remount and direct-link refresh. The root Vite URL avoids server path-rewrite requirements; deploying under a subpath requires matching Vite base configuration.

ui.test.tsx has five deterministic jsdom component tests: late A after B; direct-link remount and actual history Back/Forward; failure and retry; Enter validation with accessible error linkage/focus/draft preservation; and empty filters/invalid backup. Promises control A/B ordering without timing sleeps. Run npm test, then temporarily remove the cleanup guard and show that the A/B regression fails before restoring it. Domain tests separately check immutable reducer and decoder boundaries.

These tests simulate DOM/history and keyboard interactions; they are not a real-browser accessibility certification, server refresh check, or screen-reader test. Manually verify Tab order, Enter, checkbox Space, visible focus, error announcements, Back/Forward and direct-link refresh in a browser. Record browser/version and observations alongside executed component evidence.

Persistence, schema migration, real API validation/authorization, unsaved edit conflict resolution and release/rollback evidence remain advanced practice extensions. Changes remain in memory; copy the backup before refresh. The fake remote demo holds no secrets and establishes no server security. Do not claim a production-ready release from these scaffold tests alone.

## Graduated JavaScript and advanced bridges

Start with `node javascript-steps.js`. Predict each result, then change an assertion so it fails. Work through conversion/blank input, `filter`/`map`, immutable updates and a rejected promise before moving to React state.

Run `node --experimental-strip-types performance-runner.js` for a fixed 10,000-row filter. This separate synthetic array is not tracker data. `MAX_LESSONS = 1000` remains the validation contract. Repeat several runs in the same build/device, record result count and filter time, then use React Profiler in a separate UI interaction to measure rendering and input responsiveness; one console timing does not establish a user-visible gain.

The guided persistence milestone is `persistence-bridge.ts`: migrate a v1 backup into validated v2 local storage, reload it, and reject unsupported or malformed data. Its tests use an in-memory storage double. To wire it into the UI, initialize reducer state from `loadLocal` in a guarded initializer, save only validated committed rows in an effect, and add an explicit recovery message for parse or quota errors. Test refresh, invalid storage, full quota, and unsaved title drafts before relying on persistence in the UI. Local storage is per browser and is not a server backup.

The guided remote milestone is `http-loader.ts`. Replace the local `RemoteLesson` loader with `makeHttpLoader('/api')` only after a training endpoint returns `GET /api/lessons/:id` as `{id,title}`. Verify a 200, 404, malformed body, late response and abort. The adapter checks response shape and identity; a server must separately authorize every read/write and validate every mutation. Do not treat this client validation as authorization. The existing demo remains the offline route.

For the advanced project, show the connected UI and tests for migration/recovery and remote errors; document draft-conflict handling, API authorization tests, browser checks, release rollback and evidence limits. Real authentication and deployment remain optional external exercises, not demonstrated by these local files. Sources: [React Effects](https://react.dev/learn/synchronizing-with-effects), [React Profiler](https://react.dev/reference/react/Profiler), [MDN Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage).
