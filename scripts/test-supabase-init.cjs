#!/usr/bin/env node

/**
 * Supabase初期化統一パターンのテスト
 */

const puppeteer = require('puppeteer');

async function testSupabaseInit() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const testPages = [
            { url: 'http://localhost:3003/plans.html', name: 'プラン一覧' },
            { url: 'http://localhost:3003/plan-detail.html?id=test-id', name: 'プラン詳細' },
            { url: 'http://localhost:3003/matrix.html', name: '間取マトリックス' }
        ];

        console.log('🔍 Supabase初期化パターンのテスト\n');
        console.log('='.repeat(60));

        for (const testPage of testPages) {
            console.log(`\n📄 ${testPage.name} (${testPage.url})`);
            console.log('-'.repeat(60));

            const page = await browser.newPage();

            // コンソールメッセージを収集
            const consoleMessages = [];
            page.on('console', msg => {
                const text = msg.text();
                consoleMessages.push({ type: msg.type(), text });
            });

            // ページエラーを収集
            const pageErrors = [];
            page.on('pageerror', error => {
                pageErrors.push(error.message);
                console.log(`❌ Page Error: ${error.message}`);
            });

            try {
                // ページを読み込み
                await page.goto(testPage.url, {
                    waitUntil: 'networkidle0',
                    timeout: 10000
                });

                // Supabaseの初期化を待つ
                await new Promise(resolve => setTimeout(resolve, 2000));

                // window.sbReadyの状態を確認
                const sbReadyStatus = await page.evaluate(() => {
                    return {
                        exists: !!window.sbReady,
                        isPromise: window.sbReady instanceof Promise,
                        resolved: false
                    };
                });

                console.log(`window.sbReady 存在: ${sbReadyStatus.exists ? '✅' : '❌'}`);
                console.log(`window.sbReady タイプ: ${sbReadyStatus.isPromise ? 'Promise' : typeof window.sbReady}`);

                // sbReadyが解決されるかテスト
                try {
                    const sbClient = await page.evaluate(async () => {
                        const sb = await window.sbReady;
                        return {
                            hasFrom: !!(sb && sb.from),
                            type: typeof sb
                        };
                    });
                    console.log(`✅ window.sbReady 解決成功`);
                    console.log(`   Supabase client.from: ${sbClient.hasFrom ? '✅' : '❌'}`);
                } catch (error) {
                    console.log(`❌ window.sbReady 解決失敗: ${error.message}`);
                }

                // エラーチェック
                const errors = consoleMessages.filter(m => m.type === 'error');
                if (errors.length > 0) {
                    console.log(`\n⚠️  コンソールエラー (${errors.length}件):`);
                    errors.slice(0, 3).forEach(err => {
                        console.log(`   ${err.text}`);
                    });
                }

                if (pageErrors.length > 0) {
                    console.log(`\n❌ ページエラー (${pageErrors.length}件)`);
                } else {
                    console.log(`\n✅ ページエラーなし`);
                }

            } catch (error) {
                console.log(`❌ テストエラー: ${error.message}`);
            }

            await page.close();
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ すべてのテストが完了しました');

    } catch (error) {
        console.error('❌ テスト実行エラー:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testSupabaseInit().catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
});
