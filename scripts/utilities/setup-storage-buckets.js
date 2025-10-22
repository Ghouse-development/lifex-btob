/**
 * Supabase Storageバケット設定スクリプト
 *
 * 実行方法:
 * node scripts/utilities/setup-storage-buckets.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase接続情報
const supabaseUrl = process.env.SUPABASE_URL || 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorageBuckets() {
    console.log('========================================');
    console.log('Supabase Storageバケット設定開始');
    console.log('========================================\n');

    try {
        // plan-imagesバケットを作成
        console.log('📦 plan-images バケットを作成中...');
        const { data: bucket1, error: error1 } = await supabase.storage.createBucket('plan-images', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png']
        });

        if (error1) {
            if (error1.message.includes('already exists')) {
                console.log('  ℹ️  plan-images バケットは既に存在します');
            } else {
                throw error1;
            }
        } else {
            console.log('  ✓ plan-images バケット作成完了');
        }

        // plan-drawingsバケットを作成
        console.log('\n📦 plan-drawings バケットを作成中...');
        const { data: bucket2, error: error2 } = await supabase.storage.createBucket('plan-drawings', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['application/pdf']
        });

        if (error2) {
            if (error2.message.includes('already exists')) {
                console.log('  ℹ️  plan-drawings バケットは既に存在します');
            } else {
                throw error2;
            }
        } else {
            console.log('  ✓ plan-drawings バケット作成完了');
        }

        console.log('\n========================================');
        console.log('✅ ストレージバケット設定完了！');
        console.log('========================================\n');
        console.log('作成されたバケット:');
        console.log('- plan-images (プラン画像用, 5MB制限)');
        console.log('- plan-drawings (PDF図面用, 50MB制限)\n');
        console.log('次のステップ:');
        console.log('1. node scripts/utilities/upload-plans-to-storage.js を実行');
        console.log('2. ファイルのアップロードが完了します\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ エラー:', error.message);
        if (error.details) {
            console.error('詳細:', error.details);
        }
        process.exit(1);
    }
}

// スクリプト実行
setupStorageBuckets();
