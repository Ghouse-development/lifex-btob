const puppeteer = require('puppeteer');

const PAGES = [
  { url: 'http://localhost:3001/src/index.html', name: 'トップページ' },
  { url: 'http://localhost:3001/src/admin-login.html', name: '管理ログイン' },
  { url: 'http://localhost:3001/src/admin.html', name: '管理ダッシュボード' },
  { url: 'http://localhost:3001/src/admin-profile.html', name: '管理プロフィール' },
  { url: 'http://localhost:3001/src/admin-users.html', name: '管理ユーザー' },
  { url: 'http://localhost:3001/src/admin-notifications.html', name: '管理通知' },
  { url: 'http://localhost:3001/src/admin-plans.html', name: '管理プラン' },
  { url: 'http://localhost:3001/src/admin-rules.html', name: '管理ルール' },
  { url: 'http://localhost:3001/src/admin-faq.html', name: '管理FAQ' },
  { url: 'http://localhost:3001/src/plans.html', name: 'プラン一覧' },
  { url: 'http://localhost:3001/src/rules.html', name: 'ルール一覧' },
  { url: 'http://localhost:3001/src/matrix.html', name: 'マトリクス' },
];

(async () => {
  console.log('🔍 === 全ページのコンソールエラーチェック ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const allResults = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const pageInfo of PAGES) {
    const page = await browser.newPage();
    const logs = {
      errors: [],
      warnings: [],
      info: [],
      logs: []
    };

    // コンソールメッセージをキャプチャ
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      if (type === 'error') {
        logs.errors.push(text);
      } else if (type === 'warning') {
        logs.warnings.push(text);
      } else if (type === 'info') {
        logs.info.push(text);
      } else if (type === 'log') {
        logs.logs.push(text);
      }
    });

    // ページエラーをキャプチャ
    page.on('pageerror', error => {
      logs.errors.push(`[PageError] ${error.message}`);
    });

    // リクエストエラーをキャプチャ
    page.on('requestfailed', request => {
      const failure = request.failure();
      logs.errors.push(`[RequestFailed] ${request.url()} - ${failure.errorText}`);
    });

    // レスポンスエラーをキャプチャ
    page.on('response', response => {
      if (response.status() >= 400) {
        const url = response.url();
        // Supabase APIや外部CDNのエラーは除外
        if (!url.includes('supabase.co') && !url.includes('cdn.') && !url.includes('unpkg')) {
          logs.errors.push(`[HTTP ${response.status()}] ${url}`);
        }
      }
    });

    try {
      console.log(`📄 テスト中: ${pageInfo.name}`);
      await page.goto(pageInfo.url, {
        waitUntil: 'networkidle0',
        timeout: 10000
      });

      // ページが安定するまで待機
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = {
        name: pageInfo.name,
        url: pageInfo.url,
        errors: logs.errors,
        warnings: logs.warnings,
        status: logs.errors.length === 0 ? 'OK' : 'ERROR'
      };

      allResults.push(result);
      totalErrors += logs.errors.length;
      totalWarnings += logs.warnings.length;

      // 結果を表示
      if (logs.errors.length === 0) {
        console.log(`  ✅ エラーなし`);
      } else {
        console.log(`  ❌ エラー ${logs.errors.length}件`);
        logs.errors.slice(0, 3).forEach(err => {
          console.log(`     - ${err.substring(0, 100)}`);
        });
        if (logs.errors.length > 3) {
          console.log(`     ... 他 ${logs.errors.length - 3}件`);
        }
      }

      if (logs.warnings.length > 0) {
        console.log(`  ⚠️  警告 ${logs.warnings.length}件`);
      }

      console.log('');

    } catch (error) {
      console.log(`  ❌ ページ読み込み失敗: ${error.message}\n`);
      allResults.push({
        name: pageInfo.name,
        url: pageInfo.url,
        errors: [error.message],
        warnings: [],
        status: 'FAILED'
      });
      totalErrors++;
    }

    await page.close();
  }

  await browser.close();

  // サマリー
  console.log('='.repeat(60));
  console.log('📊 === テストサマリー ===');
  console.log('='.repeat(60));
  console.log(`\nテストページ数: ${PAGES.length}`);
  console.log(`エラーなし: ${allResults.filter(r => r.status === 'OK').length}`);
  console.log(`エラーあり: ${allResults.filter(r => r.status === 'ERROR' || r.status === 'FAILED').length}`);
  console.log(`総エラー数: ${totalErrors}`);
  console.log(`総警告数: ${totalWarnings}`);

  console.log('\n詳細:');
  allResults.forEach(r => {
    const icon = r.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.errors.length}エラー, ${r.warnings.length}警告`);
  });

  console.log('\n' + '='.repeat(60));

  if (totalErrors === 0) {
    console.log('🎉 === 全ページでエラーなし ===');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } else {
    console.log('❌ === エラーが見つかりました ===');
    console.log('='.repeat(60));
    console.log('\n詳細なエラー:');

    allResults
      .filter(r => r.errors.length > 0)
      .forEach(r => {
        console.log(`\n${r.name}:`);
        r.errors.forEach((err, i) => {
          console.log(`  ${i + 1}. ${err}`);
        });
      });

    console.log('\n');
    process.exit(1);
  }
})();
