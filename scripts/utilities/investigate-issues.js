import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('🔍 問題の詳細調査');
console.log('========================================\n');

async function investigateIssues() {
    // Issue 1 & 2: Plan data fields
    console.log('📊 プランデータ詳細');
    console.log('─────────────────────────');

    const { data: plans } = await supabase
        .from('plans')
        .select('*');

    if (plans) {
        plans.forEach(plan => {
            console.log(`\nプラン: ${plan.plan_code}`);
            console.log(`  延床面積: ${plan.construction_floor_area || '未入力'}`);
            console.log(`  敷地面積: ${plan.site_area || '未入力'}`);
            console.log(`  建築面積: ${plan.building_area || '未入力'}`);
            console.log(`  プラン名: ${plan.plan_name || '未入力'}`);
        });
    }

    console.log('\n');

    // Issue 3: FAQ table
    console.log('❓ FAQテーブル調査');
    console.log('─────────────────────────');

    const { data: faq, error: faqError } = await supabase
        .from('faq')
        .select('*');

    if (faqError) {
        console.log(`❌ エラー: ${faqError.message}`);
        console.log(`   詳細: ${faqError.details || 'なし'}`);
        console.log(`   ヒント: ${faqError.hint || 'なし'}`);
    } else {
        console.log(`✅ FAQテーブル正常 (${faq.length}件)`);
    }

    console.log('\n');

    // Issue 4: Downloads table
    console.log('📥 Downloadsテーブル調査');
    console.log('─────────────────────────');

    const { data: downloads, error: downloadsError } = await supabase
        .from('downloads')
        .select('*');

    if (downloadsError) {
        console.log(`❌ エラー: ${downloadsError.message}`);
        console.log(`   詳細: ${downloadsError.details || 'なし'}`);
        console.log(`   ヒント: ${downloadsError.hint || 'なし'}`);
    } else {
        console.log(`✅ Downloadsテーブル正常 (${downloads.length}件)`);
    }

    console.log('\n');

    // Additional checks
    console.log('🔧 追加チェック');
    console.log('─────────────────────────');

    // Check RLS policies
    const { data: policies } = await supabase
        .rpc('get_policies', {})
        .catch(() => ({ data: null }));

    console.log('テーブル存在確認:');

    const tables = ['plans', 'faq', 'rules', 'notifications', 'downloads'];
    for (const table of tables) {
        const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);

        console.log(`  ${table}: ${error ? '❌ ' + error.message : '✅ 正常'}`);
    }

    console.log('\n');
}

investigateIssues().then(() => {
    process.exit(0);
});
