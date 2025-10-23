import { createClient } from '@supabase/supabase-js';

// Supabase接続情報
const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

// 2つのクライアントを作成
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function getAllTables() {
    // REST APIで利用可能なテーブル一覧を取得
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
        }
    });

    const schemaData = await response.json();
    return Object.keys(schemaData.definitions || {});
}

async function checkTableAccess(tableName) {
    const results = {
        table: tableName,
        serviceRole: { success: false, error: null, count: 0 },
        anon: { success: false, error: null, count: 0 }
    };

    // Service Role Key でのアクセステスト
    try {
        const { data, error, count } = await serviceClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) {
            results.serviceRole.error = error.message;
        } else {
            results.serviceRole.success = true;
            results.serviceRole.count = count || 0;
        }
    } catch (err) {
        results.serviceRole.error = err.message;
    }

    // Anon Key でのアクセステスト
    try {
        const { data, error, count } = await anonClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) {
            results.anon.error = error.message;
        } else {
            results.anon.success = true;
            results.anon.count = count || 0;
        }
    } catch (err) {
        results.anon.error = err.message;
    }

    return results;
}

async function checkAllTables() {
    console.log('========================================');
    console.log('全テーブル RLS ポリシー確認');
    console.log('========================================\n');

    console.log('📊 利用可能なテーブルを取得中...\n');
    const tables = await getAllTables();
    console.log(`✅ ${tables.length}個のテーブルを発見\n`);

    const problematicTables = [];
    const successTables = [];

    for (const table of tables) {
        const result = await checkTableAccess(table);

        if (result.serviceRole.success && result.anon.success) {
            // 両方成功
            successTables.push(result);
            console.log(`✅ ${table}`);
            console.log(`   Service: ${result.serviceRole.count}件 | Anon: ${result.anon.count}件\n`);
        } else {
            // 問題あり
            problematicTables.push(result);
            console.log(`⚠️  ${table}`);
            if (!result.serviceRole.success) {
                console.log(`   ❌ Service Role: ${result.serviceRole.error}`);
            } else {
                console.log(`   ✅ Service Role: ${result.serviceRole.count}件`);
            }
            if (!result.anon.success) {
                console.log(`   ❌ Anon Key: ${result.anon.error}`);
            } else {
                console.log(`   ✅ Anon Key: ${result.anon.count}件`);
            }
            console.log();
        }
    }

    // サマリー
    console.log('\n========================================');
    console.log('診断結果サマリー');
    console.log('========================================\n');

    console.log(`✅ 正常なテーブル: ${successTables.length}個`);
    console.log(`⚠️  問題のあるテーブル: ${problematicTables.length}個\n`);

    if (problematicTables.length > 0) {
        console.log('問題のあるテーブル詳細:\n');
        problematicTables.forEach(result => {
            console.log(`📌 ${result.table}:`);
            if (!result.serviceRole.success) {
                console.log(`   Service Role エラー: ${result.serviceRole.error}`);
            }
            if (!result.anon.success) {
                console.log(`   Anon Key エラー: ${result.anon.error}`);
            }
            console.log();
        });

        console.log('推奨される対応:\n');
        console.log('1. Anon Key でアクセスできないテーブル:');
        console.log('   → RLSポリシーで SELECT を許可する必要があります\n');
        console.log('2. "permission denied for table users" エラー:');
        console.log('   → ポリシーが users テーブルを参照している可能性があります');
        console.log('   → auth.users を使用するか、ポリシーをシンプルにしてください\n');
    } else {
        console.log('✅ すべてのテーブルが正常にアクセス可能です！');
    }
}

checkAllTables().then(() => {
    console.log('\n確認完了。');
    process.exit(0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
