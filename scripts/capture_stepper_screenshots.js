import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const outDir = 'C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch();

  // Helper to toggle dark mode
  async function setTheme(page, isDark) {
    if (isDark) {
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
  }

  // 1. Desktop 1280px Flow
  {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 850 },
    });

    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

    // Open Stepper Modal
    await page.getByRole('button', { name: "Yangi so'z qo'shish" }).first().click();
    await page.waitForTimeout(300);

    // Initial input screen
    await page.screenshot({ path: path.join(outDir, 'stepper_initial_desktop_light.png'), fullPage: true });
    console.log('Captured: stepper_initial_desktop_light.png');

    // Type word "candid" and submit
    await page.getByPlaceholder(/candid, tenacious/i).fill('candid');
    await page.getByRole('button', { name: /O‘rganishni boshlash/i }).click();
    await page.waitForTimeout(600);

    // Step 1: Hook
    await page.screenshot({ path: path.join(outDir, 'stepper_step1_hook_desktop_light.png'), fullPage: true });
    console.log('Captured: stepper_step1_hook_desktop_light.png');

    await setTheme(page, true);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'stepper_step1_hook_desktop_dark.png'), fullPage: true });
    console.log('Captured: stepper_step1_hook_desktop_dark.png');
    await setTheme(page, false);

    // Move to Step 2: Listen & Say
    await page.getByRole('button', { name: /Keyingisi/i }).click();
    await page.waitForTimeout(400);

    // Articulation check
    await page.getByText(/O‘zingiz ovoz chiqarib aytdingizmi\?/i).click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(outDir, 'stepper_step2_listen_desktop_light.png'), fullPage: true });
    console.log('Captured: stepper_step2_listen_desktop_light.png');

    // Move to Step 3: Own Sentence
    await page.getByRole('button', { name: /Keyingisi/i }).click();
    await page.waitForTimeout(400);

    // Type own sentence
    await page.locator('textarea').fill('I had a candid conversation with my mentor about my career.');
    await page.getByRole('button', { name: /Jumlani tekshirish/i }).click();
    await page.waitForTimeout(600);

    await page.screenshot({ path: path.join(outDir, 'stepper_step3_sentence_desktop_light.png'), fullPage: true });
    console.log('Captured: stepper_step3_sentence_desktop_light.png');

    // Move to Step 4: Conversation Bridge
    await page.getByRole('button', { name: /Keyingisi/i }).click();
    await page.waitForTimeout(400);

    // Type conversation reply using target word "candid"
    await page.locator('textarea').fill('Because being candid helped us solve our biggest disagreement honestly.');
    await page.getByRole('button', { name: /Javobni tekshirish/i }).click();
    await page.waitForTimeout(600);

    await page.screenshot({ path: path.join(outDir, 'stepper_step4_bridge_desktop_light.png'), fullPage: true });
    console.log('Captured: stepper_step4_bridge_desktop_light.png');

    await setTheme(page, true);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'stepper_step4_bridge_desktop_dark.png'), fullPage: true });
    console.log('Captured: stepper_step4_bridge_desktop_dark.png');

    // Click finish to commit to user_words + FSRS!
    await page.getByRole('button', { name: /Lug‘atga saqlash va FSRSni boshlash/i }).click();
    await page.waitForTimeout(600);

    await page.screenshot({ path: path.join(outDir, 'stepper_after_finish_desktop_dark.png'), fullPage: true });
    console.log('Captured: stepper_after_finish_desktop_dark.png');

    await page.close();
  }

  // 2. Mobile 390px Viewport Flow
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });

    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

    // Open Stepper Modal
    await page.getByRole('button', { name: "Yangi so'z qo'shish" }).first().click();
    await page.waitForTimeout(300);

    // Type word "tenacious"
    await page.getByPlaceholder(/candid, tenacious/i).fill('tenacious');
    await page.getByRole('button', { name: /O‘rganishni boshlash/i }).click();
    await page.waitForTimeout(600);

    // Step 1: Hook (mobile light)
    await page.screenshot({ path: path.join(outDir, 'stepper_step1_hook_mobile_light.png'), fullPage: true });
    console.log('Captured: stepper_step1_hook_mobile_light.png');

    await setTheme(page, true);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'stepper_step1_hook_mobile_dark.png'), fullPage: true });
    console.log('Captured: stepper_step1_hook_mobile_dark.png');
    await setTheme(page, false);

    // Step 2: Listen (mobile light)
    await page.getByRole('button', { name: /Keyingisi/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'stepper_step2_listen_mobile_light.png'), fullPage: true });
    console.log('Captured: stepper_step2_listen_mobile_light.png');

    // Step 3: Sentence (mobile light)
    await page.getByRole('button', { name: /Keyingisi/i }).click();
    await page.waitForTimeout(400);
    await page.locator('textarea').fill('My tenacious habit of reading daily changed my life.');
    await page.getByRole('button', { name: /Jumlani tekshirish/i }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'stepper_step3_sentence_mobile_light.png'), fullPage: true });
    console.log('Captured: stepper_step3_sentence_mobile_light.png');

    // Step 4: Bridge (mobile dark)
    await page.getByRole('button', { name: /Keyingisi/i }).click();
    await page.waitForTimeout(400);
    await page.locator('textarea').fill('A tenacious person never loses hope in adversity.');
    await page.getByRole('button', { name: /Javobni tekshirish/i }).click();
    await page.waitForTimeout(600);
    await setTheme(page, true);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'stepper_step4_bridge_mobile_dark.png'), fullPage: true });
    console.log('Captured: stepper_step4_bridge_mobile_dark.png');

    await page.close();
  }

  await browser.close();
  console.log('All stepper screenshots successfully captured!');
}

run().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
