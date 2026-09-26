# GitHub Pages deployment

## What is ready

- `node verify.cjs` checks the teaching calculations and content.
- `node scripts/build-pages.cjs` builds `_site/` using a fixed public-file allowlist.
- The artifact contains the site, lessons and synthetic practice data. It excludes `.git`, workflow configuration, verification snapshots, tests and personal progress exports.
- Relative asset links and hash navigation support `https://abdul-shaikh-dev.github.io/learning-notebook/` and direct lesson links such as `#start/1` or `#lesson/1`.
- The site remains usable by opening the root `index.html` locally.

## Enable and publish after approving public site visibility

1. Confirm the GitHub plan supports Pages from this private repository. GitHub Pro (personal account) or an eligible organisation plan is required.
2. Repository Settings → Pages → Build and deployment → Source: GitHub Actions.
3. Actions → Verify and publish learning site → Run workflow on main → set publish to true.
4. Wait for both build and deploy to succeed. Use the deployment output URL from the run. The expected URL is not live until the deployment succeeds.
5. Open that HTTPS URL on your phone. The PC does not need to stay running.

The repository stays private. The learning site and its delivered HTML/JavaScript are public on ordinary personal-account Pages. Private Pages access control is limited to eligible enterprise organisation sites. Do not publish confidential employer material in this project.

Publishing is manual; a push runs validation/build only. To publish an update, run the workflow again with publish enabled. This prevents an ordinary source push from silently publishing a new version.

## Local project-path preview

Serve the directory containing the repository, then open `/ipv/`, or place the `_site` output under a `learning-notebook` subdirectory of a temporary web root. This checks that relative asset URLs work with a path prefix rather than only at `/`.

## Official references

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site

Prepared 26 September 2026. Actual hosting availability is determined by GitHub account entitlement and repository settings.

## Current publication status

On 26 September 2026, GitHub rejected Pages setup for this private repository with: "Your current plan does not support GitHub Pages for this repository." The site is not live. The repository was renamed to `learning-notebook` and remains private. An eligible plan or a separately approved public site repository is needed.

## Published site

The owner authorized making the existing repository public on 26 September 2026. Pages is now configured for GitHub Actions at https://abdul-shaikh-dev.github.io/learning-notebook/. The earlier private-plan restriction no longer applies. The homepage is the learning-path catalog. Publication remains an explicit workflow run with publish=true.
