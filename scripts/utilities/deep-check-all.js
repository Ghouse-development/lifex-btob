import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

const criticalTables = {
    plans: { expectAnon: true, reason: '公開ページで表示' },
    rules: { expectAnon: true, reason: '公開ページで表示' },
    rule_categories: { expectAnon: true, reason: '公開ページで表示' },
    faqs: { expectAnon: true, reason: '公開ページで表示' },
    faq_categories: { expectAnon: true, reason: '公開ページで表示' },
    downloads: { expectAnon: false, reason: '認証ユーザーのみ' },
    download_categories: { expectAnon: false, reason: '認証ユーザーのみ' }
};

async function deepCheck() {
    console.log('========================================');
    console.log('🔍 深層チェック開始');
    console.log('========================================\n');

    const issues = [];
    const warnings = [];

    for (const [tableName, config] of Object.entries(criticalTables)) {
        console.log(`\n📋 ${tableName} をチェック中...`);

        // Service role check
        const { data: serviceData, error: serviceError, count: serviceCount } = await serviceClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (serviceError) {
            issues.push(`❌ ${tableName}: サービスロールでアクセス不可 - ${serviceError.message}`);
            console.log(`   ❌ サービスロール: エラー`);
            continue;
        }

        console.log(`   ✅ サービスロール: ${serviceCount || 0}件`);

        // Anon check
        const { data: anonData, error: anonError, count: anonCount } = await anonClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (config.expectAnon) {
            if (anonError || anonCount === 0) {
                issues.push(`❌ ${tableName}: 匿名アクセスできない（理由: ${config.reason}）`);
                console.log(`   ❌ 匿名ユーザー: アクセス不可または0件`);
            } else {
                console.log(`   ✅ 匿名ユーザー: ${anonCount}件`);
            }
        } else {
            if (!anonError && anonCount > 0) {
                warnings.push(`⚠️  ${tableName}: 匿名ユーザーがアクセス可能（理由: ${config.reason}）`);
                console.log(`   ⚠️  匿名ユーザー: ${anonCount}件（想定外）`);
            } else {
                console.log(`   ✅ 匿名ユーザー: アクセス不可（正常）`);
            }
        }

        // Data existence check
        if (serviceCount === 0 && ['plans', 'rules', 'faqs'].includes(tableName)) {
            warnings.push(`⚠️  ${tableName}: データが0件です`);
        }
    }

    // Check for data consistency
    console.log('\n\n========================================');
    console.log('📊 データ整合性チェック');
    console.log('========================================\n');

    // Rules with categories
    const { data: rules } = await serviceClient
        .from('rules')
        .select('*, rule_categories(name)');

    if (rules) {
        const rulesWithoutCategory = rules.filter(r => !r.rule_categories);
        if (rulesWithoutCategory.length > 0) {
            warnings.push(`⚠️  ${rulesWithoutCategory.length}件のルールがカテゴリに紐付いていません`);
            console.log(`⚠️  カテゴリなしルール: ${rulesWithoutCategory.length}件`);
        } else {
            console.log(`✅ 全ルールがカテゴリに紐付いています`);
        }
    }

    // FAQs with categories
    const { data: faqs } = await serviceClient
        .from('faqs')
        .select('*, faq_categories(name)');

    if (faqs) {
        const faqsWithoutCategory = faqs.filter(f => !f.faq_categories);
        if (faqsWithoutCategory.length > 0) {
            warnings.push(`⚠️  ${faqsWithoutCategory.length}件のFAQがカテゴリに紐付いていません`);
            console.log(`⚠️  カテゴリなしFAQ: ${faqsWithoutCategory.length}件`);
        } else {
            console.log(`✅ 全FAQがカテゴリに紐付いています（またはFAQが0件）`);
        }
    }

    // Summary
    console.log('\n\n========================================');
    console.log('📝 診断結果サマリー');
    console.log('========================================\n');

    if (issues.length === 0 && warnings.length === 0) {
        console.log('✅ 問題は見つかりませんでした！');
    } else {
        if (issues.length > 0) {
            console.log('🚨 重大な問題:');
            issues.forEach(issue => console.log('   ' + issue));
            console.log('');
        }

        if (warnings.length > 0) {
            console.log('⚠️  警告:');
            warnings.forEach(warning => console.log('   ' + warning));
            console.log('');
        }
    }

    console.log('\n完了。');
    return { issues, warnings };
}

deepCheck().then(({ issues, warnings }) => {
    process.exit(issues.length > 0 ? 1 : 0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
