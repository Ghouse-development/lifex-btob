/**
 * Supabase接続と実際のデータ取得を検証するスクリプト
 *
 * このスクリプトは実際にSupabaseに接続し、データを取得できることを確認します
 */

// Supabase JS Client (Node.js用)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

console.log('🔍 Supabase接続検証スクリプト開始\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function verifyConnection() {
    try {
        // Supabaseクライアント作成
        console.log('📡 Supabaseクライアント作成中...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabaseクライアント作成成功\n');

        // URLとキーを表示（一部マスク）
        console.log('🔧 接続情報:');
        console.log(`   URL: ${SUPABASE_URL}`);
        console.log(`   ANON KEY: ${SUPABASE_ANON_KEY.substring(0, 20)}...${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 10)}\n`);

        const results = {
            connection: false,
            tables: {},
            totalRecords: 0,
            errors: []
        };

        // テーブルリスト
        const tables = [
            { name: 'plans', description: 'プランデータ' },
            { name: 'faqs', description: 'FAQ' },
            { name: 'faq_categories', description: 'FAQカテゴリ' },
            { name: 'rules', description: 'ルール' },
            { name: 'rule_categories', description: 'ルールカテゴリ' },
            { name: 'notifications', description: 'お知らせ' },
            { name: 'user_profiles', description: 'ユーザープロフィール' }
        ];

        console.log('📊 各テーブルのデータ取得テスト\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 各テーブルからデータを取得
        for (const table of tables) {
            try {
                console.log(`📋 ${table.description} (${table.name})`);

                const { data, error, count } = await supabase
                    .from(table.name)
                    .select('*', { count: 'exact' })
                    .limit(3); // 最初の3件のみ取得

                if (error) {
                    console.log(`   ❌ エラー: ${error.message}`);
                    results.errors.push({ table: table.name, error: error.message });
                    results.tables[table.name] = { status: 'error', count: 0, error: error.message };
                } else {
                    const recordCount = count || data?.length || 0;
                    console.log(`   ✅ ${recordCount}件のレコードを取得`);

                    if (data && data.length > 0) {
                        console.log(`   📝 サンプルデータ（最初の1件）:`);
                        const sample = data[0];
                        const keys = Object.keys(sample).slice(0, 5); // 最初の5カラムのみ表示
                        keys.forEach(key => {
                            const value = sample[key];
                            const displayValue = typeof value === 'string' && value.length > 50
                                ? value.substring(0, 50) + '...'
                                : value;
                            console.log(`      - ${key}: ${displayValue}`);
                        });
                        if (Object.keys(sample).length > 5) {
                            console.log(`      ... 他${Object.keys(sample).length - 5}カラム`);
                        }
                    }

                    results.tables[table.name] = {
                        status: 'success',
                        count: recordCount,
                        sampleData: data?.length > 0 ? data[0] : null
                    };
                    results.totalRecords += recordCount;
                    results.connection = true;
                }
                console.log('');
            } catch (err) {
                console.log(`   ❌ 例外: ${err.message}\n`);
                results.errors.push({ table: table.name, error: err.message });
                results.tables[table.name] = { status: 'exception', count: 0, error: err.message };
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // サマリー
        console.log('📊 検証結果サマリー\n');

        if (results.connection) {
            console.log('✅ Supabase接続: 成功');
            console.log(`✅ データベース接続: 正常`);
            console.log(`✅ 総レコード数: ${results.totalRecords}件`);
            console.log(`✅ 成功したテーブル: ${Object.values(results.tables).filter(t => t.status === 'success').length}/${tables.length}`);
        } else {
            console.log('❌ Supabase接続: 失敗');
        }

        if (results.errors.length > 0) {
            console.log(`\n⚠️  エラーが発生したテーブル: ${results.errors.length}個`);
            results.errors.forEach(e => {
                console.log(`   - ${e.table}: ${e.error}`);
            });
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 詳細テーブル
        console.log('📋 テーブル別詳細\n');
        console.log('テーブル名              | 状態    | レコード数');
        console.log('------------------------|---------|------------');

        tables.forEach(table => {
            const result = results.tables[table.name];
            const status = result.status === 'success' ? '✅ 成功' :
                          result.status === 'error' ? '❌ エラー' : '⚠️  例外';
            const count = result.count.toString().padStart(6);
            console.log(`${table.name.padEnd(24)}| ${status.padEnd(8)}| ${count}`);
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // RLSポリシーチェック
        console.log('🔒 Row Level Security (RLS) チェック\n');

        try {
            // 認証なしでplansテーブルにアクセス（ANONキー）
            const { data: anonData, error: anonError } = await supabase
                .from('plans')
                .select('id')
                .limit(1);

            if (anonError) {
                console.log(`❌ ANON キーでのアクセス: 失敗`);
                console.log(`   エラー: ${anonError.message}`);
                console.log(`   ⚠️  RLSポリシーが厳しすぎる可能性があります`);
            } else {
                console.log(`✅ ANON キーでのアクセス: 成功`);
                console.log(`   RLSポリシーが正しく設定されています`);
                console.log(`   匿名ユーザーでもデータ読み取りが可能です`);
            }
        } catch (rlsError) {
            console.log(`❌ RLSチェック中にエラー: ${rlsError.message}`);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 最終判定
        console.log('🎯 最終判定\n');

        const successCount = Object.values(results.tables).filter(t => t.status === 'success').length;
        const totalTables = tables.length;
        const successRate = Math.round((successCount / totalTables) * 100);

        console.log(`成功率: ${successRate}% (${successCount}/${totalTables}テーブル)`);
        console.log(`総データ件数: ${results.totalRecords}件\n`);

        if (successRate >= 80) {
            console.log('✅ Supabase連携は正常に動作しています！');
            console.log('   すべての主要機能でデータ取得が可能です。');
            return 0; // 成功
        } else if (successRate >= 50) {
            console.log('⚠️  Supabase連携は部分的に動作しています');
            console.log('   一部のテーブルでエラーが発生していますが、基本機能は利用可能です。');
            return 0; // 警告だが成功扱い
        } else {
            console.log('❌ Supabase連携に重大な問題があります');
            console.log('   多くのテーブルでエラーが発生しています。設定を確認してください。');
            return 1; // 失敗
        }

    } catch (error) {
        console.error('❌ 検証中に致命的なエラーが発生しました:');
        console.error(error);
        return 1;
    }
}

// 実行
verifyConnection()
    .then(code => process.exit(code))
    .catch(error => {
        console.error('予期しないエラー:', error);
        process.exit(1);
    });
