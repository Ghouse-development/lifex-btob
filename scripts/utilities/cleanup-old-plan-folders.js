import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('古いプランフォルダ削除');
console.log('========================================\n');

async function cleanupOldPlanFolders() {
    try {
        // 現在のプランコードを取得
        const { data: plans } = await supabase.from('plans').select('plan_code');
        const currentPlanCodes = new Set(plans.map(p => p.plan_code));

        console.log(`現在のプラン: ${plans.length}件`);
        plans.forEach(p => console.log(`  - ${p.plan_code}`));
        console.log('');

        const buckets = ['plan-images', 'plan-drawings'];
        let totalDeleted = 0;

        for (const bucket of buckets) {
            console.log(`🗑️  ${bucket} クリーンアップ中...`);

            const { data: items } = await supabase.storage.from(bucket).list('', { limit: 1000 });

            if (!items) continue;

            for (const item of items) {
                // "plans"フォルダはスキップ
                if (item.name === 'plans') continue;

                // plan_code形式のフォルダ（例: "35-81-N-21-042"）
                if (!currentPlanCodes.has(item.name)) {
                    console.log(`  削除フォルダ: ${item.name}`);

                    // フォルダ内のファイルを取得
                    const { data: files } = await supabase.storage.from(bucket).list(item.name, { limit: 1000 });

                    if (files && files.length > 0) {
                        const filePaths = files.map(f => `${item.name}/${f.name}`);
                        console.log(`    ファイル: ${files.length}件`);

                        const { error } = await supabase.storage.from(bucket).remove(filePaths);
                        if (error) {
                            console.log(`    ❌ エラー: ${error.message}`);
                        } else {
                            totalDeleted += files.length;
                        }
                    }

                    // フォルダ自体を削除
                    await supabase.storage.from(bucket).remove([item.name]);
                }
            }

            console.log('');
        }

        console.log('========================================');
        console.log('✅ 削除完了');
        console.log(`削除ファイル数: ${totalDeleted}`);
        console.log('========================================\n');

    } catch (err) {
        console.error('❌ エラー:', err);
    }
}

cleanupOldPlanFolders().then(() => {
    process.exit(0);
});
