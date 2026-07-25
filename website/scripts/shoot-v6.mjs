#!/usr/bin/env node
/**
 * v6 screenshot script — captures 5 viewports × 4 states = 20 PNGs.
 * Viewports (per BRIEF v6: 1024 added): 2736, 1920, 1280, 1024, 375.
 * States: home, typed, encrypting, result.
 *
 * Usage: node scripts/shoot-v6.mjs [base-url]
 *   default base-url = https://one-pass.ohoooho.com/
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.argv[2] || 'https://one-pass.ohoooho.com/';
const OUT = path.resolve(
  new URL('.', import.meta.url).pathname,
  '../docs/IMPROVE-UI-SHOTS/v6',
);

const VIEWPORTS = [
  { name: '2736', width: 2736, height: 1050 },
  { name: '1920', width: 1920, height: 1080 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1024', width: 1024, height: 768 },
  { name: 'mobile', width: 375, height: 812 },
];

async function withPage(browser, vp, run) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error(`[${vp.name}] pageerror:`, e.message));
  page.on('console', m => {
    if (m.type() === 'error') console.error(`[${vp.name}] console.error:`, m.text());
  });
  await page.route('**/secret', async route => {
    if (route.request().method() === 'POST') {
      await new Promise(r => setTimeout(r, 1500));
    }
    await route.continue();
  });
  try {
    await run(page);
  } finally {
    await ctx.close();
  }
}

async function typePlaintext(page, text) {
  await page.waitForSelector('[data-testid="plaintext-input"]', { timeout: 10000 });
  await page.fill('[data-testid="plaintext-input"]', text);
}

async function clickEncrypt(page) {
  await page.locator('[data-testid="submit-create"]').first().click({ timeout: 5000 });
}

async function shoot(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function runFor(browser, vp) {
  console.log(`\n[${vp.name}] ${vp.width}x${vp.height}`);

  await withPage(browser, vp, async page => {
    // State 1: home
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="plaintext-input"]', { timeout: 15000 });
    await shoot(page, `${vp.name}-home`);

    // State 2: typed
    await typePlaintext(page, 'demo-secret-from-v6-shoot-script');
    await page.waitForTimeout(150);
    await shoot(page, `${vp.name}-typed`);

    // State 3: encrypting
    const encryptClicked = page.locator('[data-testid="submit-create"]').first();
    const clickPromise = encryptClicked
      .click({ timeout: 5000, noWaitAfter: true })
      .catch(e => {
        console.warn(`  [${vp.name}] could not click encrypt:`, e.message);
      });
    await Promise.all([
      clickPromise,
      (async () => {
        await page.waitForTimeout(50);
        await shoot(page, `${vp.name}-encrypting`);
      })(),
    ]);

    // State 4: result
    try {
      await page.waitForSelector(
        'button:has-text("再发一个"), button:has-text("Create another")',
        { timeout: 20000 },
      );
    } catch (e) {
      console.warn(`  [${vp.name}] result screen not detected, capturing current state`);
    }
    await shoot(page, `${vp.name}-result`);
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`Output dir: ${OUT}`);
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      await runFor(browser, vp);
    }
  } finally {
    await browser.close();
  }
  console.log('\n✅ Done.');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
