import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('Plans テーブル RLS ポリシー確認');
console.log('========================================\n');

// RLSの状態を確認
async function checkRLS() {
    try {
        console.log('📋 RLSポリシーを確認中...\n');

        const { data, error } = await supabase.rpc('exec_sql', {
            query: `
                SELECT
                    schemaname,
                    tablename,
                    rowsecurity
                FROM pg_tables
                WHERE tablename = 'plans';
            `
        });

        if (error) {
            console.log('⚠️  exec_sql RPC が利用できません。直接クエリを実行します...\n');

            // 代替方法: pg_catalog から直接確認
            const { data: tableData, error: tableError } = await supabase
                .from('pg_tables')
                .select('*')
                .eq('tablename', 'plans');

            if (tableError) {
                console.log('❌ テーブル情報取得エラー:', tableError.message);
            } else {
                console.log('テーブル情報:', tableData);
            }
        } else {
            console.log('RLS設定:', data);
        }

        // ポリシーの確認
        console.log('\n📋 INSERT ポリシーを確認中...\n');

        // 簡易テスト: anon キーで INSERT を試行
        const supabaseAnon = createClient(supabaseUrl,
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws'
        );

        const testData = {
            id: 'TEST-RLS-CHECK',
            name: 'RLS Test Plan',
            status: 'draft'
        };

        const { data: insertData, error: insertError } = await supabaseAnon
            .from('plans')
            .insert([testData])
            .select('*');

        if (insertError) {
            if (insertError.code === '42501') {
                console.log('❌ RLS ポリシーエラー: INSERT 権限がありません');
                console.log('   エラーコード:', insertError.code);
                console.log('   エラーメッセージ:', insertError.message);
                console.log('\n解決策: Supabase Dashboard で plans テーブルの RLS ポリシーを確認してください');
                console.log('   URL: https://supabase.com/dashboard/project/hegpxvyziovlfxdfsrsv/auth/policies');
            } else if (insertError.code === '42703' || insertError.message.includes('column')) {
                console.log('❌ カラムが存在しません');
                console.log('   エラーコード:', insertError.code);
                console.log('   エラーメッセージ:', insertError.message);
                console.log('\n解決策: マイグレーションSQLを実行してください');
            } else {
                console.log('❌ INSERT エラー:', insertError.message);
                console.log('   エラーコード:', insertError.code);
                console.log('   エラー詳細:', insertError.details);
                console.log('   エラーヒント:', insertError.hint);
            }
        } else {
            console.log('✅ INSERT 成功 (anon キー使用)');
            console.log('   挿入されたデータ:', insertData);

            // テストデータを削除
            await supabase
                .from('plans')
                .delete()
                .eq('id', 'TEST-RLS-CHECK');
            console.log('   テストデータを削除しました');
        }

    } catch (err) {
        console.error('予期しないエラー:', err);
    }
}

checkRLS().then(() => {
    console.log('\n========================================');
    console.log('確認完了');
    console.log('========================================\n');
    process.exit(0);
});
