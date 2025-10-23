import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const client = createClient(supabaseUrl, supabaseServiceKey);

async function fixAll() {
    console.log('========================================');
    console.log('プランRLS + FAQ重複修正');
    console.log('========================================\n');

    // 1. Plans RLS Policy
    console.log('1️⃣ プランテーブルのRLSポリシー修正...');
    console.log('⚠️  RLSポリシーはSupabase Dashboardで手動実行が必要です');
    console.log('   SQL Editor で以下を実行してください:');
    console.log('   ```sql');
    console.log('   DROP POLICY IF EXISTS "Anyone can view published plans" ON plans;');
    console.log('   CREATE POLICY "Anyone can view published plans"');
    console.log('   ON plans FOR SELECT');
    console.log('   USING (status = \'published\' OR auth.uid() IS NOT NULL);');
    console.log('   ```\n');

    // 2. Remove duplicate FAQ categories
    console.log('2️⃣ FAQ重複カテゴリの削除...');

    // Get all categories
    const { data: categories, error: catError } = await client
        .from('faq_categories')
        .select('*')
        .order('name')
        .order('created_at');

    if (catError) {
        console.error('❌ カテゴリ取得エラー:', catError.message);
        return;
    }

    console.log(`   現在のカテゴリ数: ${categories.length}件`);

    // Group by name and find duplicates
    const seen = new Set();
    const toDelete = [];

    for (const cat of categories) {
        if (seen.has(cat.name)) {
            toDelete.push(cat.id);
            console.log(`   削除予定: ${cat.name} (ID: ${cat.id})`);
        } else {
            seen.add(cat.name);
        }
    }

    if (toDelete.length > 0) {
        const { error: deleteError } = await client
            .from('faq_categories')
            .delete()
            .in('id', toDelete);

        if (deleteError) {
            console.error('❌ 削除エラー:', deleteError.message);
        } else {
            console.log(`✅ ${toDelete.length}件の重複カテゴリを削除しました`);
        }
    } else {
        console.log('✅ 重複カテゴリはありませんでした');
    }

    // 3. Verify
    console.log('\n3️⃣ 確認...');

    const { data: finalCategories, error: finalError } = await client
        .from('faq_categories')
        .select('*')
        .order('display_order');

    if (finalError) {
        console.error('❌ 確認エラー:', finalError.message);
    } else {
        console.log(`✅ 残りのFAQカテゴリ: ${finalCategories.length}件`);
        finalCategories.forEach(cat => {
            console.log(`   - ${cat.name} (ID: ${cat.id})`);
        });
    }

    console.log('\n========================================');
    console.log('完了');
    console.log('========================================');
}

fixAll().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
