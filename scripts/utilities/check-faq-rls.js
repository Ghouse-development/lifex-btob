import { createClient } from '@supabase/supabase-js';

// Supabase接続情報
const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

// 2つのクライアントを作成
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
    console.log('========================================');
    console.log('FAQ テーブル RLS ポリシー確認');
    console.log('========================================\n');

    const tables = ['faq_categories', 'faqs', 'faq_feedback'];

    for (const table of tables) {
        console.log(`\n📊 ${table} テーブル:\n`);

        // Service Role Key でのアクセステスト
        console.log('  [Service Role Key でアクセス]');
        try {
            const { data, error, count } = await serviceClient
                .from(table)
                .select('*', { count: 'exact' });

            if (error) {
                console.log(`  ❌ エラー: ${error.message}`);
            } else {
                console.log(`  ✅ 成功: ${count || 0}件のレコード`);
            }
        } catch (err) {
            console.log(`  ❌ 例外: ${err.message}`);
        }

        // Anon Key でのアクセステスト（認証なし）
        console.log('\n  [Anon Key でアクセス（認証なし）]');
        try {
            const { data, error, count } = await anonClient
                .from(table)
                .select('*', { count: 'exact' });

            if (error) {
                console.log(`  ❌ エラー: ${error.message}`);
                console.log(`  エラーコード: ${error.code}`);
            } else {
                console.log(`  ✅ 成功: ${count || 0}件のレコード`);
            }
        } catch (err) {
            console.log(`  ❌ 例外: ${err.message}`);
        }

        console.log('\n' + '─'.repeat(60));
    }

    console.log('\n========================================');
    console.log('診断結果');
    console.log('========================================\n');
    console.log('もしAnon Keyでエラーが発生している場合、以下の可能性があります:\n');
    console.log('1. RLSポリシーが正しく設定されていない');
    console.log('2. テーブルのRLSが有効化されているが、anon用のポリシーがない');
    console.log('3. ポリシーの条件が厳しすぎる\n');
    console.log('修正方法:');
    console.log('- supabase-faq-migration.sql を Supabase SQL Editor で再実行');
    console.log('- または、Supabase Dashboard → Authentication → Policies で確認\n');
}

checkRLS().then(() => {
    console.log('確認完了。');
    process.exit(0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
