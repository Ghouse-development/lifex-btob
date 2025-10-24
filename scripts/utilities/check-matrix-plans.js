import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('========================================');
console.log('マトリックス表示チェック');
console.log('========================================\n');

async function checkMatrixPlans() {
    // 1. 全プランデータ取得
    console.log('📋 全プランデータ取得 (anonキー使用)');
    const { data: allPlans, error: allError } = await supabase
        .from('plans')
        .select('*');

    if (allError) {
        console.error('❌ エラー:', allError.message);
        return;
    }

    console.log(`   総数: ${allPlans.length}件\n`);

    // 2. ステータス別集計
    console.log('📊 ステータス別集計');
    const statusCount = {};
    allPlans.forEach(p => {
        const status = p.status || 'null';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });

    Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}件`);
    });
    console.log('');

    // 3. 各プランの詳細
    console.log('📝 プラン詳細');
    allPlans.forEach(plan => {
        console.log(`\nプランコード: ${plan.plan_code}`);
        console.log(`  プラン名: ${plan.plan_name}`);
        console.log(`  ステータス: ${plan.status || '未設定'}`);
        console.log(`  延床面積: ${plan.construction_floor_area} ㎡`);
        console.log(`  敷地面積: ${plan.site_area || '未入力'} ㎡`);
        console.log(`  建築面積: ${plan.building_area || '未入力'} ㎡`);
        console.log(`  更新日: ${plan.updated_at}`);
    });

    console.log('\n');

    // 4. マトリックス表示条件チェック
    console.log('🔍 マトリックス表示条件チェック');
    console.log('   条件: status が "active" または "published"');

    const displayablePlans = allPlans.filter(p =>
        p.status === 'active' || p.status === 'published'
    );

    console.log(`   表示可能: ${displayablePlans.length}件`);

    if (displayablePlans.length === 0) {
        console.log('\n⚠️  表示可能なプランがありません！');
        console.log('   解決策: プランのstatusを "active" または "published" に変更してください。');
    } else {
        console.log('\n✅ 表示可能なプランがあります');
        displayablePlans.forEach(p => {
            console.log(`   - ${p.plan_code} (status: ${p.status})`);
        });
    }

    console.log('\n========================================\n');
}

checkMatrixPlans().then(() => {
    process.exit(0);
});
