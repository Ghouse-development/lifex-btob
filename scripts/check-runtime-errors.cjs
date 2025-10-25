#!/usr/bin/env node

/**
 * ランタイムエラーチェックスクリプト
 * - import.meta.envの誤用
 * - window.supabaseAPIの参照エラー
 * - 複数のSupabaseクライアントインスタンス
 * - undefinedプロパティアクセス
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ランタイムエラーチェックを開始...\n');

const issues = [];
const warnings = [];

// HTMLファイルとJSファイルをチェック
const filesToCheck = [
    ...fs.readdirSync('src').filter(f => f.endsWith('.html')).map(f => path.join('src', f)),
    ...fs.readdirSync('src/js').filter(f => f.endsWith('.js')).map(f => path.join('src/js', f))
];

console.log('=' .repeat(60));
console.log('1️⃣ import.meta.env 誤用チェック');
console.log('='.repeat(60));

filesToCheck.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);

    // import.meta.envの使用をチェック
    const importMetaMatches = content.match(/import\.meta\.env/g);
    if (importMetaMatches) {
        // スクリプトタグ内で使用されている場合はエラー
        const scriptTagPattern = /<script(?!\s+type=["']module["'])[^>]*>[\s\S]*?import\.meta\.env[\s\S]*?<\/script>/g;
        const nonModuleScriptMatches = content.match(scriptTagPattern);

        if (nonModuleScriptMatches) {
            console.log(`  ❌ ${fileName}: import.meta.envを非モジュールスクリプトで使用`);
            issues.push({
                file: fileName,
                type: 'import-meta',
                message: 'import.meta.envはtype="module"スクリプト内でのみ使用可能',
                severity: 'error'
            });
        }
    }
});

if (issues.filter(i => i.type === 'import-meta').length === 0) {
    console.log('  ✅ import.meta.envの誤用なし');
}

console.log('');

console.log('='.repeat(60));
console.log('2️⃣ window.supabaseAPI 参照チェック');
console.log('='.repeat(60));

filesToCheck.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);

    // window.supabaseAPI.faqなどの参照をチェック
    const apiReferencePattern = /window\.supabaseAPI\.(\w+)/g;
    const matches = [...content.matchAll(apiReferencePattern)];

    if (matches.length > 0) {
        // window.supabaseAPIの初期化チェックが行われているか
        const hasInitCheck = /window\.supabaseAPI\s*&&|if\s*\(\s*window\.supabaseAPI\s*\)/g.test(content);
        const hasWaitForAPI = /waitForAPI|supabaseAPI.*ready|faqAPIReady/i.test(content);

        if (!hasInitCheck && !hasWaitForAPI) {
            console.log(`  ⚠️  ${fileName}: window.supabaseAPIの初期化確認なし`);
            warnings.push({
                file: fileName,
                type: 'api-check',
                message: `window.supabaseAPIを${matches.length}箇所で使用しているが初期化確認なし`,
                severity: 'warning'
            });
        }

        // 使用されているAPIメソッドを収集
        const apiMethods = [...new Set(matches.map(m => m[1]))];
        console.log(`  📝 ${fileName}: window.supabaseAPI.{${apiMethods.join(', ')}} を使用`);
    }
});

console.log('');

console.log('='.repeat(60));
console.log('3️⃣ Supabaseクライアント多重初期化チェック');
console.log('='.repeat(60));

filesToCheck.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);

    // createClientの呼び出し回数をチェック
    const createClientMatches = content.match(/createClient\s*\(/g);
    const supabaseInitMatches = content.match(/window\.supabase\s*=|window\.supabaseClient\s*=/g);

    if (createClientMatches && createClientMatches.length > 1) {
        console.log(`  ⚠️  ${fileName}: createClientを${createClientMatches.length}回呼び出し`);
        warnings.push({
            file: fileName,
            type: 'multi-client',
            message: `createClientを${createClientMatches.length}回呼び出し（多重インスタンスの可能性）`,
            severity: 'warning'
        });
    }
});

console.log('');

console.log('='.repeat(60));
console.log('4️⃣ supabase-auth.js の環境変数問題チェック');
console.log('='.repeat(60));

const supabaseAuthPath = 'src/js/supabase-auth.js';
if (fs.existsSync(supabaseAuthPath)) {
    const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

    // import.meta.envの使用をチェック
    if (content.includes('import.meta.env')) {
        console.log('  ❌ supabase-auth.js: import.meta.envを使用');
        console.log('     → ブラウザ環境ではアクセスできません');
        issues.push({
            file: 'supabase-auth.js',
            type: 'env-access',
            message: 'import.meta.envはブラウザ環境では使用できません',
            severity: 'error',
            fix: '環境変数の代わりにハードコード値またはwindow.ENVなどを使用'
        });

        // 修正案を表示
        console.log('');
        console.log('  💡 修正案:');
        console.log('     - import.meta.env.VITE_SUPABASE_URL');
        console.log('     + window.SUPABASE_URL || "https://hegpxvyziovlfxdfsrsv.supabase.co"');
    } else {
        console.log('  ✅ supabase-auth.js: 環境変数アクセスなし');
    }
} else {
    console.log('  ℹ️  supabase-auth.jsが見つかりません');
}

console.log('');

console.log('='.repeat(60));
console.log('5️⃣ admin-faq.html 固有の問題チェック');
console.log('='.repeat(60));

const adminFaqPath = 'src/admin-faq.html';
if (fs.existsSync(adminFaqPath)) {
    const content = fs.readFileSync(adminFaqPath, 'utf-8');

    const checks = [
        {
            pattern: /window\.supabaseAPI\.faq/g,
            name: 'window.supabaseAPI.faq参照',
            check: content.includes('window.supabaseAPI') && !content.includes('if (window.supabaseAPI')
        },
        {
            pattern: /supabase-auth\.js/g,
            name: 'supabase-auth.js読み込み',
            check: content.includes('supabase-auth.js')
        }
    ];

    checks.forEach(({ pattern, name, check }) => {
        const matches = content.match(pattern);
        if (matches) {
            const status = check ? '⚠️' : '✅';
            console.log(`  ${status} ${name}: ${matches.length}箇所`);

            if (check && name === 'window.supabaseAPI.faq参照') {
                issues.push({
                    file: 'admin-faq.html',
                    type: 'undefined-api',
                    message: 'window.supabaseAPIが未定義の状態でアクセスしている可能性',
                    severity: 'error'
                });
            }

            if (name === 'supabase-auth.js読み込み') {
                console.log('     → supabase-auth.jsに問題がある可能性');
                warnings.push({
                    file: 'admin-faq.html',
                    type: 'auth-js-dependency',
                    message: 'supabase-auth.jsを読み込んでいます（環境変数エラーの原因の可能性）',
                    severity: 'warning'
                });
            }
        }
    });
} else {
    console.log('  ℹ️  admin-faq.htmlが見つかりません');
}

console.log('');

console.log('='.repeat(60));
console.log('📊 チェック結果サマリー');
console.log('='.repeat(60));

const errorCount = issues.filter(i => i.severity === 'error').length;
const warningCount = warnings.length;

console.log(`❌ エラー: ${errorCount}`);
console.log(`⚠️  警告: ${warningCount}`);

if (errorCount > 0) {
    console.log('\n🔥 重大な問題が見つかりました:\n');
    issues.filter(i => i.severity === 'error').forEach(issue => {
        console.log(`❌ ${issue.file}`);
        console.log(`   問題: ${issue.message}`);
        if (issue.fix) {
            console.log(`   修正: ${issue.fix}`);
        }
        console.log('');
    });
}

if (warningCount > 0) {
    console.log('⚠️  警告:\n');
    warnings.forEach(warning => {
        console.log(`⚠️  ${warning.file}: ${warning.message}`);
    });
    console.log('');
}

// 総合判定
if (errorCount > 0) {
    console.log('❌ 修正が必要な問題があります');
    process.exit(1);
} else if (warningCount > 0) {
    console.log('⚠️  警告がありますが、致命的ではありません');
    process.exit(0);
} else {
    console.log('✅ ランタイムエラーは見つかりませんでした');
    process.exit(0);
}
