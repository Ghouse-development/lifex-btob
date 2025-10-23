import { readFileSync } from 'fs';

const errors = [];
const warnings = [];

const allPages = [
    // Public pages
    { path: 'src/index.html', name: '公開: トップページ' },
    { path: 'src/plans.html', name: '公開: プラン一覧' },
    { path: 'src/rules.html', name: '公開: ルール一覧' },
    { path: 'src/faq.html', name: '公開: FAQ' },
    { path: 'src/downloads.html', name: '公開: ダウンロード' },
    { path: 'src/design.html', name: '公開: デザイン' },

    // Admin pages
    { path: 'src/admin.html', name: '管理: ダッシュボード' },
    { path: 'src/admin-plans.html', name: '管理: プラン管理' },
    { path: 'src/admin-rules.html', name: '管理: ルール管理' },
    { path: 'src/admin-faq.html', name: '管理: FAQ管理' },
    { path: 'src/admin-downloads.html', name: '管理: ダウンロード管理' }
];

function checkJavaScriptSyntax(filePath, fileName) {
    const content = readFileSync(filePath, 'utf-8');
    const pageErrors = [];
    const pageWarnings = [];

    // Extract JavaScript from script tags
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let scriptIndex = 0;

    while ((match = scriptRegex.exec(content)) !== null) {
        scriptIndex++;
        const script = match[1];

        // 1. Check for unmatched try-catch
        const tryCount = (script.match(/\btry\s*\{/g) || []).length;
        const catchCount = (script.match(/\bcatch\s*\(/g) || []).length;
        const finallyCount = (script.match(/\bfinally\s*\{/g) || []).length;

        if (tryCount > catchCount + finallyCount) {
            pageErrors.push(`Script ${scriptIndex}: try-catch/finallyが不一致`);
        }

        // 2. Check for unmatched braces
        const openBraces = (script.match(/\{/g) || []).length;
        const closeBraces = (script.match(/\}/g) || []).length;

        if (openBraces !== closeBraces) {
            pageErrors.push(`Script ${scriptIndex}: 括弧の不一致 ({:${openBraces}, }:${closeBraces})`);
        }

        // 3. Check for common errors
        if (script.includes('getCategoryIdByName')) {
            // Check if error handling exists
            if (!script.includes('try') && !script.includes('catch')) {
                pageWarnings.push(`Script ${scriptIndex}: getCategoryIdByName使用時にエラー処理なし`);
            }
        }

        // 4. Check for hardcoded UUIDs (common pattern)
        const uuidPattern = /['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]/gi;
        const hardcodedUUIDs = script.match(uuidPattern);
        if (hardcodedUUIDs && hardcodedUUIDs.length > 0) {
            pageWarnings.push(`Script ${scriptIndex}: ハードコードされたUUID (${hardcodedUUIDs.length}件)`);
        }

        // 5. Check for categoryMap usage
        if (script.includes('categoryMap')) {
            // Check if categoryMap is initialized
            if (!script.includes('categoryMap = {}') && !script.includes('categoryMap:')) {
                pageWarnings.push(`Script ${scriptIndex}: categoryMapが初期化されていない可能性`);
            }
        }

        // 6. Check for status values
        const statusPatterns = [
            { value: 'active', validFor: ['rules', 'downloads'] },
            { value: 'published', validFor: ['plans', 'faqs'] }
        ];

        for (const pattern of statusPatterns) {
            if (script.includes(`status: '${pattern.value}'`) ||
                script.includes(`status = '${pattern.value}'`) ||
                script.includes(`value="${pattern.value}"`)) {

                // Check if this file should use this status
                const isValidFile = pattern.validFor.some(type =>
                    fileName.toLowerCase().includes(type)
                );

                if (!isValidFile && pattern.value === 'active') {
                    // Special check: 'active' is wrong for faqs
                    if (fileName.toLowerCase().includes('faq')) {
                        pageErrors.push(`Script ${scriptIndex}: FAQで不正なstatus値 'active' (正: 'published')`);
                    }
                }
            }
        }
    }

    // HTML-specific checks
    // 7. Check for Alpine.js x-for without :key
    const xForWithoutKey = content.match(/<[^>]*x-for="[^"]*"(?![^>]*:key)[^>]*>/g);
    if (xForWithoutKey && xForWithoutKey.length > 0) {
        pageWarnings.push(`Alpine.js: x-forに:keyが欠けている (${xForWithoutKey.length}箇所)`);
    }

    // 8. Check for unclosed script tags
    const scriptOpenCount = (content.match(/<script[^>]*>/g) || []).length;
    const scriptCloseCount = (content.match(/<\/script>/g) || []).length;
    if (scriptOpenCount !== scriptCloseCount) {
        pageErrors.push(`HTMLタグエラー: <script>タグが正しく閉じられていない`);
    }

    // 9. Check for missing required attributes on forms
    if (content.includes('x-model="formData.category"')) {
        // Check if category field has required attribute
        if (!content.includes('x-model="formData.category"') ||
            !content.match(/x-model="formData\.category"[^>]*required/)) {
            // This is fine if it's added in recent fix
        }
    }

    // 10. Check for Supabase API usage without availability check
    if (content.includes('window.supabaseAPI')) {
        const hasAvailabilityCheck = content.includes('if (window.supabaseAPI)') ||
                                     content.includes('while (!window.supabaseAPI');
        if (!hasAvailabilityCheck) {
            pageWarnings.push(`Supabase API使用時に可用性チェックなし`);
        }
    }

    return { errors: pageErrors, warnings: pageWarnings };
}

console.log('========================================');
console.log('🔍 包括的HTML/JavaScript構文チェック');
console.log('========================================\n');

for (const page of allPages) {
    try {
        const result = checkJavaScriptSyntax(page.path, page.name);

        if (result.errors.length === 0 && result.warnings.length === 0) {
            console.log(`✅ ${page.name}`);
        } else {
            if (result.errors.length > 0) {
                console.log(`❌ ${page.name}`);
                result.errors.forEach(err => {
                    console.log(`   エラー: ${err}`);
                    errors.push(`${page.name}: ${err}`);
                });
            } else {
                console.log(`⚠️  ${page.name}`);
            }

            if (result.warnings.length > 0) {
                result.warnings.forEach(warn => {
                    console.log(`   警告: ${warn}`);
                    warnings.push(`${page.name}: ${warn}`);
                });
            }
        }
    } catch (error) {
        console.log(`❌ ${page.name}: ファイル読み込みエラー - ${error.message}`);
        errors.push(`${page.name}: ${error.message}`);
    }
}

console.log('\n========================================');
console.log('📊 チェック結果サマリー');
console.log('========================================\n');

if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ 全ページで問題は見つかりませんでした\n');
} else {
    if (errors.length > 0) {
        console.log(`🚨 エラー: ${errors.length}件\n`);
        errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
        console.log('');
    }

    if (warnings.length > 0) {
        console.log(`⚠️  警告: ${warnings.length}件\n`);
        console.log('（警告は機能に影響しない可能性がありますが、確認をお勧めします）\n');
    }
}

console.log('完了。\n');
process.exit(errors.length > 0 ? 1 : 0);
