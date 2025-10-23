import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('Plans テーブル 包括的診断');
console.log('========================================\n');

// 期待されるカラム一覧
const expectedColumns = [
    // 基本
    'id', 'name', 'category', 'description',
    // 基本仕様
    'tsubo', 'width', 'depth', 'floors',
    // 新規追加（マイグレーション必要）
    'layout', 'ldk_floor', 'bathroom_floor',
    'total_floor_area', 'construction_floor_area',
    // 価格
    'price', 'price_without_tax', 'construction_period',
    'sell_price', 'cost', 'gross_profit',
    // 性能値
    'ua_value', 'energy_reduction',
    // 設計者
    'designer',
    // 部屋構成
    'bedrooms', 'living_dining', 'kitchen', 'bathroom', 'toilet',
    // タグ・画像・ファイル
    'tags', 'images', 'floor_plans', 'files',
    // ステータス
    'status',
    // メタデータ
    'created_by', 'updated_by', 'created_at', 'updated_at', 'published_at',
    // 追加仕様
    'specifications', 'options'
];

/**
 * 1. テーブルの存在確認
 */
async function checkTableExists() {
    console.log('📋 1. テーブルの存在確認\n');

    try {
        // service roleで直接SELECTを試行
        const { data, error } = await supabase
            .from('plans')
            .select('id')
            .limit(1);

        if (error) {
            console.log('❌ テーブルが存在しないか、アクセスできません');
            console.log('   エラー:', error.message);
            return false;
        }

        console.log('✅ plansテーブルは存在します\n');
        return true;
    } catch (err) {
        console.error('❌ 予期しないエラー:', err.message);
        return false;
    }
}

/**
 * 2. RLSの状態確認
 */
async function checkRLSStatus() {
    console.log('📋 2. RLS（Row Level Security）の状態確認\n');

    try {
        // anonキーでテスト
        const supabaseAnon = createClient(supabaseUrl,
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws'
        );

        const { data, error } = await supabaseAnon
            .from('plans')
            .select('id')
            .limit(1);

        if (error) {
            if (error.code === '42501' || error.message.includes('policy')) {
                console.log('⚠️  RLSが有効になっています');
                console.log('   エラー:', error.message);
                console.log('\n   解決策: supabase-fix-rls.sql を実行してRLSを無効化してください\n');
                return 'enabled';
            } else {
                console.log('⚠️  その他のエラー:', error.message);
                return 'unknown';
            }
        }

        console.log('✅ RLSは無効化されているか、anonでもアクセス可能です\n');
        return 'disabled';
    } catch (err) {
        console.error('❌ 予期しないエラー:', err.message);
        return 'error';
    }
}

/**
 * 3. カラム一覧の取得と比較
 */
async function checkColumns() {
    console.log('📋 3. カラム構造の確認\n');

    try {
        // 全カラムを取得する試み
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .limit(1);

        if (error) {
            console.log('❌ カラム情報取得エラー:', error.message);
            console.log('   エラーコード:', error.code);

            // エラーメッセージから不足カラムを特定
            if (error.message && error.message.includes('column')) {
                const match = error.message.match(/'(\w+)'/);
                if (match) {
                    console.log(`\n   不足しているカラム: ${match[1]}`);
                }
            }

            console.log('\n   解決策: add-missing-columns-migration.sql を実行してください\n');
            return null;
        }

        // 取得できた場合、カラムを表示
        if (data && data.length > 0) {
            const actualColumns = Object.keys(data[0]);
            console.log('✅ 現在のカラム数:', actualColumns.length);
            console.log('   期待されるカラム数:', expectedColumns.length);

            // 不足しているカラムを特定
            const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
            if (missingColumns.length > 0) {
                console.log('\n⚠️  不足しているカラム:');
                missingColumns.forEach(col => console.log(`   - ${col}`));
                console.log('\n   解決策: add-missing-columns-migration.sql を実行してください\n');
                return { actualColumns, missingColumns };
            }

            console.log('\n✅ 全ての必要なカラムが存在します\n');
            return { actualColumns, missingColumns: [] };
        }

        // データが0件の場合
        console.log('⚠️  テーブルにデータがありません（構造確認のため、ダミーINSERTをテストします）\n');
        return { actualColumns: [], missingColumns: expectedColumns };

    } catch (err) {
        console.error('❌ 予期しないエラー:', err.message);
        return null;
    }
}

/**
 * 4. テストINSERTの実行
 */
