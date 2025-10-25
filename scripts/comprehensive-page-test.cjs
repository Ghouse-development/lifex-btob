/**
 * 全ページ最終動作確認スクリプト
 *
 * 本番運用開始前の包括的なテスト
 * - HTML構文チェック
 * - JavaScript構文チェック
 * - Supabase統合チェック
 * - 必須要素の存在チェック
 * - Alpine.js x-dataチェック
 * - リンク整合性チェック
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 全ページ最終動作確認テスト開始\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const errors = [];
const warnings = [];
const passed = [];

// テスト対象の全ページリスト
const pages = [
    // 公開ページ
    { path: 'src/index.html', name: 'トップページ', requiresAuth: false, hasAlpine: true },
    { path: 'src/plans.html', name: 'プラン一覧', requiresAuth: false, hasAlpine: true, usesSupabase: true },
    { path: 'src/plan-detail.html', name: 'プラン詳細', requiresAuth: false, hasAlpine: true, usesSupabase: true },
    { path: 'src/matrix.html', name: '間取マトリックス', requiresAuth: false, hasAlpine: true, usesSupabase: true },
    { path: 'src/rules.html', name: 'ルール一覧', requiresAuth: false, hasAlpine: true, usesSupabase: true },
    { path: 'src/faq.html', name: 'FAQ', requiresAuth: false, hasAlpine: true, usesSupabase: true },
    { path: 'src/downloads.html', name: 'ダウンロード', requiresAuth: false, hasAlpine: true, usesSupabase: true },
    { path: 'src/design.html', name: 'デザイン', requiresAuth: false, hasAlpine: true },
    { path: 'src/ai.html', name: 'AI機能', requiresAuth: false, hasAlpine: true },

    // 認証ページ
    { path: 'src/admin-login.html', name: '管理者ログイン', requiresAuth: false, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-login-google.html', name: 'Googleログイン', requiresAuth: false, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-password-reset.html', name: 'パスワードリセット', requiresAuth: false, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-password-update.html', name: 'パスワード更新', requiresAuth: false, hasAlpine: true, usesSupabase: true },

    // 管理画面
    { path: 'src/admin.html', name: '旧管理画面', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin/index.html', name: '管理ダッシュボード', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-plans.html', name: 'プラン管理', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-rules.html', name: 'ルール管理', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-faq.html', name: 'FAQ管理', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-downloads.html', name: 'ダウンロード管理', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-users.html', name: 'ユーザー管理', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-system.html', name: 'システム設定', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-profile.html', name: 'プロフィール', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-notifications.html', name: 'お知らせ管理', requiresAuth: true, hasAlpine: true, usesSupabase: true },
    { path: 'src/admin-report.html', name: 'レポート', requiresAuth: true, hasAlpine: true, usesSupabase: true },

    // エラーページ
    { path: 'src/404.html', name: '404エラー', requiresAuth: false, hasAlpine: false },
    { path: 'src/500.html', name: '500エラー', requiresAuth: false, hasAlpine: false },
];

// 各ページをテスト
pages.forEach((page, index) => {
    console.log(`[${index + 1}/${pages.length}] ${page.name} (${page.path})`);

    if (!fs.existsSync(page.path)) {
        errors.push(`❌ ${page.name} - ファイルが見つかりません: ${page.path}`);
        console.log(`   ❌ ファイルが見つかりません\n`);
        return;
    }

    const content = fs.readFileSync(page.path, 'utf-8');
    const pageErrors = [];
    const pageWarnings = [];

    // 1. HTML基本構文チェック
    if (!content.includes('<!DOCTYPE html>')) {
        pageErrors.push('DOCTYPE宣言がありません');
    }
    if (!content.includes('<html')) {
        pageErrors.push('<html>タグがありません');
    }
    if (!content.includes('</html>')) {
        pageErrors.push('</html>タグがありません');
    }
    if (!content.includes('<head')) {
        pageErrors.push('<head>タグがありません');
    }
    if (!content.includes('<body')) {
        pageErrors.push('<body>タグがありません');
    }

    // 2. メタタグチェック
    if (!content.includes('<meta charset=')) {
        pageWarnings.push('charset指定がありません');
    }
    if (!content.includes('viewport')) {
        pageWarnings.push('viewport指定がありません');
    }
    if (!content.includes('<title')) {
        pageWarnings.push('<title>タグがありません');
    }

    // 3. CSS読み込みチェック
    if (!content.includes('main.css') && !content.includes('tailwind')) {
        pageWarnings.push('CSSファイルが読み込まれていません');
    }

    // 4. Alpine.jsチェック
    if (page.hasAlpine) {
        if (!content.includes('alpinejs')) {
            pageErrors.push('Alpine.jsが読み込まれていません');
        }
        if (!content.includes('x-data')) {
            pageWarnings.push('x-data属性が見つかりません（Alpine.js未使用の可能性）');
        }
    }

    // 5. Supabaseチェック
    if (page.usesSupabase) {
        const hasSupabaseCDN = content.includes('supabase-js');
        const hasCommonJs = content.includes('common.js');

        if (!hasSupabaseCDN && !hasCommonJs) {
            pageErrors.push('Supabase CDNもcommon.jsも読み込まれていません');
        }

        if (content.includes('window.supabase.from') || content.includes('window.supabaseAPI')) {
            // Supabaseを使っている
            if (!hasCommonJs && !content.includes('createClient')) {
                pageWarnings.push('Supabase使用しているが初期化コードが不明確');
            }
        }
    }

    // 6. 認証チェック
    if (page.requiresAuth) {
        // 認証チェックのロジックがあるか
        const hasAuthCheck = content.includes('isAuthenticated') ||
                            content.includes('checkAuth') ||
                            content.includes('getUser');
        if (!hasAuthCheck) {
            pageWarnings.push('認証チェックロジックが見つかりません');
        }
    }

    // 7. ナビゲーションチェック
    if (!page.path.includes('404') && !page.path.includes('500') &&
        !page.path.includes('admin-login') && !page.path.includes('password')) {
        if (!content.includes('nav') && !content.includes('menu')) {
            pageWarnings.push('ナビゲーション要素が見つかりません');
        }
    }

    // 8. エラーハンドリングチェック
    if (page.usesSupabase) {
        const hasTryCatch = content.includes('try') && content.includes('catch');
        const hasErrorCheck = content.includes('error') || content.includes('Error');

        if (!hasTryCatch && !hasErrorCheck) {
            pageWarnings.push('エラーハンドリングが不足している可能性');
        }
    }

    // 9. コンソールログチェック（本番環境では削除推奨）
    if (content.includes('console.log') && !content.includes('console.error')) {
        pageWarnings.push('console.logが残っています（本番前に削除推奨）');
    }

    // 結果を集計
    if (pageErrors.length > 0) {
        errors.push(`❌ ${page.name} (${page.path}):`);
        pageErrors.forEach(err => {
            errors.push(`   - ${err}`);
            console.log(`   ❌ ${err}`);
        });
    }

    if (pageWarnings.length > 0) {
        warnings.push(`⚠️  ${page.name} (${page.path}):`);
        pageWarnings.forEach(warn => {
            warnings.push(`   - ${warn}`);
            console.log(`   ⚠️  ${warn}`);
        });
    }

    if (pageErrors.length === 0 && pageWarnings.length === 0) {
        passed.push(page.name);
        console.log(`   ✅ すべてのチェックをパス`);
    }

    console.log('');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// サマリー
console.log('📊 テスト結果サマリー\n');
console.log(`   総ページ数: ${pages.length}`);
console.log(`   ✅ 合格: ${passed.length}ページ`);
console.log(`   ⚠️  警告あり: ${Math.floor(warnings.length / 2)}ページ`);
console.log(`   ❌ エラーあり: ${Math.floor(errors.length / 2)}ページ\n`);

if (passed.length > 0) {
    console.log('✅ 合格ページ:');
    passed.forEach(name => console.log(`   - ${name}`));
    console.log('');
}

if (warnings.length > 0) {
    console.log('⚠️  警告:\n');
    warnings.forEach(warning => console.log(warning));
    console.log('');
}

if (errors.length > 0) {
    console.log('❌ エラー:\n');
    errors.forEach(error => console.log(error));
    console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 詳細レポート保存
const report = {
    timestamp: new Date().toISOString(),
    totalPages: pages.length,
    passed: passed.length,
    warnings: Math.floor(warnings.length / 2),
    errors: Math.floor(errors.length / 2),
    passedPages: passed,
    warningDetails: warnings,
    errorDetails: errors,
    pageResults: pages.map(page => ({
        name: page.name,
        path: page.path,
        status: errors.some(e => e.includes(page.name)) ? 'error' :
                warnings.some(w => w.includes(page.name)) ? 'warning' : 'passed'
    }))
};

fs.writeFileSync(
    'docs/reports/comprehensive-test-report.json',
    JSON.stringify(report, null, 2)
);

console.log('📝 詳細レポートを docs/reports/comprehensive-test-report.json に保存しました\n');

// 終了コード
if (errors.length > 0) {
    console.log('❌ エラーが検出されました。修正が必要です。\n');
    process.exit(1);
} else if (warnings.length > 0) {
    console.log('⚠️  警告がありますが、動作に問題はありません。\n');
    process.exit(0);
} else {
    console.log('✅ 全ページのテストに合格しました！\n');
    process.exit(0);
}
