#!/usr/bin/env node

/**
 * 統計データ取得ロジックの分析
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 統計データ取得ロジックを分析中...\n');

const files = {
    'admin.html': 'src/admin.html',
    'admin-report.html': 'src/admin-report.html'
};

const analysis = {};

Object.entries(files).forEach(([name, filePath]) => {
    const fullPath = path.join(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');

    console.log('='.repeat(70));
    console.log(`📄 ${name}`);
    console.log('='.repeat(70));

    // loadStats関数の内容を抽出
    const loadStatsMatch = content.match(/async loadStats\(\)\s*\{([\s\S]*?)(?=\n\s{16,20}\})/);

    if (loadStatsMatch) {
        const statsLogic = loadStatsMatch[1];

        // プラン統計の取得方法
        const planQueryMatch = statsLogic.match(/\/\/ プラン統計[\s\S]*?\.from\(['"]plans['"]\)([\s\S]*?)(?=\.select)/);
        const planSelectMatch = statsLogic.match(/\.from\(['"]plans['"]\)[\s\S]*?\.select\((.*?)\)/);

        console.log('📊 プラン統計の取得方法:');
        if (planSelectMatch) {
            console.log(`   SELECT: ${planSelectMatch[1].trim()}`);
        }

        // プラン数の計算方法
        const planCountMatch = statsLogic.match(/this\.stats\.(plans|totalPlans)\s*=\s*([^;]+)/);
        if (planCountMatch) {
            console.log(`   カウント方法: ${planCountMatch[2].trim()}`);
        }

        // 今月のプラン計算
        const monthPlanMatch = statsLogic.match(/this\.stats\.(plansUpdated|plansThisMonth)\s*=\s*([^;]+)/);
        if (monthPlanMatch) {
            console.log(`   今月のプラン: ${monthPlanMatch[2].trim()}`);
        }

        // FAQ統計
        const faqQueryMatch = statsLogic.match(/\.from\(['"]faqs['"]\)[\s\S]*?\.select\((.*?)\)/);
        console.log('\n📚 FAQ統計の取得方法:');
        if (faqQueryMatch) {
            console.log(`   SELECT: ${faqQueryMatch[1].trim()}`);
        }

        const faqCountMatch = statsLogic.match(/this\.stats\.(faqs|totalFaqs)\s*=\s*([^;]+)/);
        if (faqCountMatch) {
            console.log(`   カウント方法: ${faqCountMatch[2].trim()}`);
        }

        // ルール統計
        const ruleQueryMatch = statsLogic.match(/\.from\(['"]rules['"]\)[\s\S]*?\.select\((.*?)\)/);
        console.log('\n📋 ルール統計の取得方法:');
        if (ruleQueryMatch) {
            console.log(`   SELECT: ${ruleQueryMatch[1].trim()}`);
        }

        const ruleCountMatch = statsLogic.match(/this\.stats\.(rules|totalRules)\s*=\s*([^;]+)/);
        if (ruleCountMatch) {
            console.log(`   カウント方法: ${ruleCountMatch[2].trim()}`);
        }

        // ダウンロード統計
        console.log('\n📥 ダウンロード統計の取得方法:');

        // Supabaseから取得する場合
        const downloadQueryMatch = statsLogic.match(/\.from\(['"]downloads['"]\)[\s\S]*?\.select\((.*?)\)/);
        if (downloadQueryMatch) {
            console.log(`   データソース: Supabase`);
            console.log(`   SELECT: ${downloadQueryMatch[1].trim()}`);
        }

        // localStorageから取得する場合
        const localStorageMatch = statsLogic.match(/localStorage\.getItem\(['"]downloads_data['"]\)/);
        if (localStorageMatch) {
            console.log(`   データソース: localStorage (downloads_data)`);
        }

        const downloadCountMatch = statsLogic.match(/this\.stats\.(downloads|totalDownloads)\s*=\s*([^;]+)/);
        if (downloadCountMatch) {
            console.log(`   カウント方法: ${downloadCountMatch[2].trim()}`);
        }

        analysis[name] = {
            hasSupabaseQueries: content.includes('.from('),
            hasLocalStorage: content.includes('localStorage.getItem'),
            usesPublishedFilter: content.includes("status === 'published'"),
            usesActiveFilter: content.includes("status === 'active'")
        };
    }

    console.log('');
});

console.log('='.repeat(70));
console.log('🔍 データソース比較');
console.log('='.repeat(70));

Object.entries(analysis).forEach(([name, data]) => {
    console.log(`\n📄 ${name}:`);
    console.log(`   Supabaseクエリ使用: ${data.hasSupabaseQueries ? '✅' : '❌'}`);
    console.log(`   localStorage使用: ${data.hasLocalStorage ? '✅' : '❌'}`);
    console.log(`   公開中フィルタ: ${data.usesPublishedFilter ? '✅' : '❌'}`);
    console.log(`   有効フィルタ: ${data.usesActiveFilter ? '✅' : '❌'}`);
});

console.log('\n' + '='.repeat(70));
console.log('⚠️  注意点');
console.log('='.repeat(70));
console.log('');
console.log('- admin.htmlとadmin-report.htmlで異なるデータソースを使用している場合、');
console.log('  統計数値が一致しない可能性があります');
console.log('- フィルタ条件（published, activeなど）の有無で数値が変わります');
console.log('- localStorageとSupabaseの両方を使用している場合、同期問題が発生する');
console.log('  可能性があります');
