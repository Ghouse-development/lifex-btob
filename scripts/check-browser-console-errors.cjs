/**
 * ブラウザコンソールエラーの潜在的な問題を検出
 *
 * チェック項目:
 * - 未定義変数の参照
 * - 存在しない関数の呼び出し
 * - Supabase初期化の問題
 * - Alpine.jsの問題
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ブラウザコンソールエラー検出スクリプト\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const issues = [];
const warnings = [];

// テスト対象のページ
const pages = [
    'src/index.html',
    'src/plans.html',
    'src/plan-detail.html',
    'src/faq.html',
    'src/rules.html',
    'src/admin-login.html',
    'src/admin-faq.html',
    'src/admin/index.html'
];

// よくあるエラーパターン
const errorPatterns = [
    {
        pattern: /window\.supabase\.from/g,
        issue: 'window.supabase.from() は非推奨。window.supabaseClient.from() を使用してください',
        severity: 'error'
    },
    {
        pattern: /x-data="[^"]*"\s+x-init="[^"]*"/g,
        check: (content) => {
            // x-dataとx-initが同じ要素にある場合、関数が定義されているか確認
            const matches = content.match(/x-data="(\w+)\(\)"/g);
            if (matches) {
                return matches.map(m => {
                    const funcName = m.match(/x-data="(\w+)\(\)"/)[1];
                    const funcDef = new RegExp(`function\\s+${funcName}\\s*\\(`, 'g');
                    if (!content.match(funcDef)) {
                        return `関数 ${funcName}() が定義されていません`;
                    }
                    return null;
                }).filter(Boolean);
            }
            return [];
        },
        severity: 'error'
    },
    {
        pattern: /supabaseClient\.from\(['"](\w+)['"]\)/g,
        check: (content, matches) => {
            // テーブル名のタイポチェック
            const validTables = ['plans', 'faqs', 'faq_categories', 'rules', 'rule_categories', 'notifications', 'user_profiles'];
            const errors = [];
            if (matches) {
                matches.forEach(match => {
                    const tableName = match.match(/supabaseClient\.from\(['"](\w+)['"]\)/)[1];
                    if (!validTables.includes(tableName)) {
                        errors.push(`不明なテーブル名: ${tableName} (タイポの可能性)`);
                    }
                });
            }
            return errors;
        },
        severity: 'warning'
    },
    {
        pattern: /await\s+(?!.*\.then|.*catch)/g,
        issue: 'awaitを使用していますが、エラーハンドリング(try-catch)がない可能性があります',
        severity: 'warning',
        checkContext: true
    }
];

// 各ページをチェック
pages.forEach(pagePath => {
    if (!fs.existsSync(pagePath)) {
        console.log(`⏭️  スキップ: ${pagePath} (ファイルが存在しません)\n`);
        return;
    }

    console.log(`📄 ${pagePath}`);
    const content = fs.readFileSync(pagePath, 'utf-8');
    const pageIssues = [];
    const pageWarnings = [];

    // 1. Supabase初期化チェック
    if (content.includes('supabase') || content.includes('Supabase')) {
        const hasSupabaseCDN = content.includes('supabase-js');
        const hasCommonJs = content.includes('common.js');
        const usesSupabaseClient = content.includes('supabaseClient') || content.includes('window.supabase');

        if (usesSupabaseClient && !hasSupabaseCDN && !hasCommonJs) {
            pageIssues.push('Supabaseを使用していますが、CDNもcommon.jsも読み込まれていません');
        }

        // 非推奨パターンチェック
        if (content.match(/window\.supabase\.from/)) {
            pageIssues.push('window.supabase.from() は非推奨。supabaseClient.from() を使用してください');
        }
    }

    // 2. Alpine.js関数定義チェック
    const alpineDataMatches = content.match(/x-data="(\w+)\(\)"/g);
    if (alpineDataMatches) {
        alpineDataMatches.forEach(match => {
            const funcName = match.match(/x-data="(\w+)\(\)"/)[1];
            const funcDefPattern = new RegExp(`function\\s+${funcName}\\s*\\(`, 'g');
            if (!content.match(funcDefPattern)) {
                pageIssues.push(`Alpine.js関数 ${funcName}() が定義されていません`);
            }
        });
    }

    // 3. CDN読み込み順序チェック
    const scriptTags = content.match(/<script[^>]*src="[^"]*"[^>]*>/g) || [];
    const alpineIndex = scriptTags.findIndex(tag => tag.includes('alpinejs'));
    const commonIndex = scriptTags.findIndex(tag => tag.includes('common.js'));

    if (alpineIndex !== -1 && commonIndex !== -1 && commonIndex > alpineIndex) {
        pageWarnings.push('common.jsがAlpine.jsより後に読み込まれています。初期化タイミングに注意が必要です');
    }

    // 4. 一般的なタイポチェック
    const commonTypos = [
        { wrong: 'supabase.form', correct: 'supabase.from' },
        { wrong: 'Alpne', correct: 'Alpine' },
        { wrong: 'lenght', correct: 'length' },
        { wrong: 'consolelog', correct: 'console.log' }
    ];

    commonTypos.forEach(({ wrong, correct }) => {
        if (content.includes(wrong)) {
            pageIssues.push(`タイポの可能性: "${wrong}" → "${correct}"?`);
        }
    });

    // 5. エラーハンドリングチェック
    const hasAsync = content.includes('async');
    const hasTryCatch = content.match(/try\s*{[\s\S]*?}\s*catch/);
    const hasThen = content.includes('.then(');
    const hasCatch = content.includes('.catch(');

    if (hasAsync && !hasTryCatch && !hasCatch) {
        pageWarnings.push('async関数を使用していますが、エラーハンドリング(try-catch)が見つかりません');
    }

    // 結果表示
    if (pageIssues.length > 0) {
        console.log('   ❌ 潜在的なエラー:');
        pageIssues.forEach(issue => {
            console.log(`      - ${issue}`);
            issues.push(`${pagePath}: ${issue}`);
        });
    }

    if (pageWarnings.length > 0) {
        console.log('   ⚠️  警告:');
        pageWarnings.forEach(warning => {
            console.log(`      - ${warning}`);
            warnings.push(`${pagePath}: ${warning}`);
        });
    }

    if (pageIssues.length === 0 && pageWarnings.length === 0) {
        console.log('   ✅ 潜在的なエラーは検出されませんでした');
    }

    console.log('');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// サマリー
console.log('📊 検出結果サマリー\n');
console.log(`   検査ページ数: ${pages.filter(p => fs.existsSync(p)).length}`);
console.log(`   ❌ エラー: ${issues.length}件`);
console.log(`   ⚠️  警告: ${warnings.length}件\n`);

if (issues.length > 0) {
    console.log('❌ 潜在的なエラー:\n');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
}

if (warnings.length > 0) {
    console.log('⚠️  警告（動作には影響しない可能性が高い）:\n');
    warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 推奨事項
console.log('💡 実際のブラウザでの確認方法:\n');
console.log('1. ローカルサーバーを起動:');
console.log('   npm run dev\n');
console.log('2. ブラウザでページを開く:');
console.log('   http://localhost:5173\n');
console.log('3. デベロッパーツールを開く:');
console.log('   - Windows/Linux: F12 または Ctrl+Shift+I');
console.log('   - Mac: Cmd+Option+I\n');
console.log('4. コンソールタブでエラーを確認\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (issues.length > 0) {
    console.log('❌ 潜在的なエラーが検出されました。修正を推奨します。\n');
    process.exit(1);
} else if (warnings.length > 0) {
    console.log('⚠️  警告がありますが、動作には問題ない可能性が高いです。\n');
    process.exit(0);
} else {
    console.log('✅ 潜在的なエラーは検出されませんでした！\n');
    process.exit(0);
}
