import { readFileSync } from 'fs';
import { join } from 'path';

const criticalPages = [
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

function checkJavaScriptSyntax(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];

    // Extract JavaScript from script tags
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let scriptIndex = 0;

    while ((match = scriptRegex.exec(content)) !== null) {
        scriptIndex++;
        const script = match[1];

        // Check for common syntax errors

        // 1. Unmatched try-catch
        const tryCount = (script.match(/\btry\s*\{/g) || []).length;
        const catchCount = (script.match(/\bcatch\s*\(/g) || []).length;
        const finallyCount = (script.match(/\bfinally\s*\{/g) || []).length;

        if (tryCount > catchCount + finallyCount) {
            issues.push(`Script ${scriptIndex}: try-catch/finallyが不一致 (try:${tryCount}, catch:${catchCount}, finally:${finallyCount})`);
        }

        // 2. Unmatched braces (simple check)
        const openBraces = (script.match(/\{/g) || []).length;
        const closeBraces = (script.match(/\}/g) || []).length;

        if (openBraces !== closeBraces) {
            issues.push(`Script ${scriptIndex}: 括弧の不一致 ({:${openBraces}, }:${closeBraces})`);
        }

        // 3. Unclosed strings (basic check)
        const lines = script.split('\n');
        lines.forEach((line, i) => {
            // Skip comments
            if (line.trim().startsWith('//')) return;

            // Check for unclosed strings
            const singleQuotes = (line.match(/(?<!\\)'/g) || []).length;
            const doubleQuotes = (line.match(/(?<!\\)"/g) || []).length;
            const backticks = (line.match(/(?<!\\)`/g) || []).length;

            if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
                issues.push(`Script ${scriptIndex}, Line ${i + 1}: 閉じられていない文字列の可能性`);
            }
        });

        // 4. Alpine.js specific checks
        if (script.includes('x-data') || script.includes('Alpine')) {
            // Check for common Alpine errors
            if (script.match(/return\s*{[\s\S]*?}\s*}\s*$/)) {
                // Missing closing brace for function
            }
        }
    }

    // Check for Alpine.js x-for key issues
    const xForWithoutKey = content.match(/x-for="[^"]+"\s+(?!:key)/g);
    if (xForWithoutKey && xForWithoutKey.length > 0) {
        issues.push(`Alpine.js: x-forに:keyが欠けている可能性 (${xForWithoutKey.length}箇所)`);
    }

    // Check for incorrect :key usage
    const xForBadKey = content.match(/x-for="[^"]+"\s+:key="(?![\w.]+)"/g);
    if (xForBadKey && xForBadKey.length > 0) {
        issues.push(`Alpine.js: x-forの:keyが不正な可能性`);
    }

    return issues;
}

console.log('========================================');
console.log('🔍 HTML/JavaScript 構文チェック');
console.log('========================================\n');

let totalIssues = 0;

for (const page of criticalPages) {
    try {
        const issues = checkJavaScriptSyntax(page.path);

        if (issues.length === 0) {
            console.log(`✅ ${page.name}`);
        } else {
            console.log(`⚠️  ${page.name}`);
            issues.forEach(issue => console.log(`   - ${issue}`));
            totalIssues += issues.length;
        }
    } catch (error) {
        console.log(`❌ ${page.name}: ${error.message}`);
        totalIssues++;
    }
}

console.log('\n========================================');
console.log('結果');
console.log('========================================\n');

if (totalIssues === 0) {
    console.log('✅ 問題は見つかりませんでした');
} else {
    console.log(`⚠️  ${totalIssues}個の潜在的な問題が見つかりました`);
}

process.exit(totalIssues > 0 ? 1 : 0);
