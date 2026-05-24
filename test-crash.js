const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.error('Page Crash Error:', error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console Error:', msg.text());
    }
  });

  await page.goto('http://localhost:3000/coupons', { waitUntil: 'networkidle0' });
  await browser.close();
})();
