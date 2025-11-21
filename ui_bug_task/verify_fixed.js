const puppeteer = require('puppeteer');
const http = require('http');
const httpServer = require('http-server');

(async () => {
  const server = httpServer.createServer({ root: '.' });
  server.listen(8080);
  console.log('Server started on port 8080');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Increase navigation timeout values for slow environments
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(120000);

  // Helper to poll until the server is reachable
  async function waitForServer(url, timeoutMs = 30000, intervalMs = 300) {
    const deadline = Date.now() + timeoutMs;
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? require('https') : http;

    while (Date.now() < deadline) {
      try {
        const status = await new Promise((resolve, reject) => {
          const req = lib.request({
            method: 'HEAD',
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            timeout: 2000
          }, res => {
            resolve(res.statusCode);
          });
          req.on('error', err => reject(err));
          req.on('timeout', () => { req.destroy(new Error('timeout')); });
          req.end();
        });
        if (status && status >= 200 && status < 400) return true;
      } catch (err) {
        // ignore and retry
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
  }

  try {
    // Wait for the server to respond before navigation
    const url = 'http://localhost:8080/index_fixed.html';
    const reachable = await waitForServer(url, 30000, 300);
    if (!reachable) {
      throw new Error(`Server did not become reachable: ${url}`);
    }

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('#portalActionsBtn');
    console.log('Clicking actions button to open portal dropdown...');
    await page.click('#portalActionsBtn');
    await page.waitForSelector('#portal-dropdown', { visible: true, timeout: 3000 });
    await page.waitForTimeout(300);

    const result = await page.evaluate(() => {
      const dropdown = document.getElementById('portal-dropdown');
      if (!dropdown) return { success: false, message: 'Dropdown not present' };
      const rect = dropdown.getBoundingClientRect();
      const style = window.getComputedStyle(dropdown);
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const visibleVertically = rect.top >= 0 && rect.bottom <= vh;
      const visibleHorizontally = rect.left >= 0 && rect.right <= vw;
      const isVisible = visibleVertically && visibleHorizontally && style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) !== 0;
      const attachedToBody = document.body.contains(dropdown);
      return {
        visible: isVisible,
        attachedToBody: attachedToBody,
        rect: {
          top: Math.round(rect.top), bottom: Math.round(rect.bottom), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), height: Math.round(rect.height)
        },
        viewport: { width: vw, height: vh }
      };
    });

    console.log('Dropdown rect:', result.rect);
    console.log('Viewport:', result.viewport);
    console.log('Attached to body:', result.attachedToBody);
    console.log('Fully visible inside viewport:', result.visible);

    if (!result.visible) {
      console.error('FAIL: Dropdown is not fully visible in the viewport.');
      process.exit(1);
    }
    // Attached to body is expected to be true; warn if not.
    if (!result.attachedToBody) {
      console.warn('WARNING: Dropdown is not attached to document.body; it might still be clipped.');
    }

    console.log('SUCCESS: Dropdown is fully visible (not clipped).');
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
    console.log('Test finished.');
  }
})();
