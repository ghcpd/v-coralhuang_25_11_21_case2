const puppeteer = require('puppeteer');
const httpServer = require('http-server');

const PORT = 8080;
const TARGET = `http://localhost:${PORT}/index_fixed.html`;

(async () => {
    const server = httpServer.createServer({ root: '.' });
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Server started on port ${PORT}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.goto(TARGET, { waitUntil: 'networkidle0' });
        await page.waitForSelector('#action-toggle', { visible: true, timeout: 5000 });

        console.log('Opening actions menu');
        await page.click('#action-toggle');
        await page.waitForFunction(
            () => document.getElementById('action-menu')?.dataset.state === 'open',
            { timeout: 4000 }
        );
        await page.waitForTimeout(350);

        const metrics = await page.evaluate(() => {
            const card = document.getElementById('insights-panel');
            const dropdown = document.getElementById('action-menu');
            const cardRect = card.getBoundingClientRect();
            const dropdownRect = dropdown.getBoundingClientRect();
            const dropdownStyles = window.getComputedStyle(dropdown);
            const cardStyles = window.getComputedStyle(card);

            return {
                cardBottom: cardRect.bottom,
                cardOverflowX: cardStyles.overflowX,
                cardOverflowY: cardStyles.overflowY,
                dropdownTop: dropdownRect.top,
                dropdownBottom: dropdownRect.bottom,
                dropdownHeight: dropdownRect.height,
                dropdownOpacity: parseFloat(dropdownStyles.opacity),
                dropdownVisibility: dropdownStyles.visibility,
                viewportHeight: window.innerHeight,
                dropdownVisible: dropdownStyles.visibility !== 'hidden' &&
                    parseFloat(dropdownStyles.opacity) >= 0.9 &&
                    dropdownRect.height > 0
            };
        });

        console.log('Metrics:', metrics);

        const pointerProbe = await page.evaluate(() => {
            const dropdown = document.getElementById('action-menu');
            const rect = dropdown.getBoundingClientRect();
            const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
            const centerX = clamp(rect.left + rect.width / 2, 0, window.innerWidth - 1);
            const middleY = clamp(rect.top + rect.height / 2, 0, window.innerHeight - 1);
            const bottomY = clamp(rect.bottom - 5, rect.top + 1, window.innerHeight - 1);
            const samples = [
                { x: centerX, y: middleY },
                { x: centerX, y: bottomY }
            ];
            const results = samples.map(({ x, y }) => {
                const el = document.elementFromPoint(x, y);
                return Boolean(el && dropdown.contains(el));
            });
            return { samples, results };
        });

        console.log('Pointer coverage:', pointerProbe);

        const failures = [];

        if (!metrics.dropdownVisible) {
            failures.push('Dropdown is not visible (opacity or height check failed).');
        }

        if (['hidden', 'clip'].includes(metrics.cardOverflowX) || ['hidden', 'clip'].includes(metrics.cardOverflowY)) {
            failures.push(`Card overflow is set to a clipping mode (overflowX=${metrics.cardOverflowX}, overflowY=${metrics.cardOverflowY}).`);
        }

        if (metrics.dropdownBottom > metrics.viewportHeight) {
            failures.push(`Dropdown bottom (${metrics.dropdownBottom.toFixed(2)}) exceeds viewport height (${metrics.viewportHeight}).`);
        }

        if (!pointerProbe.results.every(Boolean)) {
            failures.push('Pointer probe indicates parts of the dropdown are not interactable (likely clipped).');
        }

        if (failures.length) {
            failures.forEach((message) => console.error('FAIL:', message));
            process.exit(1);
        }

        console.log('SUCCESS: Dropdown renders completely and is interactable without clipping.');
    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    } finally {
        await browser.close();
        server.close();
        console.log('Test finished.');
    }
})();
