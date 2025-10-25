/**
 * 全ページのコンソールエラーをチェックするスクリプト
 *
 * 使用方法: node scripts/check-all-console-errors.cjs
 */

const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// チェック対象のページ一覧
const PAGES = [
    { name: 'トップページ', path: '/' },
    { name: 'プラン一覧', path: '/plans.html' },
    { name: 'プラン詳細', path: '/plan-detail.html?id=1' },
    { name: 'FAQ', path: '/faq.html' },
    { name: 'お問い合わせ', path: '/contact.html' },
    { name: '管理ホーム', path: '/admin.html' },
    { name: 'プラン管理', path: '/admin-plans.html' },
    { name: 'ルール管理', path: '/admin-rules.html' },
    { name: 'ダウンロード管理', path: '/admin-downloads.html' },
    { name: 'FAQ管理', path: '/admin-faq.html' },
    { name: 'お知らせ管理', path: '/admin-notifications.html' },
    { name: 'ユーザー管理', path: '/admin-users.html' },
    { name: 'プロフィール', path: '/admin-profile.html' },
    { name: 'システム管理', path: '/admin-system.html' },
    { name: 'レポート', path: '/admin-report.html' },
    { name: 'ログイン', path: '/admin-login.html' }
];

async function checkPageErrors() {
    console.log('🔍 全ページのコンソールエラーチェックを開始します...\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];

    for (const page of PAGES) {
        const pageObj = await browser.newPage();
        const errors = [];
        const warnings = [];
        const logs = [];

        // コンソールメッセージをキャプチャ
        pageObj.on('console', msg => {
            const type = msg.type();
            const text = msg.text();

            if (type === 'error') {
                errors.push(text);
            } else if (type === 'warning') {
                warnings.push(text);
            } else if (type === 'log' && (text.includes('❌') || text.includes('⚠️'))) {
                logs.push(text);
            }
        });

        // ページエラーをキャプチャ
        pageObj.on('pageerror', error => {
            errors.push(`[Page Error] ${error.message}`);
        });

        // リクエストエラーをキャプチャ
        pageObj.on('requestfailed', request => {
            errors.push(`[Network Error] ${request.url()} - ${request.failure().errorText}`);
        });

        try {
            console.log(`📄 チェック中: ${page.name} (${page.path})`);

            // ページにアクセス（タイムアウト10秒）
            await pageObj.goto(`${BASE_URL}${page.path}`, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });

            // ページがロードされるまで少し待つ
            await new Promise(resolve => setTimeout(resolve, 2000));

            results.push({
                name: page.name,
                path: page.path,
                errors: errors,
                warnings: warnings,
                logs: logs,
                success: errors.length === 0
            });

            if (errors.length === 0) {
                console.log(`   ✅ エラーなし`);
            } else {
                console.log(`   ❌ ${errors.length}件のエラー`);
            }

        } catch (error) {
            console.log(`   ❌ ページロード失敗: ${error.message}`);
            results.push({
                name: page.name,
                path: page.path,
                errors: [`ページロード失敗: ${error.message}`],
                warnings: [],
                logs: [],
                success: false
            });
        }

        await pageObj.close();
    }

    await browser.close();

    // 結果をまとめて表示
    console.log('\n=== チェック結果サマリー ===\n');

    const successPages = results.filter(r => r.success);
    const errorPages = results.filter(r => !r.success);

    console.log(`✅ エラーなし: ${successPages.length}/${results.length}ページ`);
    console.log(`❌ エラーあり: ${errorPages.length}/${results.length}ページ\n`);

    if (errorPages.length > 0) {
        console.log('=== エラー詳細 ===\n');

        for (const page of errorPages) {
            console.log(`📄 ${page.name} (${page.path})`);
            console.log(`   エラー件数: ${page.errors.length}`);

            page.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });

            if (page.warnings.length > 0) {
                console.log(`   警告件数: ${page.warnings.length}`);
                page.warnings.forEach((warning, index) => {
                    console.log(`   ${index + 1}. ${warning}`);
                });
            }

            if (page.logs.length > 0) {
                console.log(`   ログ件数: ${page.logs.length}`);
                page.logs.slice(0, 3).forEach((log, index) => {
                    console.log(`   ${index + 1}. ${log}`);
                });
            }

            console.log('');
        }
    }

    console.log('\n✅ チェック完了');

    // 終了コード
    process.exit(errorPages.length > 0 ? 1 : 0);
}

checkPageErrors().catch(error => {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
});
