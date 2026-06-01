const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://4b6abfee-088e-4e78-804b-575d71f9b061-00-836l49r171so.spock.replit.dev/');
  await page.waitForTimeout(5000); // wait for load
  await page.screenshot({ path: 'reference_homepage.png', fullPage: true });
  await browser.close();
})();
