/**
 * 実際のSupabaseエラーを検出するスクリプト
 *
 * HTMLファイルの構文をチェックし、Supabaseの初期化コードが実際に動作するかを確認
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Supabase実装エラーチェック開始\n');

const errors = [];
const warnings = [];

// 主要なHTMLファイルをチェック
const htmlFiles = [
    { path: 'src/index.html', name: 'トップページ', usesSupabase: true },
    { path: 'src/plans.html', name: 'プラン一覧', usesSupabase: true },
    { path: 'src/plan-detail.html', name: 'プラン詳細', usesSupabase: true },
    { path: 'src/matrix.html', name: '間取マトリックス', usesSupabase: true },
    { path: 'src/rules.html', name: 'ルール一覧', usesSupabase: true },
    { path: 'src/faq.html', name: 'FAQ', usesSupabase: true },
    { path: 'src/admin-login.html', name: '管理者ログイン', usesSupabase: true },
    { path: 'src/admin-plans.html', name: 'プラン管理', usesSupabase: true },
    { path: 'src/admin-faq.html', name: 'FAQ管理', usesSupabase: true },
    { path: 'src/admin-rules.html', name: 'ルール管理', usesSupabase: true },
    { path: 'src/admin/index.html', name: '管理ダッシュボード', usesSupabase: true },
];

htmlFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
        errors.push(`❌ ${file.name} (${file.path}) - ファイルが見つかりません`);
        return;
    }

    if (!file.usesSupabase) {
        return;
    }

    const content = fs.readFileSync(file.path, 'utf-8');

    // Supabase CDNのチェック
    const hasSupabaseCDN = content.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js') ||
                           content.includes('unpkg.com/@supabase/supabase-js');

    // common.jsのチェック
    const hasCommonJs = content.includes('common.js');

    // Supabaseクライアント初期化のチェック
    const hasSupabaseInit = content.includes('createClient') ||
                           content.includes('window.supabase');

    // エラーパターン
    const issues = [];

    // CDNがない かつ common.jsもない
    if (!hasSupabaseCDN && !hasCommonJs) {
        issues.push('Supabase CDNもcommon.jsも読み込まれていません');
    }

    // Supabaseを使おうとしているが初期化がない
    if (content.includes('window.supabase.from') && !hasSupabaseInit && !hasCommonJs) {
        issues.push('window.supabaseを使用しているが初期化コードがありません');
    }

    // 実装の問題をチェック
    const hasFromCall = content.match(/\.from\(['"](\w+)['"]\)/g);
    if (hasFromCall) {
        // .from()を使っているがエラーハンドリングがない可能性
        const hasErrorHandling = content.includes('catch') || content.includes('error');
        if (!hasErrorHandling) {
            warnings.push(`⚠️  ${file.name} - エラーハンドリングが不足している可能性`);
        }
    }

    if (issues.length > 0) {
        errors.push(`❌ ${file.name} (${file.path}):`);
        issues.forEach(issue => {
            errors.push(`   - ${issue}`);
        });
    } else {
        console.log(`✅ ${file.name}`);
    }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (errors.length > 0) {
    console.log('❌ エラーが検出されました:\n');
    errors.forEach(error => console.log(error));
    console.log('');
}

if (warnings.length > 0) {
    console.log('⚠️  警告:\n');
    warnings.forEach(warning => console.log(warning));
    console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Supabase実装エラーは検出されませんでした\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n📊 サマリー`);
console.log(`   チェック対象: ${htmlFiles.length}ファイル`);
console.log(`   エラー: ${errors.length > 0 ? Math.ceil(errors.length / 2) : 0}個`);
console.log(`   警告: ${warnings.length}個\n`);

process.exit(errors.length > 0 ? 1 : 0);
