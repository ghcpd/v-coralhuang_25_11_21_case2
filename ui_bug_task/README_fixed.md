# UI Bug Task — Redesigned & Fixed Dropdown

This repo demonstrates a modern Tailwind redesign and a portal-based dropdown that avoids clipping by parent elements.

## Files added
- `index_fixed.html`: Fully redesigned UI using Tailwind CSS (CDN) with a portal dropdown attached to the document root.
- `verify_fixed.js`: Puppeteer test script that verifies the dropdown is fully visible in the viewport and appended to `document.body`.
- `README_fixed.md`: This document.

## How to run
1. Install dependencies:

```powershell
cd ui_bug_task
npm install
```

2. Start the static server (port 8080):

```powershell
npm start
```

3. Visit the fixed demo:

http://localhost:8080/index_fixed.html

4. Run the automated test to verify the dropdown is not clipped:

```powershell
npm run test:fixed
```

## The fix
- The dropdown is created at the document root and positioned near the trigger button using JS. This avoids CSS clipping from overflow on parent containers like cards.

## Design choices
- Tailwind CSS for rapid prototyping and consistent spacing and color systems.
- Subtle shadows, gradients and rounded corners for a modern aesthetic.
- Portal + position logic ensures responsiveness and avoids clipping.
- Accessible keyboard interaction (Enter, Space to activate, Esc to close).

## Notes
- Keep `http-server` and `puppeteer` installed via `npm install`. `test:fixed` uses `--no-sandbox` to be cross-platform friendly.
