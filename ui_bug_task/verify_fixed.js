const puppeteer = require('puppeteer');
const httpServer = require('http-server');

const PORT = 8080;
const URL = `http://localhost:${PORT}/index_fixed.html`;

(async () => {
  // Start a local server
  const server = httpServer.createServer({ root: '.' });
  server.listen(PORT);
  console.log(`Server started on port ${PORT}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[browser]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[pageerror]', err));

  try {
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="actions-toggle"]', { timeout: 5000 });

    console.log('Clicking Actions toggle...');
    await page.click('[data-testid="actions-toggle"]');

    // Quick debug snapshot right after click
    await page.waitForTimeout(200);
    const debugSnapshot = await page.$eval('[data-testid="actions-menu"]', (menu) => {
      const rect = menu.getBoundingClientRect();
      return {
        classes: Array.from(menu.classList),
        display: getComputedStyle(menu).display,
        rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
        scrollH: menu.scrollHeight,
        scrollW: menu.scrollWidth
      };
    });
    console.log('Menu snapshot (200ms):', debugSnapshot);

    // Wait for the menu to render & animate
    await page.waitForFunction(() => {
      const menu = document.querySelector('[data-testid="actions-menu"]');
      if (!menu) return false;
      const style = window.getComputedStyle(menu);
      const rect = menu.getBoundingClientRect();
      return !menu.classList.contains('hidden') && style.display !== 'none' && rect.height > 0 && rect.width > 0;
    }, { timeout: 6000 });

    // Measure geometry & clipping
    const result = await page.$eval('[data-testid="actions-menu"]', (menu) => {
      const rect = menu.getBoundingClientRect();
      const scrollH = menu.scrollHeight;
      const scrollW = menu.scrollWidth;
      const heightRatio = rect.height / scrollH;
      const widthRatio = rect.width / scrollW;
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      return {
        rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
        scrollH,
        scrollW,
        heightRatio,
        widthRatio,
        withinViewport: rect.top >= -1 && rect.left >= -1 && rect.bottom <= vh + 1 && rect.right <= vw + 1,
        // If clipped by overflow, the visible rect will be smaller than scroll size
        notClipped: heightRatio >= 0.98 && widthRatio >= 0.98
      };
    });

    console.log('Menu rect:', result.rect);
    console.log('Menu scroll size:', { h: result.scrollH, w: result.scrollW });
    console.log('Height ratio:', result.heightRatio.toFixed(3));
    console.log('Width ratio:', result.widthRatio.toFixed(3));

    let success = true;
    let message = 'SUCCESS: Dropdown is fully visible.';

    if (!result.withinViewport) {
      success = false;
      message = 'FAIL: Dropdown is outside of viewport bounds.';
    } else if (!result.notClipped) {
      success = false;
      message = 'FAIL: Dropdown appears clipped (visible size smaller than content size).';
    }

    console.log(message);

    if (!success) process.exit(1);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
    console.log('Test finished.');
  }
})();
