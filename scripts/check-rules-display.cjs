const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.goto('https://lifex-btob.vercel.app/rules.html', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait for Alpine.js to load and render
  await new Promise(r => setTimeout(r, 5000));

  // Get page content
  const content = await page.evaluate(() => {
    const body = document.body.innerText;

    // Check for categories
    const hasCategories = body.includes('営業ルール') || body.includes('施工ルール') ||
                         body.includes('品質管理') || body.includes('安全管理') ||
                         body.includes('顧客対応');

    // Check for rules
    const hasRules = body.includes('契約書作成に必要な情報') ||
                    body.includes('契約時に準備する書類') ||
                    body.includes('LIFE X 紹介料に関する取り決め');

    // Check for empty message
    const hasEmptyMessage = body.includes('ルール・ガイドラインはまだ登録されていません');

    // Get visible category cards
    const categoryCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');

    return {
      hasCategories,
      hasRules,
      hasEmptyMessage,
      categoryCardsCount: categoryCards.length,
      bodyPreview: body.substring(0, 800)
    };
  });

  console.log('=== 📄 Rules Page Display Check ===\n');
  console.log(`カテゴリ表示: ${content.hasCategories ? '✅ YES' : '❌ NO'}`);
  console.log(`ルール表示: ${content.hasRules ? '✅ YES' : '❌ NO'}`);
  console.log(`空メッセージ: ${content.hasEmptyMessage ? '⚠️ YES (データなし)' : '✅ NO (データあり)'}`);
  console.log(`カテゴリカード数: ${content.categoryCardsCount}`);

  console.log('\n=== ページ内容（最初の800文字）===');
  console.log(content.bodyPreview);

  await browser.close();
})();
