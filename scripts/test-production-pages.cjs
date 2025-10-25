/**
 * 本番環境の主要ページをテストするスクリプト
 *
 * 各ページにアクセスして、JavaScriptエラーやSupabase接続エラーをシミュレート確認
 */

const https = require('https');

const BASE_URL = 'https://lifex-btob.vercel.app';

// テスト対象ページ
const testPages = [
    { path: '/', name: 'トップページ' },
    { path: '/plans.html', name: 'プラン一覧' },
    { path: '/matrix.html', name: '間取マトリックス' },
    { path: '/rules.html', name: 'ルール一覧' },
    { path: '/faq.html', name: 'FAQ' },
    { path: '/admin-login.html', name: '管理者ログイン' },
    { path: '/admin-plans.html', name: 'プラン管理' },
    { path: '/debug-faq-comprehensive.html', name: 'FAQ診断ツール' }
];

console.log('🌐 本番環境ページテスト開始\n');
console.log(`📍 対象: ${BASE_URL}\n`);

let passedCount = 0;
let failedCount = 0;

async function testPage(page) {
    return new Promise((resolve) => {
        const url = `${BASE_URL}${page.path}`;

        https.get(url, (res) => {
            const { statusCode } = res;
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const result = {
                    name: page.name,
                    path: page.path,
                    statusCode,
                    issues: []
                };

                // ステータスコードチェック
                if (statusCode !== 200) {
                    result.issues.push(`❌ HTTPエラー: ${statusCode}`);
                    failedCount++;
                } else {
                    // HTMLコンテンツの基本チェック
                    if (!data.includes('<!DOCTYPE html>')) {
                        result.issues.push('⚠️  HTMLドキュメントとして認識されない');
                    }

                    // Supabase関連のチェック
                    if (data.includes('supabase') || data.includes('Supabase')) {
                        if (!data.includes('supabase.co') && !data.includes('createClient')) {
                            result.issues.push('⚠️  Supabase参照があるが初期化コードが見当たらない');
                        }
                    }

                    // エラーメッセージの有無
                    if (data.includes('Error:') || data.includes('エラー：')) {
                        result.issues.push('⚠️  エラーメッセージが含まれている');
                    }

                    if (result.issues.length === 0) {
                        result.issues.push('✅ 正常');
                        passedCount++;
                    } else {
                        failedCount++;
                    }
                }

                resolve(result);
            });
        }).on('error', (err) => {
            failedCount++;
            resolve({
                name: page.name,
                path: page.path,
                statusCode: 0,
                issues: [`❌ 接続エラー: ${err.message}`]
            });
        });
    });
}

async function runTests() {
    const results = [];

    for (const page of testPages) {
        const result = await testPage(page);
        results.push(result);

        // 結果表示
        console.log(`📄 ${result.name} (${result.path})`);
        console.log(`   ステータス: ${result.statusCode}`);
        result.issues.forEach(issue => {
            console.log(`   ${issue}`);
        });
        console.log('');

        // サーバー負荷軽減のため少し待つ
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('━'.repeat(50));
    console.log(`\n📊 テスト結果サマリー`);
    console.log(`✅ 成功: ${passedCount}/${testPages.length}`);
    console.log(`❌ 失敗: ${failedCount}/${testPages.length}`);

    if (failedCount > 0) {
        console.log(`\n⚠️  ${failedCount}個のページで問題が検出されました`);
        console.log('詳細は上記のログを確認してください\n');
    } else {
        console.log(`\n✅ 全てのページが正常です\n`);
    }

    return results;
}

runTests().catch(console.error);
