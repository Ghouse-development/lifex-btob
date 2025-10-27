#!/usr/bin/env node

/**
 * admin-rules.htmlページの詳細なコンソールエラーチェック
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// .env.local から環境変数を読み込む
const envContent = fs.readFileSync('.env.local', 'utf-8');
const EMAIL = envContent.match(/ADMIN_EMAIL=(.+)/)?.[1]?.trim();
const PASSWORD = envContent.match(/ADMIN_PASSWORD=(.+)/)?.[1]?.trim();

const BASE_URL = 'https://lifex-btob.vercel.app';

async function checkAdminRules() {
  console.log('🔍 admin-rules.htmlページのコンソールエラーチェック開始...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const consoleMessages = [];
  const pageErrors = [];
  const networkErrors = [];

  // コンソールメッセージをキャプチャ
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    const location = msg.location();
    consoleMessages.push({ type, text, location });

    // リアルタイムで表示
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'log' ? '📝' : 'ℹ️';
    console.log(`${prefix} [${type}] ${text}`);
  });

  // ページエラーをキャプチャ
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
    console.log(`💥 Page Error: ${error.message}`);
  });

  // ネットワークエラーをキャプチャ
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure()
    });
    console.log(`🔴 Request Failed: ${request.url()}`);
  });

  try {
    // admin-rules.htmlページに直接移動（認証は後で確認）
    console.log('📄 admin-rules.htmlにアクセス中...\n');
    await page.goto(`${BASE_URL}/admin-rules.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // ページが完全にロードされるまで待機
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Alpine.jsのデータを取得
    console.log('\n🔍 Alpine.jsデータを確認中...');
    const alpineData = await page.evaluate(() => {
      const element = document.querySelector('[x-data="adminRules"]');
      if (element && element.__x) {
        return {
          categoriesLength: element.__x.$data.categories?.length || 0,
          categories: element.__x.$data.categories || [],
          showCategoryModal: element.__x.$data.showCategoryModal,
          showRuleModal: element.__x.$data.showRuleModal
        };
      }
      return null;
    });

    console.log('\n📊 Alpine.jsデータ:');
    console.log(JSON.stringify(alpineData, null, 2));

    // DOMの状態を確認
    console.log('\n🔍 DOM状態を確認中...');
    const domState = await page.evaluate(() => {
      const categoriesList = document.getElementById('categoriesList');
      return {
        categoriesListExists: !!categoriesList,
        categoriesListHTML: categoriesList?.innerHTML.substring(0, 200),
        categoriesListChildrenCount: categoriesList?.children.length || 0
      };
    });

    console.log('📊 DOM状態:');
    console.log(JSON.stringify(domState, null, 2));

    // スクリーンショットを撮影
    await page.screenshot({ path: 'admin-rules-screenshot.png', fullPage: true });
    console.log('\n📸 スクリーンショットを保存しました: admin-rules-screenshot.png');

    // エラーサマリー
    console.log('\n' + '='.repeat(80));
    console.log('📈 サマリー');
    console.log('='.repeat(80));

    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');

    console.log(`総コンソールメッセージ: ${consoleMessages.length}`);
    console.log(`エラー: ${errors.length}`);
    console.log(`警告: ${warnings.length}`);
    console.log(`ページエラー: ${pageErrors.length}`);
    console.log(`ネットワークエラー: ${networkErrors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ エラー一覧:');
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`);
      });
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  } finally {
    await browser.close();
  }
}

checkAdminRules().catch(console.error);
