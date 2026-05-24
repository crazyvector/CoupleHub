const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });
  
  page.on('console', msg => {
    console.error('CONSOLE:', msg.text());
  });

  try {
    await page.goto('http://localhost:3000/coupons', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // wait a bit
    const html = await page.content();
    console.log("HTML:", html.substring(0, 1000));
  } catch(e) {
    console.error("GOTO ERROR", e);
  }
  await browser.close();
})();
