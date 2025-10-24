import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('Supabase Storage ファイル一覧');
console.log('========================================\n');

async function listStorageFiles() {
    try {
        console.log('📦 plan-images バケットのファイル:');
        const { data: images, error: imagesError } = await supabase.storage
            .from('plan-images')
            .list('', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (imagesError) {
            console.error('❌ エラー:', imagesError.message);
        } else if (!images || images.length === 0) {
            console.log('  ファイルなし\n');
        } else {
            console.log(`  ${images.length}件のファイル:\n`);
            images.forEach((file, i) => {
                console.log(`  ${i+1}. ${file.name}`);
                console.log(`     サイズ: ${Math.round(file.metadata?.size / 1024)}KB`);
                console.log(`     作成日: ${file.created_at}`);
            });
        }

        console.log('\n📦 plan-drawings バケットのファイル:');
        const { data: drawings, error: drawingsError } = await supabase.storage
            .from('plan-drawings')
            .list('', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (drawingsError) {
            console.error('❌ エラー:', drawingsError.message);
        } else if (!drawings || drawings.length === 0) {
            console.log('  ファイルなし\n');
        } else {
            console.log(`  ${drawings.length}件のファイル:\n`);
            drawings.forEach((file, i) => {
                console.log(`  ${i+1}. ${file.name}`);
                console.log(`     サイズ: ${Math.round(file.metadata?.size / 1024)}KB`);
                console.log(`     作成日: ${file.created_at}`);
            });
        }

        console.log('\n========================================\n');

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
    }
}

listStorageFiles().then(() => {
    process.exit(0);
});