async function testInsert() {
    console.log('📋 4. テストINSERTの実行\n');

    const testData = {
        id: 'TEST-DIAGNOSTIC-' + Date.now(),
        name: 'Diagnostic Test Plan',
        description: 'This is a test plan for diagnostics',

        // 基本仕様
        tsubo: 30.5,
        total_floor_area: 100.71,
        construction_floor_area: 110.50,
        width: 9.0,
        depth: 11.19,
        floors: 2,
        layout: '3LDK',
        ldk_floor: 1,
        bathroom_floor: 1,

        // 価格
        price: 25000000,
        sell_price: 25000000,
        cost: 18000000,
        gross_profit: 7000000,

        // 性能値
        ua_value: 0.46,
        energy_reduction: 25.0,

        // 設計者
        designer: 'Test Designer',

        // ステータス
        status: 'draft',

        // タグ・データ（JSONB）
        tags: ['テスト', '診断用'],
        images: {},
        floor_plans: [],
        files: {},

        // メタデータ（created_by/updated_by はnullでテスト）
        created_by: null,
        updated_by: null,
        updated_at: new Date().toISOString()
    };

    console.log('送信データ:', JSON.stringify(testData, null, 2));
    console.log('');

    try {
        const { data, error } = await supabase
            .from('plans')
            .insert([testData])
            .select('*')
            .single();

        if (error) {
            console.log('❌ INSERT失敗');
            console.log('   エラーコード:', error.code);
            console.log('   エラーメッセージ:', error.message);
            console.log('   エラー詳細:', error.details);
            console.log('   エラーヒント:', error.hint);

            if (error.code === '42703') {
                console.log('\n   原因: カラムが存在しません');
                console.log('   解決策: add-missing-columns-migration.sql を実行してください\n');
            } else if (error.code === '42501') {
                console.log('\n   原因: RLSポリシーによりブロックされています');
                console.log('   解決策: supabase-fix-rls.sql を実行してください\n');
            } else if (error.code === '23502') {
                console.log('\n   原因: NOT NULL制約違反（必須フィールドが不足）');
                console.log('   詳細:', error.details);
                console.log('');
            } else if (error.code === '23505') {
                console.log('\n   原因: UNIQUE制約違反（IDが重複）');
                console.log('   ※これは正常です（以前のテストデータが残っている）\n');
            }

            return false;
        }

        console.log('✅ INSERT成功！');
        console.log('   挿入されたデータ:', data);

        // テストデータを削除
        console.log('\n   テストデータを削除中...');
        await supabase
            .from('plans')
            .delete()
            .eq('id', testData.id);
        console.log('   ✅ テストデータを削除しました\n');

        return true;

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
        return false;
    }
}

/**
 * メイン処理
 */
async function main() {
    const tableExists = await checkTableExists();
    if (!tableExists) {
        console.log('\n========================================');
        console.log('❌ 診断失敗: plansテーブルにアクセスできません');
        console.log('========================================\n');
        return;
    }

    const rlsStatus = await checkRLSStatus();
    const columnCheck = await checkColumns();

    if (columnCheck && columnCheck.missingColumns.length === 0) {
        await testInsert();
    }

    console.log('========================================');
    console.log('診断サマリー');
    console.log('========================================\n');

    console.log('🔍 テーブル存在: ✅');
    console.log(`🔒 RLS状態: ${rlsStatus === 'disabled' ? '✅ 無効化済み' : '⚠️  有効（要対応）'}`);

    if (columnCheck) {
        if (columnCheck.missingColumns.length === 0) {
            console.log('📋 カラム構造: ✅ 完全');
        } else {
            console.log(`📋 カラム構造: ⚠️  ${columnCheck.missingColumns.length}個のカラムが不足`);
            console.log('\n   不足カラム:', columnCheck.missingColumns.join(', '));
        }
    } else {
        console.log('📋 カラム構造: ❌ 確認失敗（マイグレーション未実行）');
    }

    console.log('\n========================================\n');

    if (!columnCheck || columnCheck.missingColumns.length > 0) {
        console.log('⚠️  次のステップ:');
        console.log('1. Supabase SQL Editorを開く');
        console.log('   https://supabase.com/dashboard/project/hegpxvyziovlfxdfsrsv/sql/new');
        console.log('2. database/add-missing-columns-migration.sql の内容を実行');
        console.log('3. このスクリプトを再実行して確認\n');
    }
}

main().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
});
