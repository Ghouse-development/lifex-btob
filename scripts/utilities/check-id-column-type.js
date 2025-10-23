import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('Plans テーブル ID カラム型確認');
console.log('========================================\n');

async function checkIdColumnType() {
    try {
        // PostgreSQLのinformation_schemaを使用してカラム型を確認
        const { data, error } = await supabase.rpc('exec_sql', {
            query: `
                SELECT column_name, data_type, udt_name
                FROM information_schema.columns
                WHERE table_name = 'plans' AND column_name = 'id';
            `
        });

        if (error) {
            console.log('⚠️  exec_sql RPCが使えません。代替方法を試します...\n');

            // 代替: 既存のプランデータを取得してIDの形式を確認
            const { data: plansData, error: plansError } = await supabase
                .from('plans')
                .select('id')
                .limit(5);

            if (plansError) {
                console.error('❌ プランデータ取得エラー:', plansError.message);
                return;
            }

            console.log('既存のプランID例:');
            if (plansData && plansData.length > 0) {
                plansData.forEach(plan => {
                    console.log(`  - ${plan.id} (型: ${typeof plan.id})`);
                });
            } else {
                console.log('  （既存データなし）');
            }

            // TEXT形式のIDでINSERTテスト
            console.log('\n📋 TEXT形式IDでINSERTテスト...\n');
            const testId = `LX-${Date.now()}A`;
            const testData = {
                id: testId,
                name: 'Test Plan',
                status: 'draft'
            };

            const { data: insertData, error: insertError } = await supabase
                .from('plans')
                .insert([testData])
                .select('*')
                .single();

            if (insertError) {
                console.error('❌ INSERT失敗:', insertError.message);
                console.error('   エラーコード:', insertError.code);

                if (insertError.message.includes('uuid')) {
                    console.log('\n⚠️  結論: idカラムはUUID型です');
                    console.log('   admin-plans.htmlで生成される "LX-..." 形式は使用できません');
                    console.log('\n   解決策:');
                    console.log('   1. idカラムをTEXT型に変更する');
                    console.log('   2. または、UUID形式のIDを生成するようにコードを修正する\n');
                } else {
                    console.log('\n   その他のエラーです\n');
                }
            } else {
                console.log('✅ INSERT成功！');
                console.log('   結論: idカラムはTEXT型です\n');

                // テストデータを削除
                await supabase.from('plans').delete().eq('id', testId);
                console.log('   テストデータを削除しました\n');
            }

        } else {
            console.log('カラム情報:', data);
            if (data && data.length > 0) {
                const col = data[0];
                console.log(`\nidカラムの型: ${col.data_type} (${col.udt_name})\n`);

                if (col.data_type === 'uuid') {
                    console.log('⚠️  idカラムはUUID型です');
                    console.log('   admin-plans.htmlで生成される "LX-..." 形式は使用できません\n');
                } else if (col.data_type === 'text' || col.data_type === 'character varying') {
                    console.log('✅ idカラムはTEXT型です');
                    console.log('   admin-plans.htmlのID生成は正常に動作します\n');
                }
            }
        }

    } catch (err) {
        console.error('予期しないエラー:', err);
    }
}

checkIdColumnType().then(() => {
    console.log('========================================');
    console.log('確認完了');
    console.log('========================================\n');
    process.exit(0);
});
