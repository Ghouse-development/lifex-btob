/**
 * 全HTMLページのSupabase接続エラーを検出するスクリプト
 *
 * このスクリプトは以下をチェックします:
 * 1. HTMLファイル内のSupabase初期化コード
 * 2. common.js, supabase-client.js等の読み込み
 * 3. 環境変数の参照
 * 4. エラーハンドリングの有無
 */

const fs = require('fs');
const path = require('path');

// チェック対象のHTMLファイル
const htmlFiles = [
    'src/index.html',
    'src/plans.html',
    'src/plan-detail.html',
    'src/matrix.html',
    'src/rules.html',
    'src/faq.html',
    'src/downloads.html',
    'src/design.html',
    'src/ai.html',
    'src/admin-login.html',
    'src/admin-login-google.html',
    'src/admin.html',
    'src/admin-plans.html',
    'src/admin-plans-new.html',
    'src/admin-rules.html',
    'src/admin-faq.html',
    'src/admin-downloads.html',
    'src/admin-users.html',
    'src/admin-profile.html',
    'src/admin-notifications.html',
    'src/admin-system.html',
    'src/admin/index.html',
    'src/debug-faq-comprehensive.html'
];

// Supabase関連のパターン
const patterns = {
    supabaseClient: /window\.supabase/g,
    supabaseAPI: /window\.supabaseAPI/g,
    createClient: /createClient/g,
    commonJs: /common\.js/g,
    supabaseUrl: /SUPABASE_URL/g,
    supabaseKey: /SUPABASE.*KEY/g,
    errorHandling: /catch\s*\(/g,
    trycatch: /try\s*\{/g
};

console.log('🔍 Supabaseエラー検出スクリプト開始\n');

let totalIssues = 0;
const results = [];

htmlFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${filePath} が存在しません`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    // ファイル名を取得
    const fileName = path.basename(filePath);

    // Supabaseを使用しているかチェック
    const usesSupabase =
        content.includes('supabase') ||
        content.includes('Supabase') ||
        content.includes('createClient');

    if (!usesSupabase) {
        // Supabaseを使用していないページはスキップ
        return;
    }

    // common.jsの読み込みチェック
    if (!content.match(patterns.commonJs)) {
        issues.push('❌ common.jsが読み込まれていません');
    }

    // window.supabaseの使用チェック
    const supabaseClientMatches = content.match(patterns.supabaseClient);
    if (supabaseClientMatches) {
        // エラーハンドリングのチェック
        const errorHandlingMatches = content.match(patterns.errorHandling);
        const tryCatchMatches = content.match(patterns.trycatch);

        if (!errorHandlingMatches && !tryCatchMatches) {
            issues.push('⚠️  Supabase操作にエラーハンドリングがない可能性');
        }
    }

    // window.supabaseAPIの使用チェック
    const apiMatches = content.match(patterns.supabaseAPI);
    if (apiMatches) {
        // window.supabaseAPIReady のチェック待機を確認
        if (!content.includes('supabaseAPIReady')) {
            issues.push('⚠️  window.supabaseAPIを使用しているが、初期化待機がない');
        }
    }

    // 環境変数の直接参照チェック（アンチパターン）
    if (content.match(patterns.supabaseUrl) || content.match(patterns.supabaseKey)) {
        if (!content.includes('import.meta.env') && !content.includes('フォールバック')) {
            issues.push('⚠️  環境変数を直接参照している（フォールバック値推奨）');
        }
    }

    // 結果を保存
    if (issues.length > 0) {
        results.push({
            file: fileName,
            path: filePath,
            issues: issues
        });
        totalIssues += issues.length;
    }
});

// 結果表示
console.log('📊 チェック結果\n');

if (results.length === 0) {
    console.log('✅ エラーや警告は見つかりませんでした！');
} else {
    console.log(`⚠️  ${results.length}個のファイルで${totalIssues}個の問題を検出\n`);

    results.forEach(result => {
        console.log(`📄 ${result.file}`);
        console.log(`   パス: ${result.path}`);
        result.issues.forEach(issue => {
            console.log(`   ${issue}`);
        });
        console.log('');
    });
}

// JSON形式でも出力
const jsonOutput = {
    totalFiles: htmlFiles.length,
    filesWithIssues: results.length,
    totalIssues: totalIssues,
    results: results,
    timestamp: new Date().toISOString()
};

fs.writeFileSync(
    'docs/reports/supabase-errors-report.json',
    JSON.stringify(jsonOutput, null, 2)
);

console.log('📝 詳細レポートを docs/reports/supabase-errors-report.json に保存しました');

process.exit(totalIssues > 0 ? 1 : 0);
