import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const client = createClient(supabaseUrl, supabaseAnonKey);

console.log('========================================');
console.log('🔍 データ表示問題診断');
console.log('========================================\n');

async function checkTable(tableName, expectedStatus, categoryTable = null) {
    console.log(`\n📊 ${tableName} テーブル\n`);

    try {
        // 1. 全データ取得（RLSチェック）
        const { data: allData, error: allError, count: allCount } = await client
            .from(tableName)
            .select('*', { count: 'exact' });

        if (allError) {
            console.error(`   ❌ エラー: ${allError.message}`);
            console.error(`      コード: ${allError.code}`);
            console.error(`      詳細: ${allError.details}`);
            return;
        }

        console.log(`   ✅ 取得成功: ${allCount}件`);

        if (!allData || allData.length === 0) {
            console.log(`   ⚠️  データが0件です`);
            return;
        }

        // 2. ステータス別集計
        if (expectedStatus) {
            const statusCounts = {};
            allData.forEach(row => {
                const status = row.status || 'null';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });

            console.log(`\n   📈 ステータス別:`);
            Object.entries(statusCounts).forEach(([status, count]) => {
                const isExpected = expectedStatus.includes(status);
                const icon = isExpected ? '✅' : '⚠️';
                console.log(`      ${icon} ${status}: ${count}件`);
            });

            const publishedCount = statusCounts[expectedStatus[0]] || 0;
            if (publishedCount === 0) {
                console.log(`\n   🚨 公開データが0件！公開ページに表示されません`);
            }
        }

        // 3. カテゴリチェック
        if (categoryTable) {
            const { data: categories } = await client.from(categoryTable).select('id, name');
            const categoryIds = new Set(categories.map(c => c.id));

            const nullCategories = allData.filter(row => !row.category_id);
            const invalidCategories = allData.filter(row =>
                row.category_id && !categoryIds.has(row.category_id)
            );

            if (nullCategories.length > 0) {
                console.log(`\n   ⚠️  category_id が null: ${nullCategories.length}件`);
                nullCategories.forEach(row => {
                    console.log(`      ID: ${row.id}`);
                });
            }

            if (invalidCategories.length > 0) {
                console.log(`\n   ❌ 不正なcategory_id: ${invalidCategories.length}件`);
                invalidCategories.forEach(row => {
                    console.log(`      ID: ${row.id}, category_id: ${row.category_id}`);
                });
            }

            if (nullCategories.length === 0 && invalidCategories.length === 0) {
                console.log(`\n   ✅ category_id: 全て正常`);
            }
        }

        // 4. サンプルデータ表示
        console.log(`\n   🔍 サンプルデータ (最初の2件):`);
        allData.slice(0, 2).forEach((row, idx) => {
            console.log(`\n      【${idx + 1}】`);
            Object.entries(row).forEach(([key, value]) => {
                if (key === 'created_at' || key === 'updated_at') return;
                const displayValue = typeof value === 'string' && value.length > 50
                    ? value.substring(0, 50) + '...'
                    : value;
                console.log(`         ${key}: ${displayValue}`);
            });
        });

    } catch (error) {
        console.error(`   ❌ 予期しないエラー:`, error);
    }
}

async function diagnose() {
    // プランチェック
    await checkTable('plans', ['published', 'draft']);

    // ルールチェック
    await checkTable('rules', ['active', 'inactive', 'draft'], 'rule_categories');

    // FAQチェック
    await checkTable('faqs', ['published', 'draft', 'archived'], 'faq_categories');

    // カテゴリチェック
    console.log(`\n\n========================================`);
    console.log('📂 カテゴリテーブル');
    console.log('========================================');

    for (const table of ['rule_categories', 'faq_categories']) {
        const { data, error } = await client.from(table).select('*');
        if (error) {
            console.log(`\n❌ ${table}: エラー - ${error.message}`);
        } else {
            console.log(`\n✅ ${table}: ${data.length}件`);
            data.forEach(cat => {
                console.log(`   - ${cat.name} (${cat.id})`);
            });
        }
    }

    // まとめ
    console.log(`\n\n========================================`);
    console.log('📝 診断まとめ');
    console.log('========================================\n');

    const { data: plans } = await client.from('plans').select('*', { count: 'exact' });
    const { data: rules } = await client.from('rules').select('*', { count: 'exact' });
    const { data: faqs } = await client.from('faqs').select('*', { count: 'exact' });

    const publishedPlans = plans?.filter(p => p.status === 'published').length || 0;
    const activeRules = rules?.filter(r => r.status === 'active').length || 0;
    const publishedFaqs = faqs?.filter(f => f.status === 'published').length || 0;

    console.log(`プラン: 公開 ${publishedPlans}件 / 全${plans?.length || 0}件`);
    console.log(`ルール: 公開 ${activeRules}件 / 全${rules?.length || 0}件`);
    console.log(`FAQ: 公開 ${publishedFaqs}件 / 全${faqs?.length || 0}件`);

    console.log('\n');

    if (publishedPlans === 0) {
        console.log('🚨 プランが公開ページに表示されない理由:');
        console.log('   → status="published" のデータが0件');
    }
    if (activeRules === 0) {
        console.log('🚨 ルールが公開ページに表示されない理由:');
        console.log('   → status="active" のデータが0件');
    }
    if (publishedFaqs === 0) {
        console.log('🚨 FAQが公開ページに表示されない理由:');
        console.log('   → status="published" のデータが0件');
    }

    if (publishedPlans === 0 && activeRules === 0 && publishedFaqs === 0) {
        console.log('\n🔴 全ての公開データが0件です！');
        console.log('   管理画面でデータを登録・公開してください。');
    } else {
        console.log('\n✅ データは存在します');
        console.log('   表示されない場合は、JavaScriptエラーをチェックしてください');
    }
}

diagnose().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('診断エラー:', error);
    process.exit(1);
});
