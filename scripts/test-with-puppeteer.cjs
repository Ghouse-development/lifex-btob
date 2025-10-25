#!/usr/bin/env node

/**
 * Puppeteerを使ってplan-detail.htmlの実際の動作をテストするスクリプト
 * ブラウザコンソールのエラーをキャッチして、Supabaseからデータが取得できるかテスト
 */

const testPlanId = 'c9213ddf-1bda-49fa-ac69-11fdc0595543';
const testUrl = `http://localhost:3000/plan-detail.html?id=${testPlanId}`;

console.log('🔍 Puppeteerでplan-detail.htmlをテストします...\n');
console.log(`📡 テストURL: ${testUrl}\n`);

async function testWithPuppeteer() {
    let browser;
    try {
        const puppeteer = require('puppeteer');

        console.log('🚀 ブラウザを起動中...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // コンソールログとエラーを収集
        const consoleMessages = [];
        const errors = [];

        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push({ type: msg.type(), text });

            if (msg.type() === 'error') {
                console.log(`   ❌ Console Error: ${text}`);
                errors.push(text);
            } else if (text.includes('Supabase') || text.includes('supabase')) {
                console.log(`   📝 ${msg.type()}: ${text}`);
            }
        });

        page.on('pageerror', error => {
            console.log(`   ❌ Page Error: ${error.message}`);
            errors.push(error.message);
        });

        console.log('📄 ページを読み込み中...\n');
        await page.goto(testUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // ページが読み込まれるまで待機
        await new Promise(resolve => setTimeout(resolve, 3000));

        // window.supabaseが設定されているか確認
        const supabaseExists = await page.evaluate(() => {
            return {
                supabaseExists: typeof window.supabase !== 'undefined',
                supabaseHasFrom: typeof window.supabase?.from === 'function',
                supabaseReadyFlag: window.supabaseReady === true
            };
        });

        console.log('🔍 Supabase初期化状態:');
        console.log(`   ${supabaseExists.supabaseExists ? '✅' : '❌'} window.supabase が存在`);
        console.log(`   ${supabaseExists.supabaseHasFrom ? '✅' : '❌'} window.supabase.from() が利用可能`);
        console.log(`   ${supabaseExists.supabaseReadyFlag ? '✅' : '❌'} window.supabaseReady フラグ`);

        // planDetailPageのデータを確認
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pageState = await page.evaluate(() => {
            // Alpine.jsのデータを取得
            const appDiv = document.querySelector('[x-data="planDetailPage()"]');
            if (!appDiv || !appDiv._x_dataStack) {
                return { error: 'Alpine.js data not found' };
            }

            const data = appDiv._x_dataStack[0];
            return {
                loading: data.loading,
                error: data.error,
                planExists: !!data.plan,
                planName: data.plan?.name || null,
                planId: data.plan?.id || null
            };
        });

        console.log('\n📊 Alpine.js ページ状態:');
        console.log(`   loading: ${pageState.loading}`);
        console.log(`   error: ${pageState.error}`);
        console.log(`   planExists: ${pageState.planExists}`);
        if (pageState.planName) {
            console.log(`   ✅ プラン名: ${pageState.planName}`);
        }
        if (pageState.planId) {
            console.log(`   ✅ プランID: ${pageState.planId}`);
        }

        // スクリーンショットを保存
        await page.screenshot({
            path: 'test-screenshots/plan-detail-test.png',
            fullPage: true
        });
        console.log('\n📸 スクリーンショットを保存: test-screenshots/plan-detail-test.png');

        await browser.close();

        // 結果判定
        console.log('\n' + '='.repeat(60));
        if (errors.length === 0 && supabaseExists.supabaseHasFrom && pageState.planExists) {
            console.log('🎉 すべてのテストをパスしました！');
            console.log('='.repeat(60));
            console.log('\n✅ ローカル環境でplan-detail.htmlは正常に動作しています');
            console.log(`✅ Supabaseからプランデータを取得できました: ${pageState.planName}`);
            return true;
        } else {
            console.log('⚠️  いくつかの問題が見つかりました');
            console.log('='.repeat(60));

            if (errors.length > 0) {
                console.log('\n❌ エラー一覧:');
                errors.forEach(err => console.log(`   - ${err}`));
            }

            if (!supabaseExists.supabaseHasFrom) {
                console.log('\n❌ window.supabase.from() が利用できません');
            }

            if (!pageState.planExists) {
                console.log('\n❌ プランデータが取得できませんでした');
                if (pageState.error) {
                    console.log(`   エラー状態: ${pageState.error}`);
                }
            }

            return false;
        }

    } catch (error) {
        if (browser) await browser.close();

        if (error.message.includes('Cannot find module')) {
            console.log('\n❌ Puppeteerがインストールされていません');
            console.log('\n📝 次のコマンドでインストールしてください:');
            console.log('   npm install -D puppeteer');
            console.log('\nまたは、ブラウザで手動確認:');
            console.log(`   ${testUrl}`);
            process.exit(1);
        }

        throw error;
    }
}

// メイン実行
testWithPuppeteer().catch(error => {
    console.error('\n❌ テスト実行エラー:', error.message);
    process.exit(1);
});
