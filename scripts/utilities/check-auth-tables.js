/**
 * Supabase 認証・通知テーブル存在チェック
 *
 * このスクリプトは以下のテーブルが正しく作成されているかチェックします:
 * - user_profiles (ユーザープロファイル)
 * - login_history (ログイン履歴)
 * - notifications (お知らせ)
 * - notification_reads (既読管理)
 * - page_views (ページビュー)
 * - plan_views (プラン閲覧)
 * - download_logs (ダウンロードログ)
 * - search_queries (検索クエリ)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// チェックするテーブル一覧
const TABLES_TO_CHECK = {
    auth: [
        { name: 'user_profiles', description: 'ユーザープロファイル' },
        { name: 'login_history', description: 'ログイン履歴' }
    ],
    notifications: [
        { name: 'notifications', description: 'お知らせ' },
        { name: 'notification_reads', description: 'お知らせ既読管理' }
    ],
    analytics: [
        { name: 'page_views', description: 'ページビュー' },
        { name: 'plan_views', description: 'プラン閲覧' },
        { name: 'download_logs', description: 'ダウンロードログ' },
        { name: 'search_queries', description: '検索クエリ' }
    ]
};

/**
 * テーブルの存在と基本情報をチェック
 */
async function checkTable(tableName, description) {
    try {
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) {
            // エラー情報を詳しく出力
            const errorDetails = JSON.stringify(error, null, 2);
            console.log(`    [DEBUG] Error object:`, errorDetails);

            // RLSエラーの場合は存在するが権限がない
            if (error.code === 'PGRST301' || (error.message && error.message.includes('permission'))) {
                return {
                    exists: true,
                    count: '不明 (RLS制限)',
                    status: 'warning',
                    message: `テーブルは存在しますが、RLSポリシーにより直接アクセスできません`
                };
            }

            // テーブルが存在しない
            if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
                return {
                    exists: false,
                    status: 'error',
                    message: `テーブルが存在しません (code: ${error.code})`
                };
            }

            // その他のエラー
            return {
                exists: false,
                status: 'error',
                message: `エラー: ${error.message || JSON.stringify(error)} (code: ${error.code})`
            };
        }

        return {
            exists: true,
            count: count,
            status: 'success',
            message: `テーブルが正しく作成されています`
        };
    } catch (err) {
        return {
            exists: false,
            status: 'error',
            message: `予期しないエラー: ${err.message || JSON.stringify(err)}`
        };
    }
}

/**
 * 全テーブルをチェック
 */
async function checkAllTables() {
    console.log('========================================');
    console.log('Supabase 認証・通知テーブルチェック');
    console.log('========================================\n');

    const results = {
        auth: [],
        notifications: [],
        analytics: [],
        total: 0,
        success: 0,
        warning: 0,
        error: 0
    };

    // 認証テーブル
    console.log('【認証システム】');
    for (const table of TABLES_TO_CHECK.auth) {
        console.log(`  ${table.name} (${table.description}) をチェック中...`);
        const result = await checkTable(table.name, table.description);
        results.auth.push({ ...table, ...result });
        results.total++;

        if (result.status === 'success') {
            console.log(`    ✅ ${result.message} (${result.count} レコード)`);
            results.success++;
        } else if (result.status === 'warning') {
            console.log(`    ⚠️  ${result.message}`);
            results.warning++;
        } else {
            console.log(`    ❌ ${result.message}`);
            results.error++;
        }
    }

    console.log('');

    // 通知テーブル
    console.log('【お知らせ機能】');
    for (const table of TABLES_TO_CHECK.notifications) {
        console.log(`  ${table.name} (${table.description}) をチェック中...`);
        const result = await checkTable(table.name, table.description);
        results.notifications.push({ ...table, ...result });
        results.total++;

        if (result.status === 'success') {
            console.log(`    ✅ ${result.message} (${result.count} レコード)`);
            results.success++;
        } else if (result.status === 'warning') {
            console.log(`    ⚠️  ${result.message}`);
            results.warning++;
        } else {
            console.log(`    ❌ ${result.message}`);
            results.error++;
        }
    }

    console.log('');

    // アクセス解析テーブル
    console.log('【アクセス解析】');
    for (const table of TABLES_TO_CHECK.analytics) {
        console.log(`  ${table.name} (${table.description}) をチェック中...`);
        const result = await checkTable(table.name, table.description);
        results.analytics.push({ ...table, ...result });
        results.total++;

        if (result.status === 'success') {
            console.log(`    ✅ ${result.message} (${result.count} レコード)`);
            results.success++;
        } else if (result.status === 'warning') {
            console.log(`    ⚠️  ${result.message}`);
            results.warning++;
        } else {
            console.log(`    ❌ ${result.message}`);
            results.error++;
        }
    }

    console.log('');
    console.log('========================================');
    console.log('チェック結果サマリー');
    console.log('========================================\n');

    console.log(`総テーブル数: ${results.total}`);
    console.log(`  ✅ 正常: ${results.success}`);
    console.log(`  ⚠️  警告: ${results.warning}`);
    console.log(`  ❌ エラー: ${results.error}\n`);

    if (results.error > 0) {
        console.log('❌ エラーのあるテーブル:');
        [...results.auth, ...results.notifications, ...results.analytics]
            .filter(t => t.status === 'error')
            .forEach(t => {
                console.log(`  - ${t.name}: ${t.message}`);
            });
        console.log('');
    }

    console.log('========================================');
    console.log('結論');
    console.log('========================================\n');

    if (results.error === 0 && results.warning === 0) {
        console.log('✅ 全てのテーブルが正しく作成されています！');
        console.log('   認証・通知・解析機能が利用可能です。\n');
    } else if (results.error === 0 && results.warning > 0) {
        console.log('⚠️  テーブルは作成されていますが、RLSポリシーにより直接確認できません。');
        console.log('   これは正常な動作です。Supabase Dashboardで確認してください。\n');
    } else {
        console.log('❌ 一部のテーブルが作成されていません。');
        console.log('   以下のSQLファイルを実行してください:\n');
        console.log('   1. supabase-auth-migration.sql');
        console.log('   2. supabase-notifications-migration.sql');
        console.log('   3. supabase-analytics-migration.sql\n');
    }

    console.log('チェックが完了しました。\n');
}

// 実行
checkAllTables().catch(console.error);
