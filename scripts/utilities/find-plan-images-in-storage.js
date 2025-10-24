import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const planCodes = ['12-22-N11-20', '35-50-E-11-046'];

console.log('========================================');
console.log('プラン画像検索');
console.log('========================================\n');

async function findPlanImages() {
    for (const planCode of planCodes) {
        console.log(`🔍 ${planCode} を検索中...`);

        // 各種命名パターンで検索
        const patterns = [
            planCode,  // そのまま
            planCode.replace(/-/g, ''),  // ハイフンなし
            planCode.replace('N11', '-N-11').replace('E-11', '-E-11'),  // 正規化
        ];

        for (const pattern of patterns) {
            console.log(`  パターン: ${pattern}`);

            // フォルダ内を検索
            const { data: files, error } = await supabase.storage
                .from('plan-images')
                .list(pattern, {
                    limit: 100
                });

            if (!error && files && files.length > 0) {
                console.log(`  ✅ 見つかりました！`);
                files.forEach(file => {
                    console.log(`     - ${file.name} (${Math.round(file.metadata?.size / 1024) || '?'}KB)`);

                    // 公開URLを取得
                    const { data: urlData } = supabase.storage
                        .from('plan-images')
                        .getPublicUrl(`${pattern}/${file.name}`);

                    console.log(`       URL: ${urlData.publicUrl}`);
                });
            }
        }

        console.log('');
    }

    console.log('========================================\n');
}

findPlanImages().then(() => {
    process.exit(0);
});
