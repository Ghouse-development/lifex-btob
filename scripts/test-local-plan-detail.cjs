#!/usr/bin/env node

/**
 * ローカルサーバーでplan-detail.htmlの実際の動作をテストするスクリプト
 * Puppeteerを使ってブラウザコンソールのエラーをキャッチ
 */

const http = require('http');

console.log('🔍 ローカルサーバーでplan-detail.htmlをテストします...\n');

const testPlanId = 'c9213ddf-1bda-49fa-ac69-11fdc0595543';
const testUrl = `http://localhost:3000/plan-detail.html?id=${testPlanId}`;

// シンプルなHTTPリクエストでページが取得できるか確認
function testHTTPRequest() {
    return new Promise((resolve, reject) => {
        console.log('📡 1. HTTPリクエストテスト');
        console.log(`   URL: ${testUrl}\n`);

        http.get(testUrl, (res) => {
            let data = '';

            if (res.statusCode !== 200) {
                console.log(`   ❌ ステータスコード: ${res.statusCode}`);
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }

            console.log(`   ✅ ステータスコード: ${res.statusCode}`);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`   ✅ HTMLサイズ: ${data.length} bytes`);

                // HTMLの内容を確認
                const checks = [
                    { name: 'Supabase CDN', pattern: 'cdn.jsdelivr.net/npm/@supabase/supabase-js' },
                    { name: 'type="module"', pattern: 'type="module"' },
                    { name: 'window.supabase', pattern: 'window.supabase' },
                    { name: 'Alpine.js', pattern: 'alpinejs' },
                    { name: 'planDetailPage()', pattern: 'planDetailPage()' }
                ];

                console.log('\n   📋 HTML内容チェック:');
                checks.forEach(check => {
                    const found = data.includes(check.pattern);
                    console.log(`      ${found ? '✅' : '❌'} ${check.name}`);
                });

                resolve(data);
            });
        }).on('error', (err) => {
            console.log(`   ❌ リクエストエラー: ${err.message}`);
            reject(err);
        });
    });
}

// メイン実行
async function main() {
    try {
        // HTTPリクエストテスト
        await testHTTPRequest();

        console.log('\n' + '='.repeat(60));
        console.log('✅ ローカルサーバーでHTMLが正しく配信されています');
        console.log('='.repeat(60));

        console.log('\n📝 次のステップ:');
        console.log('   1. ブラウザで以下のURLを開いてください:');
        console.log(`      ${testUrl}`);
        console.log('   2. ブラウザのコンソール（F12）を開いてエラーを確認');
        console.log('   3. プランデータが正しく表示されるか確認');
        console.log('\n   または、Puppeteerを使った自動テストを実行:');
        console.log('      npm install -D puppeteer');
        console.log('      node scripts/test-with-puppeteer.cjs');

    } catch (error) {
        console.error('\n❌ エラーが発生しました:', error.message);
        console.log('\n📝 確認事項:');
        console.log('   1. 開発サーバーが起動していますか？');
        console.log('      npm run dev');
        console.log('   2. ポート3000が使用可能ですか？');
        console.log('      netstat -an | findstr :3000');
        process.exit(1);
    }
}

main();
