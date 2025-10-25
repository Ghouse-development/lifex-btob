#!/usr/bin/env node

/**
 * plan-detail.htmlの動作確認スクリプト
 * - ビルドファイルの存在確認
 * - window.supabase初期化の確認
 * - 必要なアセットの確認
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 plan-detail.html 動作確認を開始...\n');

let allTestsPassed = true;
const results = [];

// テスト1: ビルドファイルの存在確認
console.log('📦 1. ビルドファイルの確認');
const distPath = path.join(__dirname, '../dist/plan-detail.html');
if (fs.existsSync(distPath)) {
    const stats = fs.statSync(distPath);
    console.log(`  ✅ dist/plan-detail.html が存在します (${stats.size} bytes)`);
    results.push({ test: 'ビルドファイル存在', status: '✅' });
} else {
    console.log('  ❌ dist/plan-detail.html が見つかりません');
    allTestsPassed = false;
    results.push({ test: 'ビルドファイル存在', status: '❌' });
}

// テスト2: HTMLファイルの内容確認
console.log('\n📄 2. HTMLファイルの内容確認');
if (fs.existsSync(distPath)) {
    const content = fs.readFileSync(distPath, 'utf-8');

    // Supabase CDN読み込み確認
    if (content.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js')) {
        console.log('  ✅ Supabase CDNの読み込みあり');
        results.push({ test: 'Supabase CDN読み込み', status: '✅' });
    } else {
        console.log('  ❌ Supabase CDNの読み込みなし');
        allTestsPassed = false;
        results.push({ test: 'Supabase CDN読み込み', status: '❌' });
    }

    // ES moduleスクリプト確認
    if (content.includes('type="module"')) {
        console.log('  ✅ ES moduleスクリプトあり');
        results.push({ test: 'ES moduleスクリプト', status: '✅' });
    } else {
        console.log('  ⚠️  ES moduleスクリプトなし（ビルド時にバンドルされた可能性）');
        results.push({ test: 'ES moduleスクリプト', status: '⚠️' });
    }

    // window.supabase使用確認
    const supabaseMatches = content.match(/window\.supabase/g);
    if (supabaseMatches) {
        console.log(`  ✅ window.supabase の使用: ${supabaseMatches.length}箇所`);
        results.push({ test: 'window.supabase使用', status: '✅', detail: `${supabaseMatches.length}箇所` });
    } else {
        console.log('  ⚠️  window.supabase の使用が見つかりません');
        results.push({ test: 'window.supabase使用', status: '⚠️' });
    }

    // window.supabaseClient使用確認（あってはいけない）
    const supabaseClientMatches = content.match(/window\.supabaseClient/g);
    if (supabaseClientMatches) {
        console.log(`  ⚠️  window.supabaseClient の使用: ${supabaseClientMatches.length}箇所（plan-detail.htmlではwindow.supabaseを使用すべき）`);
        results.push({ test: 'window.supabaseClient不使用', status: '⚠️', detail: `${supabaseClientMatches.length}箇所` });
    } else {
        console.log('  ✅ window.supabaseClient の使用なし（正しい）');
        results.push({ test: 'window.supabaseClient不使用', status: '✅' });
    }
}

// テスト3: 必要なアセットファイルの確認
console.log('\n📦 3. 必要なアセットファイルの確認');
const assetsDir = path.join(__dirname, '../dist/assets');
if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);

    // plan-detail用のJSファイル
    const planDetailJS = assetFiles.find(f => f.startsWith('plan-detail-') && f.endsWith('.js'));
    if (planDetailJS) {
        const jsPath = path.join(assetsDir, planDetailJS);
        const jsContent = fs.readFileSync(jsPath, 'utf-8');
        console.log(`  ✅ ${planDetailJS} が存在します`);

        // バンドルされたコードの確認
        if (jsContent.includes('window.supabase=')) {
            console.log('     ✅ window.supabase の設定コードあり');
            results.push({ test: 'バンドルJS内のwindow.supabase設定', status: '✅' });
        } else {
            console.log('     ⚠️  window.supabase の設定コードなし');
            results.push({ test: 'バンドルJS内のwindow.supabase設定', status: '⚠️' });
        }

        // supabase-client.jsのimport確認
        if (jsContent.includes('supabase-client')) {
            console.log('     ✅ supabase-client のimportあり');
            results.push({ test: 'supabase-client import', status: '✅' });
        } else {
            console.log('     ⚠️  supabase-client のimportなし');
            results.push({ test: 'supabase-client import', status: '⚠️' });
        }
    } else {
        console.log('  ❌ plan-detail用のJSファイルが見つかりません');
        allTestsPassed = false;
        results.push({ test: 'plan-detail JSファイル', status: '❌' });
    }

    // supabase-client用のJSファイル
    const supabaseClientJS = assetFiles.find(f => f.startsWith('supabase-client-') && f.endsWith('.js'));
    if (supabaseClientJS) {
        console.log(`  ✅ ${supabaseClientJS} が存在します`);
        results.push({ test: 'supabase-client JSファイル', status: '✅' });
    } else {
        console.log('  ❌ supabase-client用のJSファイルが見つかりません');
        allTestsPassed = false;
        results.push({ test: 'supabase-client JSファイル', status: '❌' });
    }
} else {
    console.log('  ❌ assetsディレクトリが見つかりません');
    allTestsPassed = false;
    results.push({ test: 'assetsディレクトリ', status: '❌' });
}

// テスト4: /js/common.jsの確認
console.log('\n📦 4. /js/common.jsの確認');
const commonJSPath = path.join(__dirname, '../dist/js/common.js');
if (fs.existsSync(commonJSPath)) {
    const stats = fs.statSync(commonJSPath);
    console.log(`  ✅ dist/js/common.js が存在します (${stats.size} bytes)`);
    results.push({ test: 'common.js存在', status: '✅' });
} else {
    console.log('  ❌ dist/js/common.js が見つかりません');
    allTestsPassed = false;
    results.push({ test: 'common.js存在', status: '❌' });
}

// テスト5: /js/supabase-client.jsの確認
console.log('\n📦 5. /js/supabase-client.jsの確認');
const supabaseClientPath = path.join(__dirname, '../dist/js/supabase-client.js');
if (fs.existsSync(supabaseClientPath)) {
    const stats = fs.statSync(supabaseClientPath);
    const content = fs.readFileSync(supabaseClientPath, 'utf-8');
    console.log(`  ✅ dist/js/supabase-client.js が存在します (${stats.size} bytes)`);

    // ES module export確認
    if (content.includes('export const supabase') || content.includes('export default supabase')) {
        console.log('     ✅ supabaseクライアントのexportあり');
        results.push({ test: 'supabase export', status: '✅' });
    } else {
        console.log('     ⚠️  supabaseクライアントのexportなし');
        results.push({ test: 'supabase export', status: '⚠️' });
    }
} else {
    console.log('  ❌ dist/js/supabase-client.js が見つかりません');
    allTestsPassed = false;
    results.push({ test: 'supabase-client.js存在', status: '❌' });
}

// 結果サマリー
console.log('\n' + '='.repeat(60));
console.log('📊 テスト結果サマリー');
console.log('='.repeat(60));

const passed = results.filter(r => r.status === '✅').length;
const warned = results.filter(r => r.status === '⚠️').length;
const failed = results.filter(r => r.status === '❌').length;

results.forEach(r => {
    const detail = r.detail ? ` (${r.detail})` : '';
    console.log(`${r.status} ${r.test}${detail}`);
});

console.log('\n' + '='.repeat(60));
console.log(`✅ 成功: ${passed}`);
console.log(`⚠️  警告: ${warned}`);
console.log(`❌ 失敗: ${failed}`);
console.log('='.repeat(60));

if (allTestsPassed && failed === 0) {
    console.log('\n🎉 すべてのテストをパスしました！');
    console.log('\n📝 次のステップ:');
    console.log('   1. Vercelにデプロイ: npm run build && vercel --prod');
    console.log('   2. 本番URLでplan-detail.htmlにアクセスしてテスト');
    console.log('   3. ブラウザのコンソールでエラーがないか確認');
    process.exit(0);
} else {
    console.log('\n⚠️  いくつかの問題が見つかりました。上記の内容を確認してください。');
    if (warned > 0 && failed === 0) {
        console.log('   警告はありますが、動作に問題ない可能性があります。');
        process.exit(0);
    }
    process.exit(1);
}
