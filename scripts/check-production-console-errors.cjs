#!/usr/bin/env node

/**
 * 本番環境の詳細なコンソールエラーチェック
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'https://lifex-btob.vercel.app';

const pages = [
  { path: '/admin-downloads.html', name: 'ダウンロード管理', requiresAuth: true },
  { path: '/admin-faq.html', name: 'FAQ管理', requiresAuth: true },
  { path: '/admin-notifications.html', name: '通知管理', requiresAuth: true },
  { path: '/admin-users.html', name: 'ユーザー管理', requiresAuth: true },
  { path: '/admin-profile.html', name: 'プロフィール管理', requiresAuth: true },
  { path: '/admin-report.html', name: 'レポート', requiresAuth: true },
  { path: '/admin.html', name: '管理ホーム', requiresAuth: true },
  { path: '/', name: 'トップページ', requiresAuth: false },
  { path: '/plans.html', name: 'プラン一覧', requiresAuth: false }
];

async function checkPage(browser, pagePath, pageName, requiresAuth) {
  const page = await browser.newPage();

  const consoleMessages = [];
  const pageErrors = [];
  const requestErrors = [];
  const failedRequests = [];

  // コンソールメッセージをキャプチャ
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    const location = msg.location();
    consoleMessages.push({ type, text, location });
  });

  // ページエラーをキャプチャ
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  // リクエストエラーをキャプチャ
  page.on('requestfailed', request => {
    requestErrors.push({
      url: request.url(),
      failure: request.failure()
    });
  });

  // レスポンスをキャプチャ
  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      failedRequests.push({
        url: response.url(),
        status: status,
        statusText: response.statusText()
      });
    }
  });

  try {
    const url = `${BASE_URL}${pagePath}`;
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // ページが完全にロードされるまで待機
    await new Promise(resolve => setTimeout(resolve, 5000));

    const finalUrl = page.url();
    const isRedirected = !finalUrl.includes(pagePath) && pagePath !== '/';

    // 真のエラーをフィルタリング
    const realErrors = consoleMessages.filter(msg =>
      msg.type === 'error' &&
      !msg.text.includes('ERR_ABORTED') &&
      !msg.text.includes('Failed to load resource') &&
      !msg.text.includes('favicon.ico')
    );

    // 警告をフィルタリング
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');

    await page.close();

    return {
      name: pageName,
      path: pagePath,
      url,
      finalUrl,
      isRedirected,
      requiresAuth,
      consoleCount: consoleMessages.length,
      errorCount: realErrors.length,
      warningCount: warnings.length,
      pageErrorCount: pageErrors.length,
      requestErrorCount: requestErrors.length,
      failedRequestCount: failedRequests.length,
      errors: realErrors,
      warnings: warnings,
      pageErrors: pageErrors,
      requestErrors: requestErrors,
      failedRequests: failedRequests,
      allConsoleMessages: consoleMessages
    };

  } catch (error) {
    await page.close();
    return {
      name: pageName,
      path: pagePath,
      error: error.message,
      failed: true
    };
  }
}

async function main() {
  console.log('🔍 本番環境の詳細なコンソールエラーチェック開始...\n');
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const pageInfo of pages) {
    console.log(`\n📄 チェック中: ${pageInfo.name} (${pageInfo.path})`);
    const result = await checkPage(browser, pageInfo.path, pageInfo.name, pageInfo.requiresAuth);
    results.push(result);

    if (result.failed) {
      console.log(`   ❌ ページロードエラー: ${result.error}`);
    } else {
      console.log(`   URL: ${result.url}`);
      console.log(`   最終URL: ${result.finalUrl}`);
      if (result.isRedirected) {
        console.log(`   ⚠️ リダイレクトされました（認証が必要: ${result.requiresAuth}）`);
      }
      console.log(`   コンソールメッセージ: ${result.consoleCount}件`);
      console.log(`   エラー: ${result.errorCount}件`);
      console.log(`   警告: ${result.warningCount}件`);
      console.log(`   ページエラー: ${result.pageErrorCount}件`);
      console.log(`   失敗したリクエスト: ${result.failedRequestCount}件`);
    }
  }

  await browser.close();

  // 詳細レポート
  console.log('\n' + '='.repeat(80));
  console.log('📊 詳細レポート');
  console.log('='.repeat(80));

  for (const result of results) {
    if (result.failed || result.errorCount === 0) continue;

    console.log(`\n### ${result.name} ###`);
    console.log(`パス: ${result.path}`);
    console.log(`リダイレクト: ${result.isRedirected ? 'はい' : 'いいえ'}`);

    if (result.errorCount > 0) {
      console.log('\n❌ コンソールエラー:');
      result.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`);
        if (err.location && err.location.url) {
          console.log(`     場所: ${err.location.url}:${err.location.lineNumber || '?'}`);
        }
      });
    }

    if (result.warningCount > 0 && result.warningCount <= 10) {
      console.log('\n⚠️ 警告:');
      result.warnings.forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.text}`);
      });
    }

    if (result.pageErrorCount > 0) {
      console.log('\n💥 ページエラー:');
      result.pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.message}`);
        if (err.stack) {
          console.log(`     スタック: ${err.stack.split('\n')[0]}`);
        }
      });
    }

    if (result.failedRequestCount > 0) {
      console.log('\n🔴 失敗したリクエスト:');
      result.failedRequests.slice(0, 5).forEach((req, i) => {
        console.log(`  ${i + 1}. [${req.status}] ${req.url.substring(0, 100)}`);
      });
    }
  }

  // サマリー
  console.log('\n' + '='.repeat(80));
  console.log('📈 サマリー');
  console.log('='.repeat(80));

  const totalErrors = results.reduce((sum, r) => sum + (r.errorCount || 0), 0);
  const totalWarnings = results.reduce((sum, r) => sum + (r.warningCount || 0), 0);
  const totalPageErrors = results.reduce((sum, r) => sum + (r.pageErrorCount || 0), 0);

  console.log(`総ページ数: ${results.length}`);
  console.log(`総コンソールエラー数: ${totalErrors}`);
  console.log(`総警告数: ${totalWarnings}`);
  console.log(`総ページエラー数: ${totalPageErrors}`);

  const pagesWithErrors = results.filter(r => !r.failed && r.errorCount > 0);
  if (pagesWithErrors.length > 0) {
    console.log('\n❌ エラーがあるページ:');
    pagesWithErrors.forEach(r => {
      console.log(`  - ${r.name}: エラー${r.errorCount}件`);
    });
  }

  const authPages = results.filter(r => r.requiresAuth && r.isRedirected);
  if (authPages.length > 0) {
    console.log('\n🔐 認証が必要なページ（リダイレクトされました）:');
    authPages.forEach(r => {
      console.log(`  - ${r.name}`);
    });
    console.log('\n⚠️ これらのページは認証後に手動でテストする必要があります。');
  }

  console.log('\n✅ チェック完了');
}

main().catch(console.error);
