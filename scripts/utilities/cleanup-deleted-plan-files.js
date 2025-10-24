import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('削除済みプランのStorageファイル削除');
console.log('========================================\n');

async function cleanupDeletedPlanFiles() {
    try {
        // 現在のプランIDを取得
        const { data: plans } = await supabase.from('plans').select('id, plan_code');

        const currentPlanIds = new Set(plans.map(p => p.id));
        console.log(`📋 現在のプラン数: ${plans.length}`);
        console.log('現在のプランID:');
        plans.forEach(p => console.log(`  - ${p.id} (${p.plan_code})`));
        console.log('');

        const buckets = ['plan-images', 'plan-drawings'];
        let totalDeleted = 0;
        let totalSize = 0;

        for (const bucket of buckets) {
            console.log(`🗑️  ${bucket} バケットをクリーンアップ中...`);

            // バケット内のすべてのフォルダを取得
            const { data: folders } = await supabase.storage.from(bucket).list('', { limit: 1000 });

            if (!folders) continue;

            for (const folder of folders) {
                // フォルダ名がplan-codeの場合はスキップ
                if (!folder.id || folder.name === 'plans') {
                    // plans/フォルダ内のファイルをチェック
                    const { data: files } = await supabase.storage.from(bucket).list('plans', { limit: 1000 });

                    if (files) {
                        for (const file of files) {
                            // ファイル名からプランIDを抽出（UUID部分）
                            const planId = file.name.split('_')[0];

                            if (!currentPlanIds.has(planId)) {
                                console.log(`  削除: plans/${file.name}`);
                                const { error } = await supabase.storage.from(bucket).remove([`plans/${file.name}`]);
                                if (!error) {
                                    totalDeleted++;
                                    totalSize += file.metadata?.size || 0;
                                }
                            }
                        }
                    }
                } else if (!currentPlanIds.has(folder.id)) {
                    // フォルダ全体を削除
                    console.log(`  削除フォルダ: ${folder.name}`);

                    // フォルダ内のファイルを取得
                    const { data: files } = await supabase.storage.from(bucket).list(folder.name, { limit: 1000 });

                    if (files && files.length > 0) {
                        const filePaths = files.map(f => `${folder.name}/${f.name}`);
                        const { error } = await supabase.storage.from(bucket).remove(filePaths);
                        if (!error) {
                            totalDeleted += files.length;
                            files.forEach(f => totalSize += f.metadata?.size || 0);
                        }
                    }

                    // 空のフォルダも削除を試みる
                    await supabase.storage.from(bucket).remove([folder.name]);
                }
            }

            console.log('');
        }

        console.log('========================================');
        console.log('✅ クリーンアップ完了');
        console.log('========================================');
        console.log(`削除ファイル数: ${totalDeleted}`);
        console.log(`削減容量: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
        console.log('========================================\n');

    } catch (err) {
        console.error('❌ エラー:', err);
    }
}

cleanupDeletedPlanFiles().then(() => {
    process.exit(0);
});
