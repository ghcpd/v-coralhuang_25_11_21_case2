# Modern UI Fix · Clipped Dropdown (Tailwind)

## Overview
`index_fixed.html` delivers a fully redesigned, modern control center UI built with **Tailwind CSS**. The Actions dropdown is now **floating and portal-based**, ensuring it’s never clipped by parent overflow while remaining accessible and responsive.

## What’s Fixed
- Dropdown is **detached from the card** and positioned with JS using viewport geometry.
- Works even when the card uses `overflow-hidden` (e.g., for rounded corners/gradients).
- Accessible roles/ARIA, keyboard navigation, outside-click + Escape to close.
- Responsive layout, polished gradients, animations, and visual hierarchy.

## Quickstart
```bash
npm install
npm start
```
Then open: **http://localhost:8080/index_fixed.html**

## Scripts
- `npm start` — serve the project at `http://localhost:8080`
- `npm test` — original bug reproduction test (against `index.html`)
- `npm run test:fixed` — new Puppeteer test validating the fixed dropdown (`index_fixed.html`)

## Automated Test (`verify_fixed.js`)
The test:
1. Launches `index_fixed.html` via `http-server`.
2. Clicks the **Actions** toggle (`data-testid="actions-toggle"`).
3. Confirms the menu is visible and **not clipped** by comparing `getBoundingClientRect()` to `scrollHeight/scrollWidth` and checking viewport bounds.

Run it:
```bash
npm run test:fixed
```

## Implementation Notes
- **Tailwind CDN** for rapid, portable styling.
- Dropdown lives as a **fixed-position portal** outside the card; JS computes optimal placement (above/below, horizontal clamping) on open, scroll, and resize.
- Smooth transitions (`opacity/scale/translate`) plus focus management for keyboard users.

## UI Highlights
- Gradient background, glassmorphism cards, responsive grid.
- Hero with status indicators and chart placeholder.
- Settings card with action menu, activity feed, and empty-state card.

## Accessibility
- `aria-expanded`, `aria-controls`, `role="menu"/"menuitem"`.
- Keyboard: Arrow Up/Down cycles items; Escape closes and returns focus.

## Troubleshooting
- If Puppeteer fails to launch in your environment, ensure sandbox flags are allowed (we use `--no-sandbox --disable-setuid-sandbox`).
- Verify port **8080** isn’t in use; adjust `PORT` in `verify_fixed.js` if needed.

## Files
- `index_fixed.html` — redesigned UI with fixed dropdown.
- `verify_fixed.js` — automated verification for the fix.
- `README_fixed.md` — this guide.
