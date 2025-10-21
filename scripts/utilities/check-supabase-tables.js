import { createClient } from '@supabase/supabase-js';

// Supabase接続情報
const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('========================================');
    console.log('Supabaseテーブル存在チェック');
    console.log('========================================\n');

    const tablesToCheck = [
        'plans',
        'plan_images',
        'plan_files',
        'faqs',
        'faq_categories',
        'rules',
        'rule_categories',
        'downloads',
        'download_categories'
    ];

    const results = {};

    for (const tableName of tablesToCheck) {
        console.log(`【${tableName}】テーブルをチェック中...`);

        try {
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (error) {
                if (error.message.includes('does not exist') || error.message.includes('relation') && error.message.includes('does not exist')) {
                    console.log(`  ❌ テーブルが存在しません`);
                    results[tableName] = { exists: false, error: error.message };
                } else if (error.message.includes('permission') || error.code === '42501') {
                    console.log(`  ⚠️ テーブルは存在するが、権限がありません`);
                    results[tableName] = { exists: true, hasPermission: false, error: error.message };
                } else {
                    console.log(`  ⚠️ エラー: ${error.message}`);
                    results[tableName] = { exists: 'unknown', error: error.message };
                }
            } else {
                console.log(`  ✅ テーブルが存在します (レコード数: ${count ?? 0})`);
                results[tableName] = { exists: true, count: count ?? 0 };
            }
        } catch (error) {
            console.log(`  ❌ チェック失敗: ${error.message}`);
            results[tableName] = { exists: 'unknown', error: error.message };
        }

        console.log('');
    }

    // サマリー
    console.log('========================================');
    console.log('チェック結果サマリー');
    console.log('========================================\n');

    const existingTables = Object.entries(results).filter(([_, v]) => v.exists === true);
    const missingTables = Object.entries(results).filter(([_, v]) => v.exists === false);
    const unknownTables = Object.entries(results).filter(([_, v]) => v.exists === 'unknown');

    console.log(`✅ 存在するテーブル: ${existingTables.length}/${tablesToCheck.length}`);
    if (existingTables.length > 0) {
        existingTables.forEach(([table, info]) => {
            console.log(`   - ${table} (${info.count} レコード)`);
        });
    }

    console.log(`\n❌ 存在しないテーブル: ${missingTables.length}/${tablesToCheck.length}`);
    if (missingTables.length > 0) {
        missingTables.forEach(([table, _]) => {
            console.log(`   - ${table}`);
        });
    }

    if (unknownTables.length > 0) {
        console.log(`\n⚠️ 不明なテーブル: ${unknownTables.length}/${tablesToCheck.length}`);
        unknownTables.forEach(([table, info]) => {
            console.log(`   - ${table}: ${info.error}`);
        });
    }

    // 結論
    console.log('\n========================================');
    console.log('結論');
    console.log('========================================\n');

    if (missingTables.length > 0) {
        console.log('❌ データベースのテーブルが作成されていません！');
        console.log('\n現在の状態:');
        console.log('  - ルールやQ&Aを追加しても、LocalStorageにのみ保存されます');
        console.log('  - 他のユーザーには共有されません（各ブラウザごとに独立）');
        console.log('\n解決方法:');
        console.log('  1. Supabaseダッシュボード (https://supabase.com) にログイン');
        console.log('  2. プロジェクトを選択');
        console.log('  3. SQL Editor を開く');
        console.log('  4. テーブル作成SQLを実行');
        console.log('     → docs/development-logs/2025-10-17.md:282-312 を参照');
    } else if (existingTables.length === tablesToCheck.length) {
        console.log('✅ すべてのテーブルが存在します！');
        console.log('\n現在の状態:');
        console.log('  - ルールやQ&Aを追加すると、Supabaseに保存されます');
        console.log('  - すべてのユーザーで共有されます');
    } else {
        console.log('⚠️ 一部のテーブルが不足しています');
        console.log('  - 完全に機能させるには、すべてのテーブルを作成してください');
    }
}

checkTables().then(() => {
    console.log('\nチェックが完了しました。');
    process.exit(0);
}).catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
});
