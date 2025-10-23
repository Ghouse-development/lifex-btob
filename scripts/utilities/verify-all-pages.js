import { readFileSync, existsSync, readdirSync } from 'fs';

const errors = [];
const warnings = [];
const pageChecks = [];

console.log('========================================');
console.log('🔍 全ページ動作確認');
console.log('========================================\n');

// 全HTMLページを取得
const pages = readdirSync('src').filter(f => f.endsWith('.html')).map(f => `src/${f}`);

console.log(`📋 対象ページ数: ${pages.length}ページ\n`);

for (const page of pages) {
    const filename = page.replace('src/', '');
    const content = readFileSync(page, 'utf8');

    const checks = {
        file: filename,
        exists: true,
        hasSupabaseAPI: false,
        hasAlpineJS: false,
        hasErrors: [],
        warnings: [],
        status: 'unknown'
    };

    // 1. Supabase API使用チェック
    if (content.includes('window.supabaseAPI') || content.includes('supabase.')) {
        checks.hasSupabaseAPI = true;
    }

    // 2. Alpine.js使用チェック
    if (content.includes('x-data') || content.includes('Alpine.')) {
        checks.hasAlpineJS = true;
    }

    // 3. 構文エラーチェック
    const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (scriptMatches) {
        scriptMatches.forEach((script, idx) => {
            const code = script.replace(/<\/?script[^>]*>/gi, '');

            // try-catch不一致
            const tryCount = (code.match(/\btry\s*\{/g) || []).length;
            const catchCount = (code.match(/\bcatch\s*\(/g) || []).length;
            if (tryCount > catchCount) {
                checks.hasErrors.push(`Script ${idx + 1}: try-catch不一致`);
            }

            // 括弧不一致
            const openBrace = (code.match(/\{/g) || []).length;
            const closeBrace = (code.match(/\}/g) || []).length;
            if (openBrace !== closeBrace) {
                checks.hasErrors.push(`Script ${idx + 1}: 括弧不一致 ({:${openBrace}, }:${closeBrace})`);
            }
        });
    }

    // 4. 環境変数エラーパターンチェック
    if (content.includes('throw new Error') && content.includes('API key')) {
        checks.warnings.push('環境変数エラーがスローされる可能性');
    }

    // 5. ステータス判定
    if (checks.hasErrors.length > 0) {
        checks.status = '❌ エラー';
        errors.push(`${filename}: ${checks.hasErrors.join(', ')}`);
    } else if (checks.warnings.length > 0) {
        checks.status = '⚠️  警告';
        warnings.push(`${filename}: ${checks.warnings.join(', ')}`);
    } else {
        checks.status = '✅ 正常';
    }

    pageChecks.push(checks);
}

// 結果表示
console.log('📊 ページ別チェック結果\n');

// カテゴリ別に分類
const publicPages = pageChecks.filter(p => !p.file.startsWith('admin') && !p.file.startsWith('test'));
const adminPages = pageChecks.filter(p => p.file.startsWith('admin'));
const otherPages = pageChecks.filter(p => p.file.startsWith('test') ||
    ['plans-simple.html', 'rules-modal.html', 'downloads-modal.html'].includes(p.file));

console.log('🌐 公開ページ:\n');
publicPages.forEach(p => {
    console.log(`${p.status} ${p.file}`);
    if (p.hasSupabaseAPI) console.log(`   📊 Supabase使用`);
    if (p.hasAlpineJS) console.log(`   ⚡ Alpine.js使用`);
    if (p.hasErrors.length > 0) p.hasErrors.forEach(e => console.log(`   ❌ ${e}`));
    if (p.warnings.length > 0) p.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
});

console.log('\n🔐 管理ページ:\n');
adminPages.forEach(p => {
    console.log(`${p.status} ${p.file}`);
    if (p.hasSupabaseAPI) console.log(`   📊 Supabase使用`);
    if (p.hasAlpineJS) console.log(`   ⚡ Alpine.js使用`);
    if (p.hasErrors.length > 0) p.hasErrors.forEach(e => console.log(`   ❌ ${e}`));
    if (p.warnings.length > 0) p.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
});

console.log('\n🔧 その他ページ:\n');
otherPages.forEach(p => {
    console.log(`${p.status} ${p.file}`);
    if (p.hasSupabaseAPI) console.log(`   📊 Supabase使用`);
    if (p.hasAlpineJS) console.log(`   ⚡ Alpine.js使用`);
    if (p.hasErrors.length > 0) p.hasErrors.forEach(e => console.log(`   ❌ ${e}`));
    if (p.warnings.length > 0) p.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
});

// サマリー
console.log('\n========================================');
console.log('📈 サマリー');
console.log('========================================\n');

const totalPages = pageChecks.length;
const errorPages = pageChecks.filter(p => p.status.includes('❌')).length;
const warningPages = pageChecks.filter(p => p.status.includes('⚠️')).length;
const okPages = pageChecks.filter(p => p.status.includes('✅')).length;

console.log(`総ページ数: ${totalPages}`);
console.log(`  ✅ 正常: ${okPages}ページ`);
console.log(`  ⚠️  警告: ${warningPages}ページ`);
console.log(`  ❌ エラー: ${errorPages}ページ`);

console.log(`\nSupabase使用: ${pageChecks.filter(p => p.hasSupabaseAPI).length}ページ`);
console.log(`Alpine.js使用: ${pageChecks.filter(p => p.hasAlpineJS).length}ページ`);

if (errorPages === 0 && warningPages === 0) {
    console.log('\n✅ 全ページが正常です！');
} else {
    if (errorPages > 0) {
        console.log('\n🚨 エラーがあるページ:');
        errors.forEach(e => console.log(`   ${e}`));
    }
    if (warningPages > 0) {
        console.log('\n⚠️  警告があるページ:');
        warnings.forEach(w => console.log(`   ${w}`));
    }
}

console.log('\n完了。\n');

process.exit(errorPages > 0 ? 1 : 0);
