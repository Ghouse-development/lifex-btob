/**
 * Supabase Storageバケット確認スクリプト
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
    console.log('ストレージバケットを確認中...\n');

    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ エラー:', error.message);
        return;
    }

    console.log('📦 既存のバケット:');
    if (data && data.length > 0) {
        data.forEach(bucket => {
            console.log(`  - ${bucket.id} (public: ${bucket.public})`);
        });
    } else {
        console.log('  バケットが見つかりません');
    }

    // 必要なバケットの確認
    const hasImages = data?.some(b => b.id === 'plan-images');
    const hasDrawings = data?.some(b => b.id === 'plan-drawings');

    console.log('\n必要なバケット:');
    console.log(`  - plan-images: ${hasImages ? '✓ 存在' : '✗ 未作成'}`);
    console.log(`  - plan-drawings: ${hasDrawings ? '✓ 存在' : '✗ 未作成'}`);

    if (!hasImages || !hasDrawings) {
        console.log('\n⚠️  バケットが不足しています。');
        console.log('\n次のステップ:');
        console.log('1. Supabaseダッシュボードにログイン');
        console.log('2. Storage > New bucket をクリック');
        console.log('3. plan-images バケットを作成 (Public: ON)');
        console.log('4. plan-drawings バケットを作成 (Public: ON)');
        console.log('\nまたは、supabase-storage-migration.sql をSQLエディタで実行');
    } else {
        console.log('\n✅ 全てのバケットが準備完了！');
        console.log('\n次のステップ:');
        console.log('node scripts/utilities/upload-plans-to-storage.js を実行');
    }
}

checkBuckets();
