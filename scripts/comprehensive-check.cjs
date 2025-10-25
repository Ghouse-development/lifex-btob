#!/usr/bin/env node

/**
 * 包括的な品質チェックスクリプト
 * - HTML構文エラー
 * - リンク切れ
 * - 非表示要素
 * - Supabase連携
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 包括的な品質チェックを開始...\n');

const issues = [];
let totalFiles = 0;
let checkedFiles = 0;

// 1. HTMLファイルの構文チェック
console.log('=' .repeat(60));
console.log('📄 1. HTML構文チェック');
console.log('='.repeat(60));

const htmlFiles = [
    'src/index.html',
    'src/matrix.html',
    'src/plans.html',
    'src/rules.html',
    'src/downloads.html',
    'src/plan-detail.html',
    'src/faq.html',
    'src/ai.html',
    'src/design.html',
    'src/admin.html',
    'src/admin-login.html',
    'src/admin-plans.html',
    'src/admin-rules.html',
    'src/admin-faq.html',
    'src/admin-downloads.html',
    'src/admin-users.html',
    'src/admin-system.html',
    'src/admin-profile.html',
    'src/admin-notifications.html',
    'src/admin-report.html',
    'src/admin-password-reset.html',
    'src/admin-password-update.html',
    'src/404.html',
    'src/500.html'
];

totalFiles = htmlFiles.length;

htmlFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log(`❌ ${file}: ファイルが存在しません`);
        issues.push({ file, type: 'missing', message: 'ファイルが存在しません' });
        return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    checkedFiles++;

    // 基本的な構文チェック
    const checks = [
        { pattern: /<\/html>/i, name: '閉じタグ </html>', required: true },
        { pattern: /<\/body>/i, name: '閉じタグ </body>', required: true },
        { pattern: /<\/head>/i, name: '閉じタグ </head>', required: true },
        { pattern: /<!DOCTYPE html>/i, name: 'DOCTYPE宣言', required: true }
    ];

    checks.forEach(check => {
        if (check.required && !check.pattern.test(content)) {
            console.log(`  ⚠️  ${path.basename(file)}: ${check.name}がありません`);
            issues.push({ file, type: 'syntax', message: `${check.name}がありません` });
        }
    });
});

console.log(`✅ ${checkedFiles}/${totalFiles} ファイルをチェック完了\n`);

// 2. リンク・ボタンの遷移先チェック
console.log('='.repeat(60));
console.log('🔗 2. リンク・ボタンの遷移先チェック');
console.log('='.repeat(60));

const linkPatterns = [
    { pattern: /href=["']([^"']+)["']/g, type: 'リンク' },
    { pattern: /@click=["']([^"']+)["']/g, type: 'クリックイベント' }
];

const brokenLinks = new Set();
const validExtensions = ['.html', '.pdf', '.jpg', '.png', '.svg', '.css', '.js'];
const externalPrefixes = ['http://', 'https://', 'mailto:', 'tel:', '#'];

htmlFiles.forEach(file => {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');

    // hrefのチェック
    const hrefMatches = content.matchAll(/href=["']([^"']+)["']/g);
    for (const match of hrefMatches) {
        const href = match[1];

        // 外部リンクやアンカーはスキップ
        if (externalPrefixes.some(prefix => href.startsWith(prefix))) continue;

        // 相対パスをチェック
        if (href.startsWith('/')) {
            const targetPath = path.join('src', href.replace(/^\//, ''));
            const targetPathWithoutQuery = targetPath.split('?')[0];

            if (validExtensions.some(ext => targetPathWithoutQuery.endsWith(ext))) {
                if (!fs.existsSync(targetPathWithoutQuery)) {
                    brokenLinks.add(`${path.basename(file)} → ${href}`);
                }
            }
        }
    }
});

if (brokenLinks.size > 0) {
    console.log('⚠️  リンク切れの可能性:');
    brokenLinks.forEach(link => {
        console.log(`  - ${link}`);
        issues.push({ type: 'broken-link', message: link });
    });
} else {
    console.log('✅ リンク切れは見つかりませんでした');
}

console.log('');

// 3. 非表示要素のチェック
console.log('='.repeat(60));
console.log('👁️  3. 非表示要素のチェック');
console.log('='.repeat(60));

const hiddenPatterns = [
    { pattern: /display:\s*none/g, name: 'display: none' },
    { pattern: /visibility:\s*hidden/g, name: 'visibility: hidden' },
    { pattern: /x-show=["']false["']/g, name: 'x-show="false"' },
    { pattern: /hidden["'\s>]/g, name: 'hidden属性' }
];

const hiddenElements = [];

htmlFiles.forEach(file => {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');

    hiddenPatterns.forEach(({ pattern, name }) => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
            // ローディング状態やモーダルなど意図的な非表示は除外
            const intentionalHidden = [
                'loading',
                'modal',
                'dropdown',
                'mobile-menu',
                'x-show=',
                'x-if='
            ];

            const isIntentional = intentionalHidden.some(keyword =>
                content.toLowerCase().includes(keyword)
            );

            if (!isIntentional) {
                hiddenElements.push({ file: path.basename(file), pattern: name, count: matches.length });
            }
        }
    });
});

if (hiddenElements.length > 0) {
    console.log('⚠️  非表示要素が見つかりました（意図的でない可能性）:');
    hiddenElements.forEach(({ file, pattern, count }) => {
        console.log(`  - ${file}: ${pattern} (${count}箇所)`);
    });
} else {
    console.log('✅ 問題のある非表示要素は見つかりませんでした');
}

console.log('');

// 4. Supabase連携チェック
console.log('='.repeat(60));
console.log('🗄️  4. Supabase連携チェック');
console.log('='.repeat(60));

const supabaseIssues = [];

htmlFiles.forEach(file => {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');

    // Supabaseを使用しているファイル
    if (content.includes('supabase') || content.includes('Supabase')) {
        const fileName = path.basename(file);

        // チェック項目
        const checks = [
            {
                pattern: /window\.supabase\.from\(/g,
                issue: 'window.supabase.from()を使用（window.supabaseClient.from()を使うべき）',
                severity: 'error'
            },
            {
                pattern: /from\s*\(\s*['"`]\w+['"`]\s*\)/g,
                check: true,
                name: 'Supabaseクエリあり'
            }
        ];

        checks.forEach(({ pattern, issue, severity, check, name }) => {
            const matches = content.match(pattern);
            if (matches && issue) {
                // plan-detail.htmlなど一部のファイルは例外
                if (fileName === 'plan-detail.html' || fileName === 'matrix.html' ||
                    fileName === 'index.html' || fileName === 'design.html' ||
                    fileName === 'downloads.html') {
                    // これらのファイルは独自のwindow.supabase初期化を使用
                    return;
                }
                supabaseIssues.push({ file: fileName, issue, severity, count: matches.length });
            }
        });
    }
});

if (supabaseIssues.length > 0) {
    console.log('⚠️  Supabase連携の問題:');
    supabaseIssues.forEach(({ file, issue, severity, count }) => {
        const icon = severity === 'error' ? '❌' : '⚠️';
        console.log(`  ${icon} ${file}: ${issue} (${count}箇所)`);
        issues.push({ file, type: 'supabase', message: issue });
    });
} else {
    console.log('✅ Supabase連携の問題は見つかりませんでした');
}

console.log('');

// 5. Alpine.jsの使用チェック
console.log('='.repeat(60));
console.log('⚡ 5. Alpine.js使用チェック');
console.log('='.repeat(60));

let alpinePages = 0;
let missingAlpine = [];

htmlFiles.forEach(file => {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);

    // Alpine.jsのディレクティブを使用しているか
    const usesAlpine = /x-data|x-show|x-if|x-for|x-bind|@click|:/.test(content);

    if (usesAlpine) {
        alpinePages++;

        // Alpine.jsのスクリプトが読み込まれているか
        const hasAlpineScript = /alpinejs/.test(content);

        if (!hasAlpineScript) {
            missingAlpine.push(fileName);
            issues.push({ file: fileName, type: 'alpine', message: 'Alpine.jsを使用しているがスクリプトが読み込まれていません' });
        }
    }
});

console.log(`📊 Alpine.js使用ページ: ${alpinePages}/${checkedFiles}`);

if (missingAlpine.length > 0) {
    console.log('❌ Alpine.jsスクリプトが不足:');
    missingAlpine.forEach(file => console.log(`  - ${file}`));
} else {
    console.log('✅ すべてのAlpine.js使用ページでスクリプトが読み込まれています');
}

console.log('');

// 総合結果
console.log('='.repeat(60));
console.log('📊 総合結果');
console.log('='.repeat(60));

const errorCount = issues.filter(i => i.severity === 'error' || i.type === 'missing' || i.type === 'syntax').length;
const warningCount = issues.length - errorCount;

console.log(`✅ チェック完了ファイル: ${checkedFiles}/${totalFiles}`);
console.log(`❌ エラー: ${errorCount}`);
console.log(`⚠️  警告: ${warningCount}`);

if (issues.length === 0) {
    console.log('\n🎉 すべてのチェックをパスしました！');
    process.exit(0);
} else {
    console.log('\n⚠️  いくつかの問題が見つかりました。上記の内容を確認してください。');

    if (errorCount > 0) {
        console.log('❌ 重大な問題があります。修正が必要です。');
        process.exit(1);
    } else {
        console.log('ℹ️  警告レベルの問題のみです。必要に応じて修正してください。');
        process.exit(0);
    }
}
