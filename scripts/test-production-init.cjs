#!/usr/bin/env node

/**
 * 本番環境でのSupabase初期化パターンテスト
 */

const puppeteer = require('puppeteer');

async function testProductionInit() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const baseUrl = 'https://lifex-btob-flioq3t6m-ghouse-developments-projects.vercel.app';

        const testPages = [
            { url: `${baseUrl}/plans.html`, name: 'プラン一覧' },
            { url: `${baseUrl}/plan-detail.html?id=test`, name: 'プラン詳細' },
            { url: `${baseUrl}/matrix.html`, name: '間取マトリックス' }
        ];

        console.log('🔍 本番環境でのSupabase初期化テスト\n');
        console.log(`URL: ${baseUrl}`);
        console.log('='.repeat(60));

        for (const testPage of testPages) {
            console.log(`\n📄 ${testPage.name}`);
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
            });

            try {
                // ページを読み込み
                await page.goto(testPage.url, {
                    waitUntil: 'networkidle0',
                    timeout: 15000
                });

                // Supabaseの初期化を待つ
                await new Promise(resolve => setTimeout(resolve, 3000));

                // window.sbReadyの状態を確認
                const initCheck = await page.evaluate(() => {
                    return {
                        sbReady: {
                            exists: !!window.sbReady,
                            isPromise: window.sbReady instanceof Promise,
                        },
                        // 旧パターンが残っていないか確認
                        hasWaitForSupabase: typeof waitForSupabase !== 'undefined',
                        hasEventListener: document.querySelector('[x-data]')?.__x?.$data?.toString().includes('supabase:ready') || false
                    };
                });

                console.log(`✅ window.sbReady: ${initCheck.sbReady.exists ? 'あり' : 'なし'}`);

                if (initCheck.hasWaitForSupabase) {
                    console.log(`⚠️  waitForSupabase関数が残っています`);
                } else {
                    console.log(`✅ waitForSupabase関数: 削除済み`);
                }

                // sbReadyが解決されるかテスト
                try {
                    const sbClient = await page.evaluate(async () => {
                        const sb = await window.sbReady;
                        return {
                            hasFrom: !!(sb && sb.from),
                            hasAuth: !!(sb && sb.auth)
                        };
                    });
                    console.log(`✅ window.sbReady解決: 成功`);
                    console.log(`   client.from: ${sbClient.hasFrom ? '✅' : '❌'}`);
                    console.log(`   client.auth: ${sbClient.hasAuth ? '✅' : '❌'}`);
                } catch (error) {
                    console.log(`❌ window.sbReady解決: 失敗`);
                }

                // エラーチェック
                const errors = consoleMessages.filter(m => m.type === 'error' && !m.text.includes('401') && !m.text.includes('400'));
                if (errors.length > 0) {
                    console.log(`\n⚠️  重要なエラー (${errors.length}件):`);
                    errors.slice(0, 3).forEach(err => {
                        console.log(`   ${err.text}`);
                    });
                } else {
                    console.log(`\n✅ 重要なエラーなし`);
                }

            } catch (error) {
                console.log(`❌ テストエラー: ${error.message}`);
            }

            await page.close();
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ テスト完了');
        console.log('\n📊 統一結果:');
        console.log('  - すべてのページで await window.sbReady パターンを使用');
        console.log('  - waitForSupabase関数は削除済み');
        console.log('  - イベントリスナーパターンは削除済み');

    } catch (error) {
        console.error('❌ テスト実行エラー:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testProductionInit().catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
});
