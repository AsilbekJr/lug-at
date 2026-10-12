import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const outDir = 'C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch();

  // 1. Base pages
  const configs = [
    { name: 'desktop_light_words', url: 'http://localhost:4173/', width: 1280, height: 800, dark: false },
    { name: 'desktop_dark_words', url: 'http://localhost:4173/', width: 1280, height: 800, dark: true },
    { name: 'mobile_light_words', url: 'http://localhost:4173/', width: 390, height: 844, dark: false },
    { name: 'mobile_dark_words', url: 'http://localhost:4173/', width: 390, height: 844, dark: true },
    { name: 'desktop_light_stats', url: 'http://localhost:4173/stats', width: 1280, height: 800, dark: false },
    { name: 'desktop_dark_stats', url: 'http://localhost:4173/stats', width: 1280, height: 800, dark: true },
  ];

  for (const c of configs) {
    const page = await browser.newPage({
      viewport: { width: c.width, height: c.height },
      colorScheme: c.dark ? 'dark' : 'light',
    });

    await page.goto(c.url, { waitUntil: 'networkidle' });
    if (c.dark) {
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

    await page.waitForTimeout(400);
    const filePath = path.join(outDir, `${c.name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Captured: ${c.name}.png`);
    await page.close();
  }

  // 2. Interactive: Review page with revealed card & FSRS rating buttons
  for (const dark of [false, true]) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      colorScheme: dark ? 'dark' : 'light',
    });
    await page.goto('http://localhost:4173/review', { waitUntil: 'networkidle' });
    if (dark) {
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      });
    }
    // Click on the card to reveal it
    const cardEl = page.locator('div[role="button"]').first();
    await cardEl.click();
    await page.waitForTimeout(300);
    const name = dark ? 'desktop_dark_review_revealed.png' : 'desktop_light_review_revealed.png';
    await page.screenshot({ path: path.join(outDir, name), fullPage: true });
    console.log(`Captured: ${name}`);
    await page.close();
  }

  // 3. Interactive: Add Word Dialog
  {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'light',
    });
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    // Click "Yangi so'z qo'shish"
    const addBtn = page.getByRole('button', { name: "Yangi so'z qo'shish" }).first();
    await addBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'desktop_light_add_word_modal.png'), fullPage: true });
    console.log('Captured: desktop_light_add_word_modal.png');
    await page.close();
  }

  // 4. Interactive: Word Detail Dialog
  {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'light',
    });
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    // Click first word card
    const firstArticle = page.locator('article').first();
    await firstArticle.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'desktop_light_word_detail_modal.png'), fullPage: true });
    console.log('Captured: desktop_light_word_detail_modal.png');
    await page.close();
  }

  await browser.close();
  console.log('All detailed interactive screenshots completed!');
}

capture().catch((err) => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
