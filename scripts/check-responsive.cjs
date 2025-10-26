#!/usr/bin/env node

/**
 * レスポンシブデザインのチェック
 */

const puppeteer = require('puppeteer');

const pages = [
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
    'admin-plans-new.html',
    'admin-report.html'
];

const viewports = [
    { name: 'Mobile', width: 375, height: 667 },    // iPhone SE
    { name: 'Tablet', width: 768, height: 1024 },   // iPad
    { name: 'Desktop', width: 1920, height: 1080 }  // Desktop
];

async function checkResponsive() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const baseUrl = 'https://lifex-btob-fqtpt0a5k-ghouse-developments-projects.vercel.app';
        const issues = [];

        for (const pagePath of pages) {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`📱 ${pagePath}`);
            console.log('='.repeat(70));

            for (const viewport of viewports) {
                const page = await browser.newPage();
                await page.setViewport(viewport);

                try {
                    await page.goto(`${baseUrl}/${pagePath}`, {
                        waitUntil: 'networkidle0',
                        timeout: 15000
                    });

                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const responsiveIssues = await page.evaluate((viewportName) => {
                        const problems = [];

                        // 横スクロールチェック
                        const bodyWidth = document.body.scrollWidth;
                        const viewportWidth = window.innerWidth;
                        if (bodyWidth > viewportWidth + 10) {
                            problems.push({
                                type: '横スクロール',
                                message: `ページ幅${bodyWidth}px > ビューポート${viewportWidth}px`
                            });
                        }

                        // テーブルのオーバーフローチェック
                        const tables = document.querySelectorAll('table');
                        tables.forEach((table, index) => {
                            const tableWidth = table.offsetWidth;
                            const parentWidth = table.parentElement.offsetWidth;
                            const hasOverflow = table.parentElement.classList.contains('overflow-x-auto') ||
                                              table.parentElement.classList.contains('overflow-auto');

                            if (tableWidth > parentWidth && !hasOverflow) {
                                problems.push({
                                    type: 'テーブルオーバーフロー',
                                    message: `テーブル${index + 1}: ${tableWidth}px > 親${parentWidth}px (overflow未対応)`
                                });
                            }
                        });

                        // 小さいボタンチェック (モバイルのみ)
                        if (viewportName === 'Mobile') {
                            const buttons = document.querySelectorAll('button, a.btn');
                            buttons.forEach((btn, index) => {
                                const rect = btn.getBoundingClientRect();
                                if (rect.height < 44) {
                                    problems.push({
                                        type: 'ボタンサイズ',
                                        message: `ボタン${index + 1}: 高さ${Math.round(rect.height)}px < 推奨44px`
                                    });
                                }
                            });
                        }

                        // 固定幅要素チェック
                        const fixedWidthElements = document.querySelectorAll('[style*="width:"]');
                        fixedWidthElements.forEach((el, index) => {
                            const style = el.getAttribute('style');
                            if (style && style.includes('width:') && !style.includes('%')) {
                                const match = style.match(/width:\s*(\d+)px/);
                                if (match && parseInt(match[1]) > viewportWidth) {
                                    problems.push({
                                        type: '固定幅要素',
                                        message: `要素${index + 1}: ${match[1]}px > ビューポート${viewportWidth}px`
                                    });
                                }
                            }
                        });

                        return problems;
                    }, viewport.name);

                    if (responsiveIssues.length > 0) {
                        console.log(`\n  ${viewport.name} (${viewport.width}x${viewport.height}):`);
                        responsiveIssues.forEach(issue => {
                            console.log(`    ❌ ${issue.type}: ${issue.message}`);
                            issues.push({
                                page: pagePath,
                                viewport: viewport.name,
                                ...issue
                            });
                        });
                    } else {
                        console.log(`  ✅ ${viewport.name} (${viewport.width}x${viewport.height})`);
                    }

                } catch (error) {
                    console.log(`  ⚠️ ${viewport.name}: ${error.message}`);
                } finally {
                    await page.close();
                }
            }
        }

        console.log(`\n${'='.repeat(70)}`);
        console.log('📊 サマリー');
        console.log('='.repeat(70));
        console.log(`総問題数: ${issues.length}`);

        const issuesByType = {};
        issues.forEach(issue => {
            issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        });

        console.log('\n問題タイプ別:');
        Object.entries(issuesByType).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}件`);
        });

        process.exit(issues.length > 0 ? 1 : 0);

    } catch (error) {
        console.error('❌ エラー:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

checkResponsive().catch(error => {
    console.error('❌ 実行エラー:', error);
    process.exit(1);
});
