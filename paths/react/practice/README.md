# React staged workshop

Use the React TypeScript practice project described in the course setup.
For the original beginner app, copy App.tsx into src/App.tsx.
For the reducer workshop, copy AdvancedApp.tsx to src/App.tsx and tracker-core.ts beside it.
Keep the generated main.tsx. Run npm run build to type-check and build.

The workshop supports add/toggle/remove/search, JSON export preparation and backup validation.
It stores changes in memory. It does not automatically save or import/replace work.
Persistence, API integration and routing are explicit advanced-project requirements.

Run domain checks with a Node version supporting TypeScript type stripping (verified with Node 24):
node --experimental-strip-types tracker-core.test.ts
Keep tracker-core.ts beside the test. The test imports its explicit .ts extension.
The UI imports the extensionless module for a standard bundler project.

Do not claim a production-ready release until the advanced rubric and failure-path tests pass.
