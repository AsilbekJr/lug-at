const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.resolve('C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots/audit');

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const th of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.goto('http://localhost:4173/words', { waitUntil: 'networkidle' });
      if (th === 'dark') {
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.classList.add('dark');
        });
      }
      await page.waitForTimeout(400);

      const detailBtn = page.getByRole('button', { name: /Tafsilotlar/i }).first();
      if (await detailBtn.isVisible()) {
        await detailBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `audit_mobile_${th}_03_word_detail.png`) });
        console.log(`Saved audit_mobile_${th}_03_word_detail.png`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
