#!/usr/bin/env node

/**
 * 全管理画面ページの包括的なコンソールエラー・警告チェック
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'https://lifex-btob.vercel.app';

const pages = [
  { path: '/admin-downloads.html', name: 'ダウンロード管理' },
  { path: '/admin-faq.html', name: 'FAQ管理' },
  { path: '/admin-notifications.html', name: '通知管理' },
  { path: '/admin-users.html', name: 'ユーザー管理' },
  { path: '/admin-profile.html', name: 'プロフィール管理' },
  { path: '/admin-report.html', name: 'レポート' }
];

async function checkPage(browser, pagePath, pageName) {
  const page = await browser.newPage();

  const consoleMessages = [];
  const pageErrors = [];
  const requestErrors = [];

  // コンソールメッセージをキャプチャ
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push({ type, text });
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

    // 真のエラーをフィルタリング（ERR_ABORTED以外）
    const realErrors = consoleMessages.filter(msg =>
      msg.type === 'error' &&
      !msg.text.includes('ERR_ABORTED') &&
      !msg.text.includes('Failed to load resource')
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
      consoleCount: consoleMessages.length,
      errorCount: realErrors.length,
      warningCount: warnings.length,
      pageErrorCount: pageErrors.length,
      requestErrorCount: requestErrors.length,
      errors: realErrors,
      warnings: warnings,
      pageErrors: pageErrors,
      requestErrors: requestErrors,
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
  console.log('🔍 全管理画面ページの包括的チェック開始...\n');
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const pageInfo of pages) {
    console.log(`\n📄 チェック中: ${pageInfo.name} (${pageInfo.path})`);
    const result = await checkPage(browser, pageInfo.path, pageInfo.name);
    results.push(result);

    if (result.failed) {
      console.log(`   ❌ ページロードエラー: ${result.error}`);
    } else {
      console.log(`   URL: ${result.url}`);
      console.log(`   最終URL: ${result.finalUrl}`);
      if (result.isRedirected) {
        console.log('   ⚠️ リダイレクトされました');
      }
      console.log(`   コンソールメッセージ: ${result.consoleCount}件`);
      console.log(`   エラー: ${result.errorCount}件`);
      console.log(`   警告: ${result.warningCount}件`);
      console.log(`   ページエラー: ${result.pageErrorCount}件`);
      console.log(`   リクエストエラー: ${result.requestErrorCount}件`);
    }
  }

  await browser.close();

  // 詳細レポート
  console.log('\n' + '='.repeat(80));
  console.log('📊 詳細レポート');
  console.log('='.repeat(80));

  for (const result of results) {
    if (result.failed) continue;

    console.log(`\n### ${result.name} ###`);

    if (result.errorCount > 0) {
      console.log('\n❌ エラー:');
      result.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`);
      });
    }

    if (result.warningCount > 0) {
      console.log('\n⚠️ 警告:');
      result.warnings.forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.text}`);
      });
    }

    if (result.pageErrorCount > 0) {
      console.log('\n💥 ページエラー:');
      result.pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.message}`);
      });
    }

    // 重要なログメッセージを表示（先頭20件）
    const importantLogs = result.allConsoleMessages
      .filter(msg =>
        msg.type === 'log' &&
        (msg.text.includes('❌') || msg.text.includes('⚠️') || msg.text.includes('✅'))
      )
      .slice(0, 20);

    if (importantLogs.length > 0) {
      console.log('\n📝 重要なログ (最初の20件):');
      importantLogs.forEach((log, i) => {
        console.log(`  ${i + 1}. ${log.text}`);
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
  console.log(`総エラー数: ${totalErrors}`);
  console.log(`総警告数: ${totalWarnings}`);
  console.log(`総ページエラー数: ${totalPageErrors}`);

  const pagesWithErrors = results.filter(r => !r.failed && (r.errorCount > 0 || r.pageErrorCount > 0));
  if (pagesWithErrors.length > 0) {
    console.log('\n❌ エラーがあるページ:');
    pagesWithErrors.forEach(r => {
      console.log(`  - ${r.name}: エラー${r.errorCount}件, ページエラー${r.pageErrorCount}件`);
    });
  }

  console.log('\n✅ チェック完了');
}

main().catch(console.error);
