const puppeteer = require('puppeteer');
const httpServer = require('http-server');

(async () => {
    // Start a local server
    const server = httpServer.createServer({ root: '.' });
    server.listen(8080);
    console.log('Server started on port 8080');

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:8080/index.html');

        // 1. Click the menu button
        console.log('Clicking menu button...');
        await page.click('.menu-btn');
        
        // Wait for animation/render
        await new Promise(r => setTimeout(r, 500));

        // 2. Get dimensions
        const cardBox = await page.$eval('.card', el => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return {
                bottom: rect.bottom,
                overflow: style.overflow
            };
        });

        const dropdownBox = await page.$eval('.dropdown', el => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return {
                bottom: rect.bottom,
                display: style.display
            };
        });

        console.log('Card Bottom:', cardBox.bottom);
        console.log('Dropdown Bottom:', dropdownBox.bottom);
        console.log('Card Overflow:', cardBox.overflow);

        // 3. Verify Logic
        let success = true;
        let message = "";

        if (dropdownBox.display === 'none') {
            success = false;
            message = "FAIL: Dropdown did not appear (display: none).";
        } else if (cardBox.overflow !== 'hidden' && cardBox.overflow !== 'auto' && cardBox.overflow !== 'scroll') {
             // If overflow is visible, it's likely fixed (unless it's clipped by something else, but this is the main fix)
             success = true;
             message = "SUCCESS: Card overflow is not hidden. Dropdown should be visible.";
        } else {
            // Overflow is hidden/scroll. Check bounds.
            // We allow a small margin of error (1px)
            if (dropdownBox.bottom > cardBox.bottom + 1) {
                success = false;
                message = `FAIL: Dropdown is clipped! Dropdown bottom (${dropdownBox.bottom}) extends past Card bottom (${cardBox.bottom}) with overflow: ${cardBox.overflow}`;
            } else {
                success = true;
                message = "SUCCESS: Dropdown is within bounds or overflow is handled.";
            }
        }

        console.log(message);

        if (!success) {
            process.exit(1);
        }

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    } finally {
        await browser.close();
        server.close();
        console.log('Test finished.');
    }
})();