# Fixed: Clipped Dropdown — Modern UI

This repository contains a beautiful, modern redesign of the original reproduction that fixes the "clipped dropdown" bug by rendering the dropdown as a floating element attached to the document root (a portal). This ensures the menu cannot be clipped by ancestor containers that use `overflow: hidden`.

Files added as part of the fix:

- `index_fixed.html` — Fully redesigned UI built with Tailwind CSS (CDN). Uses a portal pattern to render the dropdown into the document root (position: fixed), preventing clipping even when the parent card has `overflow: hidden`.
- `verify_fixed.js` — Automated Puppeteer test which opens the page, triggers the dropdown, and verifies the dropdown is mounted in the `body`, positioned `fixed`, and visible in the viewport.

How to run

1. Install dependencies (one-time):

```bash
npm install
```

2. Start a local static server (the project includes an npm `start` script which uses http-server):

```bash
npm start
```

3. Open the redesigned UI in a browser:

http://localhost:8080/index_fixed.html

4. Run the automated verification (one command):

```bash
npm run test:fixed
```

The `verify_fixed.js` script will return a non-zero exit code if verification fails (dropdown missing, still hidden, mounted incorrectly, or positioned outside the viewport).

Design notes

- Modern, responsive, accessible UI using Tailwind CSS.
- Smooth animations and focus rings for keyboard accessibility.
- Demonstrates the correct portal/popout technique for floating menus.

If you want to inspect the original reproduction, open `index.html` (unchanged) to see the original bug where `overflow: hidden` on the card clipped the dropdown.
