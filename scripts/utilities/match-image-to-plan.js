import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('画像とプランのマッチング');
console.log('========================================\n');

async function matchImageToPlan() {
    // プラン一覧取得
    const { data: plans } = await supabase.from('plans').select('*');

    console.log('📋 プラン一覧:');
    plans.forEach(p => {
        console.log(`  ${p.id} → ${p.plan_code}`);
    });

    console.log('\n');

    // Storage内の画像
    const { data: files } = await supabase.storage
        .from('plan-images')
        .list('plans', { limit: 100 });

    if (files && files.length > 0) {
        console.log('🖼️  Storage内の画像:');

        files.forEach(file => {
            console.log(`\nファイル名: ${file.name}`);

            // ファイル名からプランIDを抽出
            const planId = file.name.split('_')[0];
            console.log(`  抽出されたプランID: ${planId}`);

            // マッチするプランを検索
            const matchingPlan = plans.find(p => p.id === planId);

            if (matchingPlan) {
                console.log(`  ✅ マッチ: ${matchingPlan.plan_code}`);

                // 公開URL
                const { data: urlData } = supabase.storage
                    .from('plan-images')
                    .getPublicUrl(`plans/${file.name}`);

                console.log(`  公開URL: ${urlData.publicUrl}`);

                // DBの状態確認
                console.log(`\n  📊 DB内のimagesフィールド:`);
                console.log(`     ${JSON.stringify(matchingPlan.images)}`);

                // 修正が必要か判定
                const needsUpdate = !matchingPlan.images?.exterior || matchingPlan.images.exterior === '';

                if (needsUpdate) {
                    console.log(`\n  ⚠️  imagesフィールドが空です！更新が必要です。`);
                    console.log(`     正しいURL: ${urlData.publicUrl}`);
                }
            } else {
                console.log(`  ❌ マッチするプランなし（削除済みの可能性）`);
            }
        });
    } else {
        console.log('❌ Storage内に画像がありません');
    }

    console.log('\n========================================\n');
}

matchImageToPlan().then(() => {
    process.exit(0);
});
