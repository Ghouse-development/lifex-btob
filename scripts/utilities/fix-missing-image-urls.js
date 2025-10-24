import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('画像URL修復スクリプト');
console.log('========================================\n');

async function fixMissingImageUrls() {
    // プラン一覧取得
    const { data: plans } = await supabase.from('plans').select('*');

    // Storage内の画像
    const { data: files } = await supabase.storage
        .from('plan-images')
        .list('plans', { limit: 100 });

    let fixedCount = 0;

    if (files && files.length > 0) {
        for (const file of files) {
            // ファイル名からプランIDを抽出
            const planId = file.name.split('_')[0];
            const imageType = file.name.split('_')[1]; // exterior or interior

            // マッチするプランを検索
            const matchingPlan = plans.find(p => p.id === planId);

            if (matchingPlan) {
                // 公開URL
                const { data: urlData } = supabase.storage
                    .from('plan-images')
                    .getPublicUrl(`plans/${file.name}`);

                const publicUrl = urlData.publicUrl;

                // 現在のimagesフィールドの値
                const currentImages = matchingPlan.images || {};
                const currentUrl = currentImages[imageType];

                // URLが空または異なる場合は更新
                if (!currentUrl || currentUrl === '' || currentUrl !== publicUrl) {
                    console.log(`🔧 修復: ${matchingPlan.plan_code}`);
                    console.log(`   タイプ: ${imageType}`);
                    console.log(`   現在: ${currentUrl || '空'}`);
                    console.log(`   新規: ${publicUrl}`);

                    // 新しいimagesオブジェクト
                    const newImages = {
                        ...currentImages,
                        [imageType]: publicUrl
                    };

                    // データベース更新
                    const { error } = await supabase
                        .from('plans')
                        .update({
                            images: newImages,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', planId);

                    if (error) {
                        console.log(`   ❌ エラー: ${error.message}`);
                    } else {
                        console.log(`   ✅ 更新成功\n`);
                        fixedCount++;
                    }
                }
            }
        }
    }

    console.log('========================================');
    console.log(`修復完了: ${fixedCount}件`);
    console.log('========================================\n');
}

fixMissingImageUrls().then(() => {
    process.exit(0);
});
