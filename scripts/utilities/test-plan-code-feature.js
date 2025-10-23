import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('プランコード機能テスト');
console.log('========================================\n');

async function testPlanCode() {
    try {
        const testId = crypto.randomUUID();
        const testPlanCode = 'TEST-001';

        console.log('📋 テストプランを作成中...\n');
        console.log('  UUID:', testId);
        console.log('  プランコード:', testPlanCode);
        console.log('');

        const testData = {
            id: testId,
            plan_code: testPlanCode,
            plan_name: 'テストプラン 30坪 3LDK',
            name: 'テストプラン 30坪 3LDK',
            tsubo: 30,
            total_floor_area: 99.17,
            construction_floor_area: 109.09,
            floors: 2,
            layout: '3LDK',
            ldk_floor: 1,
            bathroom_floor: 1,
            price: 25000000,
            sell_price: 25000000,
            cost: 18000000,
            gross_profit: 7000000,
            status: 'draft',
            tags: ['テスト'],
            images: {},
            floor_plans: [],
            files: {},
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('plans')
            .insert(testData)
            .select()
            .single();

        if (error) {
            console.log('❌ INSERT失敗\n');
            console.log('エラーコード:', error.code);
            console.log('エラーメッセージ:', error.message);
            return false;
        }

        console.log('✅ INSERT成功！\n');
        console.log('挿入されたプラン:');
        console.log('  - UUID:', data.id);
        console.log('  - プランコード:', data.plan_code);
        console.log('  - プラン名:', data.name);
        console.log('  - 坪数:', data.tsubo);
        console.log('');

        // 重複チェックテスト
        console.log('🔄 重複チェックテスト中...\n');
        const { error: dupError } = await supabase
            .from('plans')
            .insert({
                ...testData,
                id: crypto.randomUUID()
            })
            .select()
            .single();

        if (dupError) {
            if (dupError.code === '23505') {
                console.log('✅ 重複チェック成功！（UNIQUE制約が機能）\n');
            } else {
                console.log('⚠️  予期しないエラー:', dupError.message, '\n');
            }
        } else {
            console.log('❌ 重複チェック失敗（UNIQUE制約が機能していない）\n');
        }

        // テストデータ削除
        console.log('🗑️  テストデータを削除中...\n');
        const { error: deleteError } = await supabase
            .from('plans')
            .delete()
            .eq('id', testId);

        if (deleteError) {
            console.log('⚠️  削除失敗:', deleteError.message);
        } else {
            console.log('✅ テストデータ削除完了\n');
        }

        return true;

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
        return false;
    }
}

testPlanCode().then((success) => {
    console.log('========================================');
    if (success) {
        console.log('✅ プランコード機能は正常に動作しています');
    } else {
        console.log('❌ テスト失敗');
    }
    console.log('========================================\n');
    process.exit(success ? 0 : 1);
});
