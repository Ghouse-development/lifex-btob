#!/usr/bin/env node

/**
 * admin-faq.htmlのランタイムエラーテスト
 */

const puppeteer = require('puppeteer');

async function testAdminFaq() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();

        // コンソールエラーを収集
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // ページエラーを収集
        const pageErrors = [];
        page.on('pageerror', error => {
            pageErrors.push(error.message);
        });

        console.log('🔍 admin-faq.htmlをテスト中...\n');

        // ページを読み込み
        await page.goto('http://localhost:3000/admin-faq.html', {
            waitUntil: 'networkidle0',
            timeout: 10000
        });

        // 少し待機してJavaScriptが実行されるのを待つ
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('='.repeat(60));
        console.log('📊 テスト結果');
        console.log('='.repeat(60));

        // エラーチェック
        const hasImportMetaError = consoleErrors.some(err =>
            err.includes('import.meta') || err.includes('VITE_SUPABASE')
        );

        const hasSupabaseAPIError = pageErrors.some(err =>
            err.includes('window.supabaseAPI') || err.includes('reading \'faq\'')
        );

        const hasMultipleClientWarning = consoleErrors.some(err =>
            err.includes('multiple GoTrueClient instances')
        );

        if (hasImportMetaError) {
            console.log('❌ import.meta.envエラーが発生しています');
            consoleErrors.filter(err => err.includes('import.meta') || err.includes('VITE_SUPABASE')).forEach(err => {
                console.log(`   ${err}`);
            });
        } else {
            console.log('✅ import.meta.envエラーなし');
        }

        if (hasSupabaseAPIError) {
            console.log('❌ window.supabaseAPIエラーが発生しています');
            pageErrors.filter(err => err.includes('window.supabaseAPI') || err.includes('reading \'faq\'')).forEach(err => {
                console.log(`   ${err}`);
            });
        } else {
            console.log('✅ window.supabaseAPIエラーなし');
        }

        if (hasMultipleClientWarning) {
            console.log('⚠️  複数のSupabaseクライアントインスタンス警告あり');
        } else {
            console.log('✅ Supabaseクライアント多重初期化なし');
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 すべてのコンソールメッセージ');
        console.log('='.repeat(60));

        if (consoleErrors.length === 0 && pageErrors.length === 0) {
            console.log('✅ エラーなし！');
        } else {
            if (consoleErrors.length > 0) {
                console.log('\nコンソールエラー:');
                consoleErrors.forEach(err => console.log(`  ❌ ${err}`));
            }
            if (pageErrors.length > 0) {
                console.log('\nページエラー:');
                pageErrors.forEach(err => console.log(`  ❌ ${err}`));
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('総合結果');
        console.log('='.repeat(60));

        const totalIssues = (hasImportMetaError ? 1 : 0) + (hasSupabaseAPIError ? 1 : 0);

        if (totalIssues === 0) {
            console.log('🎉 すべての修正が成功しました！');
            process.exit(0);
        } else {
            console.log(`❌ ${totalIssues}件の問題が残っています`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ テストエラー:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testAdminFaq().catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
});
