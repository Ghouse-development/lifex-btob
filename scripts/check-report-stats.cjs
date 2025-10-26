#!/usr/bin/env node

/**
 * admin-report.htmlの統計データ表示チェック
 */

const puppeteer = require('puppeteer');

async function checkReportStats() {
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
            }
        });

        console.log('🔍 admin-report.html をチェック中...\n');

        // 本番環境のURLを使用
        const url = 'https://lifex-btob-6excvowt5-ghouse-developments-projects.vercel.app/admin-report.html';

        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Supabaseの初期化を待つ
        await page.waitForFunction(() => window.sbReady, { timeout: 10000 });

        // 統計データの読み込みを待つ
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('\n' + '='.repeat(60));
        console.log('📊 統計データの確認');
        console.log('='.repeat(60));

        // 統計データを取得
        const stats = await page.evaluate(() => {
            const app = Alpine.$data(document.querySelector('[x-data="reportPage"]'));
            return app ? app.stats : null;
        });

        if (stats) {
            console.log('✅ 統計データ取得成功:');
            console.log(`   登録プラン数: ${stats.totalPlans}`);
            console.log(`   今月のプラン: ${stats.plansThisMonth}`);
            console.log(`   FAQ数: ${stats.totalFaqs}`);
            console.log(`   FAQカテゴリ: ${stats.faqCategories}`);
            console.log(`   ルール数: ${stats.totalRules}`);
            console.log(`   必須ルール: ${stats.requiredRules}`);
            console.log(`   ダウンロード: ${stats.totalDownloads}`);
            console.log(`   最終バックアップ: ${stats.lastBackup}`);
        } else {
            console.log('❌ 統計データ取得失敗');
        }

        // HTML上の表示を確認
        console.log('\n' + '='.repeat(60));
        console.log('🖥️  画面表示の確認');
        console.log('='.repeat(60));

        const displayedStats = await page.evaluate(() => {
            const planCount = document.querySelector('[x-text="stats.totalPlans"]')?.textContent;
            const planMonth = document.querySelector('[x-text="stats.plansThisMonth"]')?.textContent;
            const faqCount = document.querySelector('[x-text="stats.totalFaqs"]')?.textContent;

            return {
                planCount,
                planMonth,
                faqCount
            };
        });

        console.log(`   画面表示プラン数: ${displayedStats.planCount}`);
        console.log(`   画面表示今月プラン: ${displayedStats.planMonth}`);
        console.log(`   画面表示FAQ数: ${displayedStats.faqCount}`);

        console.log('\n' + '='.repeat(60));
        console.log('📋 Supabase初期化メッセージ');
        console.log('='.repeat(60));

        const supabaseMessages = consoleMessages.filter(m =>
            m.text.includes('Supabase') || m.text.includes('sbReady')
        );

        supabaseMessages.forEach(msg => {
            const icon = msg.type === 'error' ? '❌' : msg.type === 'warn' ? '⚠️' : '✅';
            console.log(`${icon} ${msg.text}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('総合結果');
        console.log('='.repeat(60));

        const hasErrors = consoleMessages.some(m => m.type === 'error');
        const hasValidStats = stats && (
            stats.totalPlans !== undefined ||
            stats.totalFaqs !== undefined
        );

        if (hasErrors) {
            console.log('❌ コンソールエラーが検出されました');
            process.exit(1);
        } else if (!hasValidStats) {
            console.log('⚠️  統計データが取得できませんでした');
            process.exit(1);
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

checkReportStats().catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
});
