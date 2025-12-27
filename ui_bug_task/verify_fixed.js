const puppeteer = require('puppeteer');
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

  try {
    await page.goto('http://localhost:8080/index_fixed.html');
    console.log('Page loaded');

    // 1) Click the actions button
    await page.click('#actionsButton');
    await page.waitForTimeout(400);

    // 2) Ensure the menu exists and is visible
    const dropdown_box = await page.$eval('.dropdown-menu', el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        bottom: rect.bottom,
        top: rect.top,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility
      };
    });

    const card_box = await page.$eval('.floating-card, .card, article, main', el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        bottom: rect.bottom,
        overflow: style.overflow
      };
    });

    console.log('Dropdown bottom:', dropdown_box.bottom);
    console.log('Card bottom:', card_box.bottom);
    console.log('Card overflow:', card_box.overflow);

    let success = true;
    let message = '';

    if (!dropdown_box || dropdown_box.display === 'none') {
      success = false; message = 'FAIL: dropdown not visible';
    } else {
      // If the dropdown extends beyond the card bottom while the card clips it, it's a bug.
      if ((card_box.overflow === 'hidden' || card_box.overflow === 'auto' || card_box.overflow === 'scroll')
          && dropdown_box.bottom > card_box.bottom + 1) {
        success = false;
        message = `FAIL: Dropdown is clipped by the card (dropdown.bottom=${dropdown_box.bottom} > card.bottom=${card_box.bottom})`;
      } else {
        // Also ensure the dropdown is visible within the browser viewport
        const viewport_ok = dropdown_box.bottom <= (await page.evaluate(()=>window.innerHeight)) + 1;
        if (!viewport_ok) {
          success = false;
          message = 'FAIL: Dropdown falls outside the viewport';
        } else {
          success = true;
          message = 'SUCCESS: Dropdown is visible and not clipped.';
        }
      }
    }

    console.log(message);
    if (!success) process.exit(1);

  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
    console.log('Test finished.');
  }

})();
