#!/usr/bin/env node

/**
 * window.sbReadyの詳細状態チェック
 */

const puppeteer = require('puppeteer');

async function checkSbReadyStatus() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const url = 'https://lifex-btob-9noixxmnn-ghouse-developments-projects.vercel.app/plans.html';

        console.log('🔍 window.sbReady 詳細チェック');
        console.log(`URL: ${url}\n`);
        console.log('='.repeat(60));

        const page = await browser.newPage();

        // コンソールメッセージを収集
        const consoleMessages = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push({ type: msg.type(), text });
            console.log(`[${msg.type().toUpperCase()}] ${text}`);
        });

        // ページを読み込み
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 15000
        });

        // 初期化を待つ
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 詳細な状態確認
        const state = await page.evaluate(() => {
            return {
                // window.sbReady の状態
                sbReady: {
                    exists: typeof window.sbReady !== 'undefined',
                    type: typeof window.sbReady,
                    isPromise: window.sbReady instanceof Promise,
                    value: window.sbReady ? 'defined' : 'undefined'
                },
                // window.supabase の状態
                supabase: {
                    exists: typeof window.supabase !== 'undefined',
                    type: typeof window.supabase,
                    hasFrom: !!(window.supabase && window.supabase.from),
                    hasAuth: !!(window.supabase && window.supabase.auth)
                },
                // スクリプトの読み込み状態
                scripts: Array.from(document.querySelectorAll('script')).map(s => ({
                    src: s.src,
                    type: s.type
                }))
            };
        });

        console.log('\n' + '='.repeat(60));
        console.log('📊 状態サマリー');
        console.log('='.repeat(60));
        console.log('\n📦 window.sbReady:');
        console.log(`  存在: ${state.sbReady.exists ? '✅' : '❌'}`);
        console.log(`  タイプ: ${state.sbReady.type}`);
        console.log(`  Promise: ${state.sbReady.isPromise ? '✅' : '❌'}`);

        console.log('\n📦 window.supabase:');
        console.log(`  存在: ${state.supabase.exists ? '✅' : '❌'}`);
        console.log(`  タイプ: ${state.supabase.type}`);
        console.log(`  .from: ${state.supabase.hasFrom ? '✅' : '❌'}`);
        console.log(`  .auth: ${state.supabase.hasAuth ? '✅' : '❌'}`);

        console.log('\n📜 読み込まれたスクリプト:');
        state.scripts.filter(s => s.src.includes('supabase') || s.type === 'module').forEach(s => {
            console.log(`  ${s.type || 'script'}: ${s.src || '(inline)'}`);
        });

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ エラー:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

checkSbReadyStatus().catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
});
