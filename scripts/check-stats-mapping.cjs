#!/usr/bin/env node

/**
 * 統計データのプロパティ名マッピングチェック
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 統計データのプロパティ名をチェック中...\n');

const files = [
    'src/admin.html',
    'src/admin-report.html'
];

const results = {};

files.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');

    console.log('='.repeat(60));
    console.log(`📄 ${filePath}`);
    console.log('='.repeat(60));

    // Alpine.jsのstatsオブジェクト定義を探す
    const statsDefMatch = content.match(/stats:\s*\{([^}]+)\}/s);
    if (statsDefMatch) {
        const statsDef = statsDefMatch[1];
        const properties = statsDef.match(/(\w+):\s*[^,\n}]+/g) || [];

        console.log('✅ statsオブジェクトのプロパティ:');
        properties.forEach(prop => {
            const propName = prop.split(':')[0].trim();
            console.log(`   - ${propName}`);
        });

        results[filePath] = {
            defined: properties.map(p => p.split(':')[0].trim())
        };
    }

    // HTML内でx-text="stats.xxx"として使われているプロパティを探す
    const usageMatches = content.matchAll(/x-text="stats\.(\w+)"/g);
    const usedProperties = new Set();

    for (const match of usageMatches) {
        usedProperties.add(match[1]);
    }

    if (usedProperties.size > 0) {
        console.log('\n📊 HTML内で使用されているプロパティ:');
        usedProperties.forEach(prop => {
            console.log(`   - ${prop}`);
        });

        results[filePath] = results[filePath] || {};
        results[filePath].used = Array.from(usedProperties);
    }

    // 不一致チェック
    if (results[filePath]?.defined && results[filePath]?.used) {
        const defined = new Set(results[filePath].defined);
        const used = new Set(results[filePath].used);

        const missing = Array.from(used).filter(p => !defined.has(p));
        const unused = Array.from(defined).filter(p => !used.has(p));

        if (missing.length > 0) {
            console.log('\n❌ 定義されていないが使用されているプロパティ:');
            missing.forEach(prop => console.log(`   - ${prop}`));
        }

        if (unused.length > 0) {
            console.log('\n⚠️  定義されているが使用されていないプロパティ:');
            unused.forEach(prop => console.log(`   - ${prop}`));
        }

        if (missing.length === 0 && unused.length === 0) {
            console.log('\n✅ すべてのプロパティが正しくマッピングされています');
        }
    }

    console.log('');
});

console.log('='.repeat(60));
console.log('総合結果');
console.log('='.repeat(60));

let hasIssues = false;
Object.entries(results).forEach(([file, data]) => {
    if (data.defined && data.used) {
        const defined = new Set(data.defined);
        const used = new Set(data.used);
        const missing = Array.from(used).filter(p => !defined.has(p));

        if (missing.length > 0) {
            console.log(`❌ ${file}: ${missing.length}個のマッピングエラー`);
            hasIssues = true;
        } else {
            console.log(`✅ ${file}: OK`);
        }
    }
});

if (hasIssues) {
    console.log('\n⚠️  マッピングエラーが見つかりました');
    process.exit(1);
} else {
    console.log('\n✅ すべてのファイルで統計データのマッピングは正しく設定されています');
    process.exit(0);
}
