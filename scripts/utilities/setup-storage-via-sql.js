import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('Supabase Storageバケット作成');
console.log('========================================\n');

async function setupStorage() {
    try {
        // バケットを作成（REST APIで直接作成）
        console.log('📦 plan-images バケットを作成中...');

        const bucket1Response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey
            },
            body: JSON.stringify({
                id: 'plan-images',
                name: 'plan-images',
                public: true,
                file_size_limit: 5242880,  // 5MB
                allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
            })
        });

        if (bucket1Response.ok) {
            console.log('✅ plan-images バケット作成成功');
        } else {
            const error = await bucket1Response.json();
            if (error.message?.includes('already exists')) {
                console.log('ℹ️  plan-images バケットは既に存在します');
            } else {
                console.error('❌ plan-images バケット作成エラー:', error);
            }
        }

        console.log('\n📦 plan-drawings バケットを作成中...');

        const bucket2Response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey
            },
            body: JSON.stringify({
                id: 'plan-drawings',
                name: 'plan-drawings',
                public: true,
                file_size_limit: 10485760,  // 10MB
                allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png']
            })
        });

        if (bucket2Response.ok) {
            console.log('✅ plan-drawings バケット作成成功');
        } else {
            const error = await bucket2Response.json();
            if (error.message?.includes('already exists')) {
                console.log('ℹ️  plan-drawings バケットは既に存在します');
            } else {
                console.error('❌ plan-drawings バケット作成エラー:', error);
            }
        }

        // バケット一覧を確認
        console.log('\n📋 作成されたバケット一覧:');
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error('❌ バケット一覧取得エラー:', error.message);
        } else {
            buckets.forEach(bucket => {
                console.log(`  ✅ ${bucket.name} (Public: ${bucket.public})`);
            });
        }

        console.log('\n========================================');
        console.log('✅ 完了！');
        console.log('========================================\n');

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
    }
}

setupStorage().then(() => {
    process.exit(0);
});
