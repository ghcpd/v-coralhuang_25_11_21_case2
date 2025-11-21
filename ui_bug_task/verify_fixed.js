const puppeteer = require('puppeteer');
const httpServer = require('http-server');

(async () => {
  // Start a local static server
  const server = httpServer.createServer({ root: '.' });
  server.listen(8080);
  console.log('Server started on port 8080');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/index_fixed.html', { waitUntil: 'networkidle2' });

    // Wait a moment so fonts and animations load
    await page.waitForTimeout(300);

    // Click the actions button inside the overflowing card
    await page.click('#actionsBtn');

    // Allow menu to open
    await page.waitForTimeout(200);

    // Evaluate the page to determine where the dropdown lives and whether it's visible
    const result = await page.evaluate(() => {
      const dropdown = document.getElementById('floatingDropdown');
      if (!dropdown) return { success: false, message: 'No floating dropdown found.' };

      const style = window.getComputedStyle(dropdown);
      const isHidden = style.display === 'none' || style.visibility === 'hidden' || dropdown.classList.contains('hidden');

      // Ensure dropdown is in the document root (not clipped by ancestor with overflow hidden)
      const parentTag = dropdown.parentElement ? dropdown.parentElement.tagName : null;

      // Ensure it is positioned fixed (so it pops out of layout and cannot be clipped)
      const position = style.position;

      // Basic geometry checks (dropdown should be visible in viewport)
      const rect = dropdown.getBoundingClientRect();
      const inViewport = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight + 1) && rect.right <= window.innerWidth;

      if (isHidden) return { success: false, message: 'Dropdown is hidden after click.' };
      if (parentTag !== 'BODY') return { success: false, message: `Dropdown parent is ${parentTag} (expected BODY)` };
      if (position !== 'fixed') return { success: false, message: `Dropdown position is ${position} (expected fixed)` };
      if (!inViewport) return { success: false, message: `Dropdown is positioned outside viewport: ${JSON.stringify(rect)}` };

      return { success: true, message: 'SUCCESS: Dropdown mounted in body and visible (not clipped).' };
    });

    console.log('Result:', result.message);

    if (!result.success) process.exit(1);

  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
    console.log('Test finished.');
  }

})();
