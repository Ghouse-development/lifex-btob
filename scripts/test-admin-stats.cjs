#!/usr/bin/env node

/**
 * admin.html統計データ取得テスト
 */

const puppeteer = require('puppeteer');

async function testAdminStats() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();

        // コンソールメッセージを収集
        const consoleMessages = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push({ type: msg.type(), text });
            if (msg.type() === 'error') {
                console.log(`❌ Console Error: ${text}`);
            } else if (msg.type() === 'warn') {
                console.log(`⚠️  Console Warning: ${text}`);
            }
        });

        // ページエラーを収集
        const pageErrors = [];
        page.on('pageerror', error => {
            pageErrors.push(error.message);
            console.log(`❌ Page Error: ${error.message}`);
        });

        console.log('🔍 admin.htmlをテスト中...\n');

        // ページを読み込み
        await page.goto('http://localhost:3000/admin.html', {
            waitUntil: 'networkidle0',
            timeout: 10000
        });

        // Supabaseの初期化を待つ
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n' + '='.repeat(60));
        console.log('📊 window.supabase の状態確認');
        console.log('='.repeat(60));

        // window.supabaseの状態を確認
        const supabaseStatus = await page.evaluate(() => {
            return {
                exists: !!window.supabase,
                hasFrom: !!(window.supabase && window.supabase.from),
                type: typeof window.supabase
            };
        });

        console.log(`window.supabase 存在: ${supabaseStatus.exists ? '✅' : '❌'}`);
        console.log(`window.supabase.from 存在: ${supabaseStatus.hasFrom ? '✅' : '❌'}`);
        console.log(`window.supabase タイプ: ${supabaseStatus.type}`);

        console.log('\n' + '='.repeat(60));
        console.log('📈 統計データの確認');
        console.log('='.repeat(60));

        // 統計データを取得
        await new Promise(resolve => setTimeout(resolve, 2000));

        const stats = await page.evaluate(() => {
            const app = Alpine.$data(document.querySelector('[x-data="adminMenu()"]'));
            return app ? app.stats : null;
        });

        if (stats) {
            console.log('✅ 統計データ取得成功:');
            console.log(`   プラン: ${stats.plans}`);
            console.log(`   今月更新: ${stats.plansUpdated}`);
            console.log(`   ルール: ${stats.rules}`);
            console.log(`   必須ルール: ${stats.rulesRequired}`);
            console.log(`   ダウンロード: ${stats.downloads}`);
            console.log(`   FAQ: ${stats.faqs}`);
            console.log(`   FAQカテゴリ: ${stats.faqCategories}`);
        } else {
            console.log('❌ 統計データ取得失敗');
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 コンソールメッセージ（最新10件）');
        console.log('='.repeat(60));

        const recentMessages = consoleMessages.slice(-10);
        recentMessages.forEach(msg => {
            const icon = msg.type === 'error' ? '❌' : msg.type === 'warn' ? '⚠️' : 'ℹ️';
            console.log(`${icon} ${msg.text}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('総合結果');
        console.log('='.repeat(60));

        const hasErrors = pageErrors.length > 0 || consoleMessages.some(m => m.type === 'error');
        const hasData = stats && (stats.plans > 0 || stats.rules > 0 || stats.faqs > 0);

        if (hasErrors) {
            console.log('❌ エラーが検出されました');
            process.exit(1);
        } else if (!hasData) {
            console.log('⚠️  統計データが0件です（データベースが空の可能性）');
            process.exit(0);
        } else {
            console.log('✅ すべて正常に動作しています');
            process.exit(0);
        }

    } catch (error) {
        console.error('❌ テストエラー:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testAdminStats().catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
});
