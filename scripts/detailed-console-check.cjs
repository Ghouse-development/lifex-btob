const puppeteer = require('puppeteer');

async function checkConsoleErrors() {
  console.log('🔍 admin-downloads.htmlの詳細なコンソールエラーチェック\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // すべてのコンソールメッセージをキャプチャ
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // JavaScriptエラーをキャプチャ
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  // リクエストエラーをキャプチャ
  const requestErrors = [];
  page.on('requestfailed', request => {
    requestErrors.push({
      url: request.url(),
      failure: request.failure()
    });
  });

  try {
    const url = 'https://lifex-btob.vercel.app/admin-downloads.html';
    console.log(`📄 テスト対象: ${url}\n`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // ページが完全にロードされるまで待機
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('=== コンソールメッセージ (全件) ===');
    consoleMessages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
      if (msg.location && msg.location.url) {
        console.log(`   場所: ${msg.location.url}:${msg.location.lineNumber || '?'}`);
      }
    });
    console.log('');

    if (pageErrors.length > 0) {
      console.log('=== JavaScriptエラー ===');
      pageErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.message}`);
        if (err.stack) {
          console.log(`   スタック:\n${err.stack}`);
        }
      });
      console.log('');
    }

    // エラーメッセージのフィルタリング
    const realErrors = consoleMessages.filter(msg =>
      msg.type === 'error' &&
      !msg.text.includes('ERR_ABORTED') &&
      !msg.text.includes('Failed to load resource')
    );

    if (realErrors.length > 0) {
      console.log('=== 真のエラー (ERR_ABORTED以外) ===');
      realErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.text}`);
        if (err.location && err.location.url) {
          console.log(`   場所: ${err.location.url}:${err.location.lineNumber || '?'}`);
        }
      });
      console.log('');
    }

    // 最終的なページの状態を確認
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasAlpine: typeof window.Alpine !== 'undefined',
        hasSupabase: typeof window.supabaseClient !== 'undefined',
        hasSbReady: typeof window.sbReady !== 'undefined',
        hasSupabaseAPI: typeof window.supabaseAPI !== 'undefined',
        hasSupabaseAPIDownloads: typeof window.supabaseAPI?.downloads !== 'undefined'
      };
    });

    console.log('=== ページ状態 ===');
    console.log(`URL: ${pageInfo.url}`);
    console.log(`タイトル: ${pageInfo.title}`);
    console.log(`Alpine.js: ${pageInfo.hasAlpine ? '✅' : '❌'}`);
    console.log(`window.supabaseClient: ${pageInfo.hasSupabase ? '✅' : '❌'}`);
    console.log(`window.sbReady: ${pageInfo.hasSbReady ? '✅' : '❌'}`);
    console.log(`window.supabaseAPI: ${pageInfo.hasSupabaseAPI ? '✅' : '❌'}`);
    console.log(`window.supabaseAPI.downloads: ${pageInfo.hasSupabaseAPIDownloads ? '✅' : '❌'}`);
    console.log('');

    console.log('=== サマリー ===');
    console.log(`コンソールメッセージ総数: ${consoleMessages.length}`);
    console.log(`JavaScriptエラー: ${pageErrors.length}`);
    console.log(`リクエストエラー: ${requestErrors.length}`);
    console.log(`真のエラー: ${realErrors.length}`);

  } catch (error) {
    console.log(`❌ テストエラー: ${error.message}`);
  }

  await browser.close();
  console.log('\n✅ チェック完了');
}

checkConsoleErrors().catch(console.error);
