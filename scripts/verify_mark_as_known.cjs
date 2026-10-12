const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.resolve('C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop Light: Open Curated Vocab Modal and click Day 1
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('http://localhost:4173/words', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const catalogBtn = page.getByRole('button', { name: /Mavzular to.*plami/i });
    await catalogBtn.click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const day1Unit = dialog.getByText(/Kun 1/i).first();
    await day1Unit.click();
    await page.waitForTimeout(500);

    // 2. Screenshot showing both Bilaman and O'rganish buttons
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'known_01_desktop_light_two_buttons.png') });
    console.log('Saved known_01_desktop_light_two_buttons.png');

    // 3. Click "Bilaman" on the second word ("name")
    const bilamanButtons = dialog.getByRole('button', { name: /Bilaman/i });
    const countBefore = await bilamanButtons.count();
    console.log('Bilaman buttons count:', countBefore);

    if (countBefore > 0) {
      await bilamanButtons.first().click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'known_02_desktop_light_marked_as_known.png') });
      console.log('Saved known_02_desktop_light_marked_as_known.png');
    }

    // 4. Desktop Dark Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'known_03_desktop_dark_marked.png') });
    console.log('Saved known_03_desktop_dark_marked.png');

    await page.close();

    // 5. Mobile View (390px) Light: Words with Bilaman & O'rganish
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto('http://localhost:4173/words', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    const mCatalogBtn = mobilePage.getByRole('button', { name: /Mavzular to.*plami/i });
    await mCatalogBtn.click();
    await mobilePage.waitForTimeout(500);

    const mDialog = mobilePage.locator('[role="dialog"]');
    const mDay1 = mDialog.getByText(/Kun 1/i).first();
    await mDay1.click();
    await mobilePage.waitForTimeout(500);

    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'known_04_mobile_light_buttons.png') });
    console.log('Saved known_04_mobile_light_buttons.png');

    // 6. Mobile Dark View
    await mobilePage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'known_05_mobile_dark_buttons.png') });
    console.log('Saved known_05_mobile_dark_buttons.png');

    await mobilePage.close();
    console.log('Mark-as-known verification finished successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
