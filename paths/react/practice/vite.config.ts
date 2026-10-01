import {defineConfig} from "vitest/config";
export default defineConfig({test:{environment:"jsdom",include:["ui.test.tsx","advanced-bridge.test.ts","foundation-data.test.ts"]}});
