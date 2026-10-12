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
    // 1. Desktop Light: Words Page with "Mavzular to'plami" button
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('http://localhost:4173/words', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'curated_01_desktop_light_words_page.png') });
    console.log('Saved curated_01_desktop_light_words_page.png');

    // 2. Desktop Light: Open Curated Vocab Modal
    const catalogBtn = await page.getByRole('button', { name: /Mavzular to‘plami/i });
    await catalogBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'curated_02_desktop_light_catalog_modal.png') });
    console.log('Saved curated_02_desktop_light_catalog_modal.png');

    // 3. Desktop Light: Click into a topic or search a word
    const searchInput = await page.getByPlaceholder(/masalan: achieve, oila/i);
    await searchInput.fill('fam');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'curated_03_desktop_light_search_results.png') });
    console.log('Saved curated_03_desktop_light_search_results.png');

    // 4. Desktop Dark Mode: Catalog Modal
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await searchInput.fill('');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'curated_04_desktop_dark_catalog_modal.png') });
    console.log('Saved curated_04_desktop_dark_catalog_modal.png');

    // 5. Desktop Dark: Click a topic to see its words
    const dialog = page.locator('[role="dialog"]');
    const firstUnit = dialog.getByText(/Kun 1/i).first();
    await firstUnit.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'curated_05_desktop_dark_unit_words.png') });
    console.log('Saved curated_05_desktop_dark_unit_words.png');

    // 6. Click "O'rganish" on a word to launch the Stepper flow
    const learnBtn = dialog.getByRole('button', { name: /O['‘]rganish/i }).first();
    await learnBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'curated_06_desktop_dark_stepper_launched.png') });
    console.log('Saved curated_06_desktop_dark_stepper_launched.png');

    await page.close();

    // 7. Mobile View (390px) Light: Add Word Modal with Stepper Mode Toggle
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto('http://localhost:4173/words', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    const addWordBtn = await mobilePage.getByRole('button', { name: /Yangi so.*z/i });
    await addWordBtn.click();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'curated_07_mobile_light_stepper_modes.png') });
    console.log('Saved curated_07_mobile_light_stepper_modes.png');

    // 8. Mobile View (390px) Light: Switch to "Tayyor to'plamdan tanlash"
    const curatedTab = await mobilePage.getByRole('button', { name: /Tayyor to.*plam/i });
    await curatedTab.click();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'curated_08_mobile_light_curated_tab.png') });
    console.log('Saved curated_08_mobile_light_curated_tab.png');

    // 9. Mobile View (390px) Dark: Curated catalog in dark mode
    await mobilePage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await mobilePage.waitForTimeout(300);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'curated_09_mobile_dark_curated_tab.png') });
    console.log('Saved curated_09_mobile_dark_curated_tab.png');

    await mobilePage.close();
    console.log('All verification screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
