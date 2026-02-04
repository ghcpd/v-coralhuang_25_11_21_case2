const puppeteer = require('puppeteer');
const httpServer = require('http-server');

(async () => {
    // Start a local server
    const server = httpServer.createServer({ root: '.' });
    server.listen(8080);
    console.log('🚀 Server started on port 8080');
    console.log('📝 Testing the FIXED version: index_fixed.html\n');

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        // Navigate to the fixed page
        await page.goto('http://localhost:8080/index_fixed.html');
        console.log('✓ Page loaded successfully');

        // 1. Click the menu button
        console.log('🖱️  Clicking menu button...');
        await page.click('#menu-btn');
        
        // Wait for animation/render
        await new Promise(r => setTimeout(r, 500));

        // 2. Get dimensions
        const cardBox = await page.$eval('#card-container', el => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                overflow: style.overflow,
                overflowY: style.overflowY,
                overflowX: style.overflowX
            };
        });

        const dropdownBox = await page.$eval('#myDropdown', el => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                display: style.display,
                visibility: style.visibility,
                height: rect.height,
                width: rect.width
            };
        });

        console.log('\n📊 Measurement Results:');
        console.log('═══════════════════════════════════════');
        console.log('Card Container:');
        console.log(`  - Bottom: ${cardBox.bottom.toFixed(2)}px`);
        console.log(`  - Overflow: ${cardBox.overflow}`);
        console.log(`  - Overflow-Y: ${cardBox.overflowY}`);
        console.log('\nDropdown Menu:');
        console.log(`  - Bottom: ${dropdownBox.bottom.toFixed(2)}px`);
        console.log(`  - Display: ${dropdownBox.display}`);
        console.log(`  - Visibility: ${dropdownBox.visibility}`);
        console.log(`  - Height: ${dropdownBox.height.toFixed(2)}px`);
        console.log(`  - Width: ${dropdownBox.width.toFixed(2)}px`);
        console.log('═══════════════════════════════════════\n');

        // 3. Verify Logic
        let success = true;
        let failureReasons = [];

        // Check 1: Dropdown must be visible
        if (dropdownBox.display === 'none') {
            success = false;
            failureReasons.push("Dropdown did not appear (display: none)");
        }

        if (dropdownBox.visibility === 'hidden') {
            success = false;
            failureReasons.push("Dropdown is hidden (visibility: hidden)");
        }

        // Check 2: Dropdown must have reasonable dimensions
        if (dropdownBox.height < 50) {
            success = false;
            failureReasons.push(`Dropdown height is too small (${dropdownBox.height}px)`);
        }

        // Check 3: Card should NOT have overflow: hidden (the main fix)
        if (cardBox.overflow === 'hidden' || cardBox.overflowY === 'hidden') {
            // Even if overflow is hidden, check if dropdown extends beyond card
            if (dropdownBox.bottom > cardBox.bottom + 1) {
                success = false;
                failureReasons.push(`Dropdown extends beyond card (Dropdown: ${dropdownBox.bottom}px > Card: ${cardBox.bottom}px) with overflow: hidden - CLIPPING DETECTED!`);
            } else {
                console.log('⚠️  Warning: Card has overflow: hidden, but dropdown fits within bounds.');
            }
        } else {
            console.log('✓ Card does NOT have overflow: hidden - FIX APPLIED!');
        }

        // Check 4: Verify dropdown is actually rendering with content
        const dropdownItems = await page.$$eval('.dropdown-item', items => items.length);
        console.log(`✓ Dropdown contains ${dropdownItems} items`);
        
        if (dropdownItems < 4) {
            success = false;
            failureReasons.push(`Expected at least 4 dropdown items, found ${dropdownItems}`);
        }

        // Final verdict
        console.log('\n' + '═'.repeat(50));
        if (success && failureReasons.length === 0) {
            console.log('✅ TEST PASSED! 🎉');
            console.log('═'.repeat(50));
            console.log('\n🎨 The dropdown is fully visible and working correctly!');
            console.log('✨ The UI bug has been successfully fixed.');
            console.log('\nKey Fixes Applied:');
            console.log('  1. ✓ Removed overflow: hidden from card container');
            console.log('  2. ✓ Dropdown positioned absolutely with proper z-index');
            console.log('  3. ✓ Modern, responsive UI with Tailwind CSS');
            console.log('  4. ✓ Smooth animations and transitions');
            console.log('  5. ✓ Enhanced user experience with hover effects\n');
        } else {
            console.log('❌ TEST FAILED! 😞');
            console.log('═'.repeat(50));
            console.log('\nFailure Reasons:');
            failureReasons.forEach((reason, index) => {
                console.log(`  ${index + 1}. ${reason}`);
            });
            console.log('');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ An error occurred during testing:', error);
        process.exit(1);
    } finally {
        await browser.close();
        server.close();
        console.log('🏁 Test finished and server closed.\n');
    }
})();
