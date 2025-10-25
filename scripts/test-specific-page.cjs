const puppeteer = require('puppeteer');

const targetUrl = process.argv[2] || 'https://lifex-btob.vercel.app/rules';

(async () => {
  console.log(`🔍 === ページの詳細チェック ===`);
  console.log(`URL: ${targetUrl}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const logs = {
    errors: [],
    warnings: [],
    logs: [],
    network: []
  };

  // コンソールログをキャプチャ
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      logs.errors.push(text);
    } else if (type === 'warning') {
      logs.warnings.push(text);
    } else if (type === 'log') {
      logs.logs.push(text);
    }
  });

  // ページエラーをキャプチャ
  page.on('pageerror', error => {
    logs.errors.push(`[PageError] ${error.message}`);
  });

  // ネットワークリクエストをキャプチャ
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    if (url.includes('supabase.co')) {
      try {
        const contentType = response.headers()['content-type'] || '';
        let body = '';

        if (contentType.includes('json')) {
          try {
            body = await response.text();
          } catch (e) {
            body = '[Could not read body]';
          }
        }

        logs.network.push({
          url: url.substring(0, 100),
          status,
          contentType,
          bodyPreview: body.substring(0, 200)
        });
      } catch (e) {
        logs.network.push({
          url: url.substring(0, 100),
          status,
          error: e.message
        });
      }
    }
  });

  try {
    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    // ページが安定するまで待機
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ページのHTMLから特定の要素を確認
    const hasRuleCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-rule-card], .rule-card, [x-data]');
      return {
        totalElements: cards.length,
        hasAlpine: !!window.Alpine,
        hasSupabase: !!window.supabaseClient || !!window.sb,
        bodyText: document.body.innerText.substring(0, 500)
      };
    });

    console.log('📊 === ページ情報 ===');
    console.log(`Alpine.js: ${hasRuleCards.hasAlpine ? '✅' : '❌'}`);
    console.log(`Supabase: ${hasRuleCards.hasSupabase ? '✅' : '❌'}`);
    console.log(`要素数: ${hasRuleCards.totalElements}`);
    console.log(`\nページテキスト（最初の500文字）:`);
    console.log(hasRuleCards.bodyText);

    console.log('\n🔍 === コンソールログ ===');
    if (logs.logs.length > 0) {
      logs.logs.slice(0, 10).forEach(log => {
        console.log(`  ${log}`);
      });
      if (logs.logs.length > 10) {
        console.log(`  ... 他 ${logs.logs.length - 10}件`);
      }
    } else {
      console.log('  (なし)');
    }

    console.log('\n❌ === エラー ===');
    if (logs.errors.length > 0) {
      logs.errors.slice(0, 10).forEach(err => {
        console.log(`  ${err}`);
      });
      if (logs.errors.length > 10) {
        console.log(`  ... 他 ${logs.errors.length - 10}件`);
      }
    } else {
      console.log('  (なし)');
    }

    console.log('\n⚠️  === 警告 ===');
    if (logs.warnings.length > 0) {
      logs.warnings.slice(0, 10).forEach(warn => {
        console.log(`  ${warn}`);
      });
      if (logs.warnings.length > 10) {
        console.log(`  ... 他 ${logs.warnings.length - 10}件`);
      }
    } else {
      console.log('  (なし)');
    }

    console.log('\n🌐 === Supabase ネットワークリクエスト ===');
    if (logs.network.length > 0) {
      logs.network.forEach(req => {
        console.log(`  [${req.status}] ${req.url}`);
        if (req.bodyPreview) {
          console.log(`    → ${req.bodyPreview}`);
        }
      });
    } else {
      console.log('  (なし)');
    }

  } catch (error) {
    console.log(`\n❌ ページ読み込み失敗: ${error.message}`);
  }

  await browser.close();
})();
