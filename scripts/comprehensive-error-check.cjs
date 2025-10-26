#!/usr/bin/env node

/**
 * 包括的エラーチェック
 * - コンソールエラー
 * - ネットワークエラー
 * - JavaScript実行エラー
 * - Supabase初期化エラー
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PAGES_TO_CHECK = [
    'index.html',
    'plans.html',
    'plan-detail.html?id=test',
    'matrix.html',
    'design.html',
    'rules.html',
    'downloads.html',
    'faq.html',
    'admin.html',
    'admin-plans.html',
    'admin-report.html',
    'admin-downloads.html',
    'admin-faq.html',
    'admin-rules.html',
    'admin-notifications.html',
    'admin-users.html',
    'admin-profile.html',
    'admin-system.html'
];

const BASE_URL = 'http://localhost:3000';

async function checkPage(browser, url, pageName) {
    const page = await browser.newPage();
    const errors = {
        console: [],
        network: [],
        pageErrors: [],
        supabase: [],
        performance: {}
    };

    // コンソールメッセージを収集
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.console.push({
                text: msg.text(),
                location: msg.location()
            });
        }
    });

    // ページエラーを収集
    page.on('pageerror', error => {
        errors.pageErrors.push({
            message: error.message,
            stack: error.stack
        });
    });

    // ネットワークエラーを収集
    page.on('requestfailed', request => {
        errors.network.push({
            url: request.url(),
            method: request.method(),
            failure: request.failure()?.errorText || 'Unknown error'
        });
    });

    try {
        const startTime = Date.now();

        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 15000
        });

        const loadTime = Date.now() - startTime;
        errors.performance.loadTime = loadTime;

        // Supabase初期化チェック
        await new Promise(resolve => setTimeout(resolve, 2000));

        const supabaseCheck = await page.evaluate(() => {
            return {
                supabaseExists: !!window.supabase,
                supabaseClientExists: !!window.supabaseClient,
                sbReadyExists: !!window.sbReady,
                hasAuthManager: !!window.authManager
            };
        });

        if (!supabaseCheck.supabaseExists && !supabaseCheck.supabaseClientExists) {
            errors.supabase.push('Supabase client not initialized');
        }

        return {
            success: errors.console.length === 0 &&
                     errors.pageErrors.length === 0 &&
                     errors.network.length === 0,
            errors,
            supabaseCheck
        };

    } catch (error) {
        errors.pageErrors.push({
            message: `Navigation error: ${error.message}`,
            stack: error.stack
        });

        return {
            success: false,
            errors,
            supabaseCheck: null
        };
    } finally {
        await page.close();
    }
}

async function main() {
    console.log('🔍 包括的エラーチェック開始\n');
    console.log(`チェック対象: ${PAGES_TO_CHECK.length}ページ\n`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];
    const failedPages = [];

    for (const pagePath of PAGES_TO_CHECK) {
        const url = `${BASE_URL}/${pagePath}`;
        process.stdout.write(`📄 ${pagePath.padEnd(40)} ... `);

        try {
            const result = await checkPage(browser, url, pagePath);
            results.push({ page: pagePath, ...result });

            if (result.success) {
                console.log('✅ OK');
            } else {
                console.log('❌ エラー検出');
                failedPages.push(pagePath);
            }
        } catch (error) {
            console.log(`❌ チェック失敗: ${error.message}`);
            failedPages.push(pagePath);
            results.push({
                page: pagePath,
                success: false,
                errors: {
                    console: [],
                    network: [],
                    pageErrors: [{ message: error.message, stack: error.stack }],
                    supabase: [],
                    performance: {}
                }
            });
        }
    }

    await browser.close();

    // 結果レポート
    console.log('\n' + '='.repeat(80));
    console.log('📊 チェック結果サマリー');
    console.log('='.repeat(80));

    const totalPages = results.length;
    const successPages = results.filter(r => r.success).length;
    const failedPagesCount = totalPages - successPages;

    console.log(`\n総ページ数: ${totalPages}`);
    console.log(`成功: ${successPages} ✅`);
    console.log(`失敗: ${failedPagesCount} ❌`);

    if (failedPagesCount > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('❌ エラー詳細');
        console.log('='.repeat(80));

        results.forEach(result => {
            if (!result.success) {
                console.log(`\n📄 ${result.page}`);
                console.log('-'.repeat(80));

                if (result.errors.console.length > 0) {
                    console.log('\n🔴 コンソールエラー:');
                    result.errors.console.forEach((err, i) => {
                        console.log(`  ${i + 1}. ${err.text}`);
                        if (err.location) {
                            console.log(`     at ${err.location.url}:${err.location.lineNumber}`);
                        }
                    });
                }

                if (result.errors.pageErrors.length > 0) {
                    console.log('\n🔴 ページエラー:');
                    result.errors.pageErrors.forEach((err, i) => {
                        console.log(`  ${i + 1}. ${err.message}`);
                    });
                }

                if (result.errors.network.length > 0) {
                    console.log('\n🔴 ネットワークエラー:');
                    result.errors.network.forEach((err, i) => {
                        console.log(`  ${i + 1}. ${err.method} ${err.url}`);
                        console.log(`     Error: ${err.failure}`);
                    });
                }

                if (result.errors.supabase.length > 0) {
                    console.log('\n🔴 Supabaseエラー:');
                    result.errors.supabase.forEach((err, i) => {
                        console.log(`  ${i + 1}. ${err}`);
                    });
                }

                if (result.supabaseCheck) {
                    console.log('\n📊 Supabase状態:');
                    console.log(`  window.supabase: ${result.supabaseCheck.supabaseExists ? '✅' : '❌'}`);
                    console.log(`  window.supabaseClient: ${result.supabaseCheck.supabaseClientExists ? '✅' : '❌'}`);
                    console.log(`  window.sbReady: ${result.supabaseCheck.sbReadyExists ? '✅' : '❌'}`);
                    console.log(`  authManager: ${result.supabaseCheck.hasAuthManager ? '✅' : '❌'}`);
                }
            }
        });

        // JSON形式でも保存
        const reportPath = path.join(process.cwd(), 'error-check-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`\n📝 詳細レポート: ${reportPath}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 パフォーマンス');
    console.log('='.repeat(80));

    results.forEach(result => {
        if (result.errors.performance.loadTime) {
            const loadTime = result.errors.performance.loadTime;
            const status = loadTime < 3000 ? '🟢' : loadTime < 5000 ? '🟡' : '🔴';
            console.log(`${status} ${result.page.padEnd(40)} ${loadTime}ms`);
        }
    });

    if (failedPagesCount > 0) {
        console.log('\n❌ エラーが検出されました');
        process.exit(1);
    } else {
        console.log('\n✅ すべてのページでエラーは検出されませんでした');
        process.exit(0);
    }
}

main().catch(error => {
    console.error('❌ チェック実行エラー:', error);
    process.exit(1);
});
