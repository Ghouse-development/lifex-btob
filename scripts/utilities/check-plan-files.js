import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('プランファイルデータチェック');
console.log('========================================\n');

async function checkPlanFiles() {
    try {
        const { data, error } = await supabase
            .from('plans')
            .select('id, plan_code, plan_name, images, files');

        if (error) {
            console.error('❌ エラー:', error.message);
            return;
        }

        console.log(`📊 プラン数: ${data.length}\n`);

        data.forEach((plan, i) => {
            console.log(`${i+1}. ${plan.plan_code || plan.id.substring(0, 8)}`);
            console.log(`   プラン名: ${plan.plan_name}`);
            console.log(`   images:`, plan.images ? JSON.stringify(plan.images, null, 2) : '❌ 未設定');
            console.log(`   files:`, plan.files ? JSON.stringify(plan.files, null, 2) : '❌ 未設定');
            console.log('');
        });

        console.log('========================================\n');

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
    }
}

checkPlanFiles().then(() => {
    process.exit(0);
});
