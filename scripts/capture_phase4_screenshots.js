import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const outDir = 'C:/Users/Asilbek/.gemini/antigravity/brain/9ad21850-fcdd-4f79-8a32-7726907a21fb/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch();

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

  // 1. Desktop Flow (1280px)
  {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 850 },
    });

    await page.goto('http://localhost:4173/review', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Initial Screen (Stage 2: Dictation)
    await page.screenshot({ path: path.join(outDir, 'phase4_desktop_light_exercise.png'), fullPage: true });
    console.log('Captured: phase4_desktop_light_exercise.png');

    await setTheme(page, true);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'phase4_desktop_dark_exercise.png'), fullPage: true });
    console.log('Captured: phase4_desktop_dark_exercise.png');
    await setTheme(page, false);

    // Submit answer in whichever input is visible
    const input = page.locator('input:visible, textarea:visible').first();
    if (await input.isVisible()) {
      await input.fill('Her meticulous notes helped everyone pass the exam.');
      await page.waitForTimeout(200);
      const checkBtn = page.getByRole('button', { name: /Tekshirish/i });
      if (await checkBtn.isVisible()) {
        await checkBtn.click();
        await page.waitForTimeout(400);
      }
    } else {
      const opt = page.locator('button:has-text("[1]")').first();
      if (await opt.isVisible()) {
        await opt.click();
        const checkBtn = page.getByRole('button', { name: /Tekshirish/i });
        if (await checkBtn.isVisible()) {
          await checkBtn.click();
          await page.waitForTimeout(400);
        }
      }
    }

    // Capture Rating Bar
    await page.screenshot({ path: path.join(outDir, 'phase4_desktop_light_rating_bar.png'), fullPage: true });
    console.log('Captured: phase4_desktop_light_rating_bar.png');

    await setTheme(page, true);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'phase4_desktop_dark_rating_bar.png'), fullPage: true });
    console.log('Captured: phase4_desktop_dark_rating_bar.png');
    await setTheme(page, false);

    // Rate "Qaytadan" (Again) to trigger lapse / review
    const againBtn = page.getByRole('button', { name: /Qaytadan/i }).first();
    if (await againBtn.isVisible()) {
      await againBtn.click();
      await page.waitForTimeout(600);
    }

    // Now on Card 2 (Stage 3 or 4)
    await page.screenshot({ path: path.join(outDir, 'phase4_desktop_light_card2.png'), fullPage: true });
    console.log('Captured: phase4_desktop_light_card2.png');

    // Answer card 2
    const input2 = page.locator('input:visible, textarea:visible').first();
    if (await input2.isVisible()) {
      await input2.fill('resilience');
      const checkBtn = page.getByRole('button', { name: /Tekshirish/i });
      if (await checkBtn.isVisible()) {
        await checkBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Rate "Yaxshi" (Good)
    const goodBtn = page.getByRole('button', { name: /Yaxshi/i }).first();
    if (await goodBtn.isVisible()) {
      await goodBtn.click();
      await page.waitForTimeout(600);
    }

    // Card 3
    const input3 = page.locator('input:visible, textarea:visible').first();
    if (await input3.isVisible()) {
      await input3.fill('ephemeral');
      const checkBtn = page.getByRole('button', { name: /Tekshirish/i });
      if (await checkBtn.isVisible()) {
        await checkBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Rate "Oson" (Easy) to finish session
    const easyBtn = page.getByRole('button', { name: /Oson/i }).first();
    if (await easyBtn.isVisible()) {
      await easyBtn.click();
      await page.waitForTimeout(600);
    }

    // If still cards, finish them
    for (let i = 0; i < 4; i++) {
      const check = page.getByRole('button', { name: /Tekshirish/i });
      if (await check.isVisible()) {
        const inp = page.locator('input:visible, textarea:visible').first();
        if (await inp.isVisible()) await inp.fill('test');
        await check.click();
        await page.waitForTimeout(300);
      }
      const rate = page.getByRole('button', { name: /Yaxshi/i }).first();
      if (await rate.isVisible()) {
        await rate.click();
        await page.waitForTimeout(500);
      }
    }

    // Summary screen
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'phase4_desktop_light_summary.png'), fullPage: true });
    console.log('Captured: phase4_desktop_light_summary.png');

    await setTheme(page, true);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'phase4_desktop_dark_summary.png'), fullPage: true });
    console.log('Captured: phase4_desktop_dark_summary.png');

    await page.close();
  }

  // 2. Mobile Flow (390px)
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });

    await page.goto('http://localhost:4173/review', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // If on summary, restart to show mobile exercise
    const restartBtn = page.getByRole('button', { name: /Qayta takrorlash/i });
    if (await restartBtn.isVisible()) {
      await restartBtn.click();
      await page.waitForTimeout(600);
    }

    await page.screenshot({ path: path.join(outDir, 'phase4_mobile_light_exercise.png'), fullPage: true });
    console.log('Captured: phase4_mobile_light_exercise.png');

    // Answer and check
    const input = page.locator('input:visible, textarea:visible').first();
    if (await input.isVisible()) {
      await input.fill('resilience');
      const check = page.getByRole('button', { name: /Tekshirish/i });
      if (await check.isVisible()) {
        await check.click();
        await page.waitForTimeout(400);
      }
    }

    // Capture mobile rating bar in dark mode
    await setTheme(page, true);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'phase4_mobile_dark_rating_bar.png'), fullPage: true });
    console.log('Captured: phase4_mobile_dark_rating_bar.png');

    await page.close();
  }

  await browser.close();
  console.log('All Phase 4 review session screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
