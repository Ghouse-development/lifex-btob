import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('Storage内の全ファイル一覧');
console.log('========================================\n');

async function listAllFiles() {
    const buckets = ['plan-images', 'plan-drawings'];

    for (const bucket of buckets) {
        console.log(`\n📦 ${bucket} バケット`);
        console.log('─────────────────────────');

        // plans/ フォルダ内を確認
        const { data: plansFolder } = await supabase.storage
            .from(bucket)
            .list('plans', { limit: 100 });

        if (plansFolder && plansFolder.length > 0) {
            console.log(`  plans/ フォルダ: ${plansFolder.length}ファイル`);
            plansFolder.forEach(file => {
                const sizeKB = (file.metadata?.size / 1024).toFixed(2);
                console.log(`    - ${file.name} (${sizeKB}KB)`);

                // 公開URLを生成
                const { data: urlData } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(`plans/${file.name}`);

                console.log(`      URL: ${urlData.publicUrl}`);
            });
        } else {
            console.log('  plans/ フォルダ: ファイルなし');
        }

        // ルート直下も確認
        const { data: rootFiles } = await supabase.storage
            .from(bucket)
            .list('', { limit: 100 });

        if (rootFiles) {
            const filesOnly = rootFiles.filter(f => f.id); // フォルダを除外
            if (filesOnly.length > 0) {
                console.log(`\n  ルート直下: ${filesOnly.length}ファイル`);
                filesOnly.forEach(file => {
                    const sizeKB = (file.metadata?.size / 1024).toFixed(2);
                    console.log(`    - ${file.name} (${sizeKB}KB)`);
                });
            }
        }
    }

    console.log('\n========================================\n');
}

listAllFiles().then(() => {
    process.exit(0);
});
