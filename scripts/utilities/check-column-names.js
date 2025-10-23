import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('カラム名の確認');
console.log('========================================\n');

async function checkColumns() {
    try {
        const { data, error } = await supabase
            .from('plans')
            .select('plan_code, width, depth, maguchi, oku_yuki');

        if (error) {
            console.error('❌ エラー:', error.message);
            return;
        }

        console.log('プランデータ:\n');
        data.forEach(plan => {
            console.log('プランコード:', plan.plan_code || '(未設定)');
            console.log('  width:', plan.width ?? '❌ カラムなし');
            console.log('  depth:', plan.depth ?? '❌ カラムなし');
            console.log('  maguchi:', plan.maguchi ?? '❌ カラムなし');
            console.log('  oku_yuki:', plan.oku_yuki ?? '❌ カラムなし');
            console.log('');
        });

        console.log('========================================');
        console.log('結論:');
        console.log('admin-plans.html は width/depth に保存');
        console.log('matrix.html は maguchi/oku_yuki を参照');
        console.log('→ カラム名の不一致が原因！');
        console.log('========================================\n');

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
    }
}

checkColumns().then(() => {
    process.exit(0);
});
