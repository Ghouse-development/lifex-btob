#!/usr/bin/env node

const puppeteer = require('puppeteer');

const BASE_URL = 'https://lifex-btob-3nyxkipps-ghouse-developments-projects.vercel.app';

async function quickCheck() {
  console.log('🔍 Checking admin-report.html on latest deployment...\n');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));

  // Login
  await page.goto(`${BASE_URL}/admin-login.html`, { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.type('#email', 'admin@ghouse.jp');
  await page.type('#password', 'Ghouse0648');
  await page.click('button[type="submit"]');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Clear console
  consoleMessages.length = 0;

  // Check admin-report.html
  await page.goto(`${BASE_URL}/admin-report.html`, { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 5000));

  const errors = consoleMessages.filter(m => m.type === 'error');

  console.log('Console messages:', consoleMessages.length);
  console.log('Errors:', errors.length);

  if (errors.length > 0) {
    console.log('\nErrors found:');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.text}`);
    });
  } else {
    console.log('\n✅ No errors!');
  }

  await browser.close();
}

quickCheck().catch(console.error);
