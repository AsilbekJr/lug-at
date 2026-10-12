const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.resolve('C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots/audit');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  const themes = ['light', 'dark'];

  try {
    for (const vp of viewports) {
      for (const th of themes) {
        const prefix = `audit_${vp.name}_${th}`;
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

        // Helper to set theme
        const applyTheme = async () => {
          if (th === 'dark') {
            await page.evaluate(() => {
              document.documentElement.setAttribute('data-theme', 'dark');
              document.documentElement.classList.add('dark');
            });
          } else {
            await page.evaluate(() => {
              document.documentElement.removeAttribute('data-theme');
              document.documentElement.classList.remove('dark');
            });
          }
        };

        // 1. Today Screen (/)
        await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
        await applyTheme();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${prefix}_01_today.png`) });
        console.log(`Saved ${prefix}_01_today.png`);

        // 2. Words Page (/words)
        await page.goto('http://localhost:4173/words', { waitUntil: 'networkidle' });
        await applyTheme();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${prefix}_02_words.png`) });
        console.log(`Saved ${prefix}_02_words.png`);

        // 3. Word Detail Dialog (click Tafsilotlar button)
        const detailBtn = page.getByRole('button', { name: /Tafsilotlar/i }).first();
        if (await detailBtn.isVisible()) {
          await detailBtn.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${prefix}_03_word_detail.png`) });
          console.log(`Saved ${prefix}_03_word_detail.png`);
          // Close dialog
          const closeBtn = page.getByRole('button', { name: /Yopish/i }).first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(300);
          }
        }

        // 4. Stats Page (/stats)
        await page.goto('http://localhost:4173/stats', { waitUntil: 'networkidle' });
        await applyTheme();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${prefix}_04_stats.png`) });
        console.log(`Saved ${prefix}_04_stats.png`);

        // 5. Review Page (/review)
        await page.goto('http://localhost:4173/review', { waitUntil: 'networkidle' });
        await applyTheme();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${prefix}_05_review.png`) });
        console.log(`Saved ${prefix}_05_review.png`);

        await page.close();
      }
    }

    console.log('Design audit screenshots completed successfully across all viewports and themes!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
