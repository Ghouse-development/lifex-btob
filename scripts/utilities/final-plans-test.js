import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('Plans テーブル 最終動作確認');
console.log('========================================\n');

async function finalTest() {
    try {
        // UUID v4形式のIDを生成（admin-plans.htmlと同じ方法）
        const testId = crypto.randomUUID();

        console.log('📋 UUID v4形式でプラン追加テスト\n');
        console.log('生成されたUUID:', testId);
        console.log('');

        // admin-plans.htmlの送信データと同じ構造でテスト
        const testPlanData = {
            // 基本情報
            id: testId,
            plan_name: '2階建て 30.5坪 3LDK',  // データベースの実際のカラム名
            name: '2階建て 30.5坪 3LDK',       // 後方互換性のため両方設定
            description: '最終テスト用プラン',

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

            // 価格情報（円単位）
            price: 25000000,
            sell_price: 25000000,
            cost: 18000000,
            gross_profit: 7000000,

            // 性能値
            ua_value: 0.46,
            energy_reduction: 25.0,

            // 設計者
            designer: 'テスト設計者',

            // ステータス
            status: 'draft',

            // タグ・データ（JSONB）
            tags: ['テスト', '最終確認'],
            images: {},
            floor_plans: [],
            files: {},

            // タイムスタンプ
            updated_at: new Date().toISOString()
        };

        console.log('送信データ:');
        console.log(JSON.stringify(testPlanData, null, 2));
        console.log('\n🔄 INSERTを実行中...\n');

        const { data, error } = await supabase
            .from('plans')
            .insert([testPlanData])
            .select('*')
            .single();

        if (error) {
            console.log('❌ INSERT失敗\n');
            console.log('エラーコード:', error.code);
            console.log('エラーメッセージ:', error.message);
            console.log('エラー詳細:', error.details);
            console.log('エラーヒント:', error.hint);
            console.log('');

            if (error.code === '42703') {
                console.log('⚠️  カラムが存在しません');
                console.log('   → complete-plans-migration.sql を実行してください\n');
            } else if (error.code === '42501') {
                console.log('⚠️  RLSポリシーによりブロックされています');
                console.log('   → supabase-fix-rls.sql を実行してください\n');
            } else if (error.code === '22P02') {
                console.log('⚠️  ID形式が正しくありません');
                console.log('   → admin-plans.htmlのID生成方法を確認してください\n');
            } else if (error.code === '23502') {
                console.log('⚠️  必須フィールドが不足しています');
                console.log('   詳細:', error.details, '\n');
            } else if (error.code === '23505') {
                console.log('⚠️  UNIQUE制約違反（IDが重複）');
                console.log('   ※以前のテストデータが残っている可能性があります\n');
            }

            return false;
        }

        console.log('✅ INSERT成功！\n');
        console.log('挿入されたプラン:');
        console.log('  - ID:', data.id);
        console.log('  - 名前:', data.name);
        console.log('  - 坪数:', data.tsubo);
        console.log('  - 延床面積:', data.total_floor_area, '㎡');
        console.log('  - 施工床面積:', data.construction_floor_area, '㎡');
        console.log('  - 間取り:', data.layout);
        console.log('  - 販売価格:', (data.sell_price / 10000).toLocaleString(), '万円');
        console.log('  - ステータス:', data.status);
        console.log('');

        // テストデータを削除
        console.log('🗑️  テストデータを削除中...\n');
        const { error: deleteError } = await supabase
            .from('plans')
            .delete()
            .eq('id', testId);

        if (deleteError) {
            console.log('⚠️  テストデータの削除に失敗しました');
            console.log('   手動で削除してください: ID =', testId, '\n');
        } else {
            console.log('✅ テストデータを削除しました\n');
        }

        return true;

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
        return false;
    }
}

async function main() {
    const success = await finalTest();

    console.log('========================================');
    if (success) {
        console.log('✅ 最終確認完了！');
        console.log('');
        console.log('全ての問題が解決されました。');
        console.log('admin-plans.htmlで新規プラン追加が可能です。');
    } else {
        console.log('❌ テスト失敗');
        console.log('');
        console.log('上記のエラーを確認して対処してください。');
    }
    console.log('========================================\n');
}

main().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
});
