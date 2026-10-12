import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch();
  
  // Desktop
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:4173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots/quick_add_desktop.png' });

  // Type a word in the quick add input
  const input = page.locator('input').first();
  await input.fill('resilience');
  await page.screenshot({ path: 'C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots/quick_add_desktop_typed.png' });

  // Click Curated Vocab button
  await page.locator('button', { hasText: '4,713 ta so‘z' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots/quick_add_catalog_modal.png' });
  
  // Mobile
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:4173/');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({ path: 'C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots/quick_add_mobile.png' });

  await browser.close();
  console.log('Screenshots captured successfully.');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
