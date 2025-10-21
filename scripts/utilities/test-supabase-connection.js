import { createClient } from '@supabase/supabase-js';

// Supabase接続情報
const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

// Supabaseクライアント作成
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('========================================');
    console.log('Supabase接続テスト開始');
    console.log('========================================\n');
    console.log('接続情報:');
    console.log('  URL:', supabaseUrl);
    console.log('  Key (最初の40文字):', supabaseKey.substring(0, 40) + '...\n');

    let allTestsPassed = true;

    try {
        // 1. 基本的なAPIエンドポイントへの接続テスト
        console.log('【テスト1】APIエンドポイントへの接続テスト:');
        try {
            const response = await fetch(supabaseUrl + '/rest/v1/', {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });

            console.log('  HTTPステータス:', response.status);
            console.log('  接続状態:', response.ok ? '✅ 正常' : '❌ エラー');

            if (!response.ok) {
                allTestsPassed = false;
            }
        } catch (error) {
            console.log('  ❌ 接続エラー:', error.message);
            allTestsPassed = false;
        }

        // 2. 認証サービスのテスト
        console.log('\n【テスト2】認証サービステスト:');
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.log('  セッション状態: 未認証（Anonymous）');
            } else {
                console.log('  セッション状態: ✅ 認証サービス接続成功');
                if (sessionData?.session) {
                    console.log('  アクティブセッション: あり');
                } else {
                    console.log('  アクティブセッション: なし（匿名アクセス）');
                }
            }
        } catch (error) {
            console.log('  ❌ 認証サービスエラー:', error.message);
            allTestsPassed = false;
        }

        // 3. Storageサービスのテスト
        console.log('\n【テスト3】Storageサービステスト:');
        try {
            const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

            if (bucketsError) {
                // 権限エラーの場合も接続は成功とみなす
                if (bucketsError.message.includes('permission') || bucketsError.message.includes('unauthorized')) {
                    console.log('  ✅ Storage接続成功（権限制限あり）');
                } else {
                    console.log('  ❌ Storageエラー:', bucketsError.message);
                    allTestsPassed = false;
                }
            } else {
                console.log('  ✅ Storage接続成功');
                console.log('  バケット数:', buckets ? buckets.length : 0);
                if (buckets && buckets.length > 0) {
                    console.log('  利用可能なバケット:', buckets.map(b => b.name).join(', '));
                }
            }
        } catch (error) {
            console.log('  ❌ Storageサービスエラー:', error.message);
            allTestsPassed = false;
        }

        // 4. データベース接続のテスト（簡易版）
        console.log('\n【テスト4】データベース接続テスト:');
        try {
            // 存在しないテーブルへのクエリを試みることで接続性を確認
            const { data, error } = await supabase
                .from('_test_connection_check')
                .select('*')
                .limit(1);

            if (error) {
                // テーブルが存在しないエラーの場合は接続成功
                if (error.message.includes('not find') || error.message.includes('does not exist')) {
                    console.log('  ✅ データベース接続成功（テストテーブルは未作成）');
                } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                    console.log('  ✅ データベース接続成功（権限制限あり）');
                } else {
                    console.log('  ⚠️ データベース応答:', error.message);
                }
            } else {
                console.log('  ✅ データベース接続成功');
            }
        } catch (error) {
            console.log('  ❌ データベース接続エラー:', error.message);
            allTestsPassed = false;
        }

        // 5. Realtime接続のテスト（簡易版）
        console.log('\n【テスト5】Realtime接続テスト:');
        try {
            const channel = supabase.channel('test-connection-channel');

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    resolve('timeout');
                }, 3000);

                channel.subscribe((status) => {
                    clearTimeout(timeout);
                    if (status === 'SUBSCRIBED') {
                        console.log('  ✅ Realtimeチャンネル接続成功');
                        resolve('connected');
                    } else if (status === 'CLOSED') {
                        console.log('  ⚠️ Realtimeチャンネル: 接続クローズ');
                        resolve('closed');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.log('  ❌ Realtimeチャンネル: エラー');
                        reject('error');
                    }
                });
            });

            // チャンネルをクリーンアップ
            await supabase.removeAllChannels();

        } catch (error) {
            console.log('  ⚠️ Realtime接続:', error === 'error' ? 'エラー' : error.message || error);
        }

        // 結果サマリー
        console.log('\n========================================');
        console.log('接続テスト結果サマリー');
        console.log('========================================');

        if (allTestsPassed) {
            console.log('\n✅ すべての基本接続テストが成功しました！');
            console.log('Supabaseプロジェクトへの接続は正常です。');
        } else {
            console.log('\n⚠️ 一部のテストで問題が検出されました。');
            console.log('上記のエラーメッセージを確認してください。');
        }

        console.log('\n接続情報:');
        console.log('  プロジェクトURL:', supabaseUrl);
        console.log('  APIキータイプ: anon (公開用)');
        console.log('  接続モード: Browser/Client-side');

    } catch (error) {
        console.error('\n❌ テスト実行中に予期しないエラーが発生しました:', error);
        console.error('エラー詳細:', error.message);
    }
}

// テスト実行
console.log('Supabase接続テストを開始します...\n');
testConnection().then(() => {
    console.log('\n接続テストが完了しました。');
    process.exit(0);
}).catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
});