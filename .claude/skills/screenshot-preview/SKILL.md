---
name: screenshot-preview
description: Run the Astro dev server and capture screenshots of pages/components in this cloud environment. Use whenever you need a visual preview of UI changes (themes, layout, components) to show the user, or to verify a frontend change renders correctly. Handles the gotcha that Playwright's browser CDN is blocked here — Chrome must be fetched from storage.googleapis.com instead.
---

# Screenshot previews for the Astro blog

This project has no built-in browser. The cloud environment's network policy
**blocks Playwright's browser CDNs** (`cdn.playwright.dev`,
`playwright.download.prss.microsoft.com`, `playwright.azureedge.net` all return
`403 Host not in allowlist`). It also has **no system Chromium** and the Ubuntu
`chromium` package is a snap stub that won't run headless.

What *is* reachable: `storage.googleapis.com` and `github.com`. Chrome for
Testing binaries live on `storage.googleapis.com`, so download
`chrome-headless-shell` from there and point Playwright at it via
`executablePath`.

## One-time setup per container

```bash
# 1. Project deps
pnpm install --frozen-lockfile

# 2. Playwright (the npm lib only — NOT its browsers, which are blocked)
npm install -g playwright   # installs to /opt/node22/lib/node_modules

# 3. Chrome for Testing headless shell (~110MB) from the allowlisted host
cd /tmp
curl -s --max-time 120 -o chs.zip \
  "https://storage.googleapis.com/chrome-for-testing-public/131.0.6778.204/linux64/chrome-headless-shell-linux64.zip"
unzip -q chs.zip
/tmp/chrome-headless-shell-linux64/chrome-headless-shell --version   # sanity check
```

Notes:
- The global playwright is CommonJS, so import it as a default export from its
  absolute path in an ESM script (see below).
- `131.0.6778.204` is a known-good pinned version. Any recent Chrome for Testing
  build under `chrome-for-testing-public/<version>/linux64/` works.

## Start the dev server

```bash
(pnpm dev --port 4321 > /tmp/astro-dev.log 2>&1 &)
# wait until it answers
for i in $(seq 1 20); do curl -sf http://localhost:4321/ -o /dev/null && { echo UP; break; }; sleep 1; done
```

Stop it when done with `pkill -f "astro dev"`.

## Capture screenshots

Write a script (e.g. `/tmp/shot.mjs`) and run it with `node /tmp/shot.mjs`:

```js
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;

const browser = await chromium.launch({
  executablePath: '/tmp/chrome-headless-shell-linux64/chrome-headless-shell',
});
const page = await browser.newPage({
  viewport: { width: 1100, height: 900 },
  deviceScaleFactor: 2, // crisp output
});
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

// Full page
await page.screenshot({ path: '/tmp/preview.png' });

// A single component
const nav = await page.$('nav.nav');
await nav.screenshot({ path: '/tmp/nav.png' });

await browser.close();
```

Then surface the PNGs to the user with the `SendUserFile` tool.

## Gotcha: Font Awesome glyphs are blank in screenshots

The layout loads Font Awesome from `cdnjs.cloudflare.com`, which is blocked
here, so `<i class="fa-...">` icons (hero social links, the theme toggle, etc.)
render as empty boxes/circles in screenshots — **this is a sandbox artifact, not
a bug**; they render fine on the deployed site. When the icon matters for the
preview, inject the equivalent inline `<svg>` into the element via
`page.evaluate(...)` before screenshotting, and tell the user you did so.

## Toggling client state (e.g. theme)

State driven by `localStorage` / `data-*` attributes can be set directly:

```js
await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, 'light');
await page.waitForTimeout(300); // let CSS transitions settle
```
