#!/usr/bin/env node

/**
 * 認証後の管理画面コンソールエラーチェック
 *
 * 使用方法:
 * node scripts/check-admin-with-auth.cjs <email> <password>
 *
 * または環境変数:
 * ADMIN_EMAIL=xxx ADMIN_PASSWORD=xxx node scripts/check-admin-with-auth.cjs
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'https://lifex-btob.vercel.app';
const LOGIN_URL = `${BASE_URL}/admin-login.html`;

// 認証情報を取得
const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com';
const password = process.argv[3] || process.env.ADMIN_PASSWORD || '';

if (!password) {
  console.error('❌ パスワードが指定されていません');
  console.error('使用方法: node scripts/check-admin-with-auth.cjs <email> <password>');
  console.error('または環境変数: ADMIN_EMAIL=xxx ADMIN_PASSWORD=xxx node scripts/check-admin-with-auth.cjs');
  process.exit(1);
}

const pages = [
  { path: '/admin-rules.html', name: 'ルール管理' },
  { path: '/admin.html', name: '管理ホーム' },
  { path: '/admin-downloads.html', name: 'ダウンロード管理' },
  { path: '/admin-faq.html', name: 'FAQ管理' },
  { path: '/admin-notifications.html', name: '通知管理' },
  { path: '/admin-users.html', name: 'ユーザー管理' },
  { path: '/admin-profile.html', name: 'プロフィール管理' },
  { path: '/admin-report.html', name: 'レポート' }
];

async function login(page) {
  console.log('🔐 ログイン中...');
  console.log(`   Email: ${email}`);

  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

  // Alpine.jsの初期化を待つ
  await new Promise(resolve => setTimeout(resolve, 2000));

  // メールアドレスとパスワードを入力
  await page.type('#email', email, { delay: 100 });
  await page.type('#password', password, { delay: 100 });

  // ログインボタンをクリック
  await page.click('button[type="submit"]');

  // ログイン処理を待つ（長めに設定）
  await new Promise(resolve => setTimeout(resolve, 5000));

  const currentUrl = page.url();

  console.log(`   現在のURL: ${currentUrl}`);

  if (currentUrl.includes('admin-login')) {
    console.error('❌ ログイン失敗: まだログインページにいます');
    console.error('   認証情報を確認してください');

    // エラーメッセージを取得
    const errorMessage = await page.evaluate(() => {
      const errorDiv = document.querySelector('[x-show="errorMessage"]');
      if (errorDiv && errorDiv.style.display !== 'none') {
        return errorDiv.textContent.trim();
      }
      return null;
    });

    if (errorMessage) {
      console.error(`   エラー: ${errorMessage}`);
    }

    return false;
  }

  console.log('✅ ログイン成功');
  return true;
}

async function checkPageWithAuth(page, pagePath, pageName) {
  const consoleMessages = [];
  const pageErrors = [];
  const requestErrors = [];
  const failedRequests = [];

  // イベントリスナーをクリア
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.removeAllListeners('requestfailed');
  page.removeAllListeners('response');

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
    const isRedirected = !finalUrl.includes(pagePath);

    // 真のエラーをフィルタリング
    const realErrors = consoleMessages.filter(msg =>
      msg.type === 'error' &&
      !msg.text.includes('ERR_ABORTED') &&
      !msg.text.includes('Failed to load resource') &&
      !msg.text.includes('favicon.ico')
    );

    // 警告をフィルタリング
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');

    return {
      name: pageName,
      path: pagePath,
      url,
      finalUrl,
      isRedirected,
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
    return {
      name: pageName,
      path: pagePath,
      error: error.message,
      failed: true
    };
  }
}

async function main() {
  console.log('🔍 認証後の管理画面コンソールエラーチェック開始...\n');
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // ログイン
  const loginSuccess = await login(page);

  if (!loginSuccess) {
    await browser.close();
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log('📄 各ページをチェック中...');
  console.log('='.repeat(80));

  const results = [];

  for (const pageInfo of pages) {
    console.log(`\n📄 チェック中: ${pageInfo.name} (${pageInfo.path})`);
    const result = await checkPageWithAuth(page, pageInfo.path, pageInfo.name);
    results.push(result);

    if (result.failed) {
      console.log(`   ❌ ページロードエラー: ${result.error}`);
    } else {
      console.log(`   最終URL: ${result.finalUrl}`);
      if (result.isRedirected) {
        console.log(`   ⚠️ リダイレクトされました`);
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
    if (result.failed) continue;

    const hasIssues = result.errorCount > 0 || result.warningCount > 0 || result.pageErrorCount > 0;

    if (!hasIssues) continue;

    console.log(`\n### ${result.name} ###`);
    console.log(`パス: ${result.path}`);

    if (result.errorCount > 0) {
      console.log('\n❌ コンソールエラー:');
      result.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`);
        if (err.location && err.location.url) {
          console.log(`     場所: ${err.location.url}:${err.location.lineNumber || '?'}`);
        }
      });
    }

    if (result.warningCount > 0) {
      console.log('\n⚠️ 警告 (最初の10件):');
      result.warnings.slice(0, 10).forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.text}`);
      });
      if (result.warningCount > 10) {
        console.log(`  ... 他 ${result.warningCount - 10} 件`);
      }
    }

    if (result.pageErrorCount > 0) {
      console.log('\n💥 ページエラー:');
      result.pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.message}`);
        if (err.stack) {
          const stackLines = err.stack.split('\n');
          console.log(`     スタック: ${stackLines[0]}`);
          if (stackLines.length > 1) {
            console.log(`              ${stackLines[1]}`);
          }
        }
      });
    }

    if (result.failedRequestCount > 0) {
      console.log('\n🔴 失敗したリクエスト (最初の5件):');
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
  } else {
    console.log('\n✅ エラーは検出されませんでした');
  }

  const pagesWithWarnings = results.filter(r => !r.failed && r.warningCount > 0);
  if (pagesWithWarnings.length > 0) {
    console.log('\n⚠️ 警告があるページ:');
    pagesWithWarnings.forEach(r => {
      console.log(`  - ${r.name}: 警告${r.warningCount}件`);
    });
  }

  console.log('\n✅ チェック完了');
}

main().catch(console.error);
