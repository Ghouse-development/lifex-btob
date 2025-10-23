import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('既存プランのplan_codeをクリア');
console.log('========================================\n');

async function clearPlanCodes() {
    try {
        // 自動生成されたplan_codeをクリア
        const { data, error } = await supabase
            .from('plans')
            .update({ plan_code: null })
            .like('plan_code', 'PLAN-%')
            .select();

        if (error) {
            console.error('❌ エラー:', error.message);
            return false;
        }

        console.log(`✅ ${data.length}件のプランのplan_codeをクリアしました\n`);

        if (data.length > 0) {
            console.log('クリアされたプラン:');
            data.forEach(plan => {
                console.log(`  - ${plan.name || plan.plan_name} (ID: ${plan.id.substring(0, 8)}...)`);
            });
        }

        return true;

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
        return false;
    }
}

clearPlanCodes().then((success) => {
    console.log('\n========================================');
    if (success) {
        console.log('✅ 完了');
        console.log('\nこれで既存プランのplan_codeが空になりました。');
        console.log('必要に応じて手動で設定してください。');
    } else {
        console.log('❌ 失敗');
    }
    console.log('========================================\n');
    process.exit(success ? 0 : 1);
});
