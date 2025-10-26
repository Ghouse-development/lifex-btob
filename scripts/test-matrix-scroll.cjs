#!/usr/bin/env node

/**
 * 間取マトリックスのスクロール動作テスト
 */

const puppeteer = require('puppeteer');

async function testMatrixScroll() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();

        // デスクトップサイズで表示
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('🔍 間取マトリックスのスクロール動作を確認中...\n');

        const url = 'https://lifex-btob-o96hjd6m5-ghouse-developments-projects.vercel.app/matrix.html';

        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Alpine.jsの初期化とデータ読み込みを待機
        await page.waitForFunction(() => {
            return window.Alpine &&
                   document.querySelector('.matrix-container') &&
                   !document.querySelector('[x-data]').__x?.$data?.loading;
        }, { timeout: 10000 }).catch(() => {
            console.log('⚠️ Alpine.js初期化の完全な待機タイムアウト、続行します...');
        });

        // 追加の待機時間
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('='.repeat(70));
        console.log('📊 マトリックステーブルの構造分析');
        console.log('='.repeat(70));

        // テーブル構造を分析
        const matrixInfo = await page.evaluate(() => {
            const container = document.querySelector('.matrix-container');
            const table = container?.querySelector('table');
            const stickyHeaders = document.querySelectorAll('.sticky');

            if (!container || !table) {
                return { error: 'マトリックステーブルが見つかりません' };
            }

            // ヘッダー行の分析
            const headerRow = table.querySelector('thead tr');
            const headerCells = headerRow ? headerRow.querySelectorAll('th') : [];

            // 各ヘッダーセルのスタイルを確認
            const headerStyles = Array.from(headerCells).map((cell, index) => {
                const computed = window.getComputedStyle(cell);
                return {
                    index,
                    text: cell.textContent.trim().substring(0, 20),
                    position: computed.position,
                    top: computed.top,
                    left: computed.left,
                    zIndex: computed.zIndex,
                    classes: cell.className
                };
            });

            // 左列セルの分析
            const leftCells = table.querySelectorAll('tbody tr td:first-child');
            const leftCellStyles = Array.from(leftCells).slice(0, 3).map((cell, index) => {
                const computed = window.getComputedStyle(cell);
                return {
                    index,
                    text: cell.textContent.trim().substring(0, 20),
                    position: computed.position,
                    left: computed.left,
                    zIndex: computed.zIndex,
                    classes: cell.className
                };
            });

            return {
                containerOverflow: window.getComputedStyle(container).overflowX,
                tableWidth: table.offsetWidth,
                containerWidth: container.offsetWidth,
                stickyElementsCount: stickyHeaders.length,
                headerCount: headerCells.length,
                leftColumnCount: leftCells.length,
                headerStyles,
                leftCellStyles
            };
        });

        if (matrixInfo.error) {
            console.log('❌', matrixInfo.error);
            process.exit(1);
        }

        console.log('\n📐 コンテナ情報:');
        console.log(`  Overflow-X: ${matrixInfo.containerOverflow}`);
        console.log(`  テーブル幅: ${matrixInfo.tableWidth}px`);
        console.log(`  コンテナ幅: ${matrixInfo.containerWidth}px`);
        console.log(`  スクロール必要: ${matrixInfo.tableWidth > matrixInfo.containerWidth ? 'はい ✅' : 'いいえ ❌'}`);

        console.log('\n📌 固定要素:');
        console.log(`  sticky要素数: ${matrixInfo.stickyElementsCount}`);
        console.log(`  ヘッダー列数: ${matrixInfo.headerCount}`);
        console.log(`  左列セル数: ${matrixInfo.leftColumnCount}`);

        console.log('\n🔝 ヘッダー行の固定状態:');
        matrixInfo.headerStyles.forEach(style => {
            const isFixed = style.position === 'sticky' || style.position === 'fixed';
            const icon = isFixed ? '📌' : '⚠️';
            console.log(`  ${icon} セル${style.index}: "${style.text}"`);
            console.log(`     position: ${style.position}, left: ${style.left}, z-index: ${style.zIndex}`);
            if (style.classes) {
                console.log(`     classes: ${style.classes}`);
            }
        });

        console.log('\n⬅️ 左列の固定状態:');
        matrixInfo.leftCellStyles.forEach(style => {
            const isFixed = style.position === 'sticky' || style.position === 'fixed';
            const icon = isFixed ? '📌' : '⚠️';
            console.log(`  ${icon} 行${style.index}: "${style.text}"`);
            console.log(`     position: ${style.position}, left: ${style.left}, z-index: ${style.zIndex}`);
        });

        console.log('\n' + '='.repeat(70));
        console.log('🎯 改善ポイント');
        console.log('='.repeat(70));

        const issues = [];

        // ヘッダー行のtop固定チェック
        const hasTopStickyHeaders = matrixInfo.headerStyles.some(s =>
            s.position === 'sticky' && s.top !== 'auto'
        );

        if (!hasTopStickyHeaders) {
            issues.push({
                severity: '🔴 重要',
                issue: 'ヘッダー行が縦スクロール時に固定されていません',
                fix: 'thead th に sticky top-0 を追加'
            });
        }

        // 左列の固定チェック
        const hasLeftStickyColumns = matrixInfo.leftCellStyles.every(s =>
            s.position === 'sticky'
        );

        if (!hasLeftStickyColumns) {
            issues.push({
                severity: '🟡 中',
                issue: '左列の一部が固定されていません',
                fix: 'すべての左列セルに sticky left-0 を適用'
            });
        }

        if (issues.length === 0) {
            console.log('\n✅ スクロール固定は適切に設定されています');
        } else {
            console.log('');
            issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.severity}`);
                console.log(`   問題: ${issue.issue}`);
                console.log(`   修正: ${issue.fix}`);
                console.log('');
            });
        }

        process.exit(issues.length > 0 ? 1 : 0);

    } catch (error) {
        console.error('❌ テストエラー:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testMatrixScroll().catch(error => {
    console.error('❌ 実行エラー:', error);
    process.exit(1);
});
