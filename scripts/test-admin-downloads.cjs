const puppeteer = require('puppeteer');

async function testAdminDownloads() {
  console.log('🔍 admin-downloads.html の詳細チェック開始...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // すべてのリクエストとレスポンスを監視
  const allRequests = [];
  const failedRequests = [];
  const responses = [];

  page.on('request', request => {
    allRequests.push({
      url: request.url(),
      method: request.method(),
      type: request.resourceType()
    });
  });

  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });

  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
  });

  // コンソールログとエラーを監視
  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else {
      consoleLogs.push(`[${msg.type()}] ${text}`);
    }
  });

  // ページエラーを監視
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.toString());
  });

  try {
    const url = 'https://lifex-btob.vercel.app/admin-downloads.html';
    console.log(`📄 URL: ${url}\n`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // ページが完全にロードされるまで待機
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('=== リクエスト統計 ===');
    console.log(`総リクエスト数: ${allRequests.length}`);
    console.log(`失敗したリクエスト: ${failedRequests.length}`);
    console.log('');

    if (failedRequests.length > 0) {
      console.log('=== 失敗したリクエスト ===');
      failedRequests.forEach((req, i) => {
        console.log(`${i + 1}. ${req.url}`);
        console.log(`   失敗理由: ${req.failure.errorText}`);
      });
      console.log('');
    }

    // エラーレスポンスをチェック
    const errorResponses = responses.filter(r => r.status >= 400);
    if (errorResponses.length > 0) {
      console.log('=== エラーレスポンス (4xx/5xx) ===');
      errorResponses.forEach((res, i) => {
        console.log(`${i + 1}. [${res.status}] ${res.url}`);
      });
      console.log('');
    }

    if (consoleErrors.length > 0) {
      console.log('=== コンソールエラー ===');
      consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
      console.log('');
    }

    if (pageErrors.length > 0) {
      console.log('=== ページエラー (JavaScript実行時エラー) ===');
      pageErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
      console.log('');
    }

    // 重要なログを表示
    console.log('=== 重要なコンソールログ (最初の20件) ===');
    consoleLogs.slice(0, 20).forEach(log => {
      console.log(log);
    });
    console.log('');

    // ページの最終状態をチェック
    const finalUrl = page.url();
    console.log(`=== 最終URL ===`);
    console.log(finalUrl);

    if (finalUrl.includes('admin-login')) {
      console.log('⚠️ ログインページにリダイレクトされました（認証が必要）');
    }

  } catch (error) {
    console.log(`❌ エラー: ${error.message}`);
  }

  await browser.close();
  console.log('\n✅ チェック完了');
}

testAdminDownloads().catch(console.error);
