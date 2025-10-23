import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('古いプラン削除スクリプト');
console.log('========================================\n');

async function deleteOldPlans() {
    try {
        // まず削除対象を確認
        console.log('📋 削除対象プランを確認中...\n');

        const { data: toDelete, error: selectError } = await supabase
            .from('plans')
            .select('id, plan_code, plan_name')
            .is('plan_code', null);

        if (selectError) {
            console.error('❌ エラー:', selectError.message);
            return false;
        }

        console.log(`削除対象: ${toDelete.length}件\n`);

        if (toDelete.length > 0) {
            console.log('以下のプランを削除します:');
            toDelete.slice(0, 10).forEach((plan, i) => {
                console.log(`  ${i+1}. ${plan.plan_name || '(名称なし)'} (ID: ${plan.id.substring(0, 8)}...)`);
            });
            if (toDelete.length > 10) {
                console.log(`  ... 他 ${toDelete.length - 10}件`);
            }
            console.log('');
        }

        // 保持対象も確認
        const { data: toKeep, error: keepError } = await supabase
            .from('plans')
            .select('id, plan_code, plan_name')
            .not('plan_code', 'is', null);

        if (!keepError && toKeep) {
            console.log(`保持対象: ${toKeep.length}件\n`);
            if (toKeep.length > 0) {
                console.log('以下のプランは保持されます:');
                toKeep.forEach((plan, i) => {
                    console.log(`  ${i+1}. [${plan.plan_code}] ${plan.plan_name || '(名称なし)'}`);
                });
                console.log('');
            }
        }

        // 削除実行
        console.log('🗑️  削除を実行中...\n');

        const { data: deleted, error: deleteError } = await supabase
            .from('plans')
            .delete()
            .is('plan_code', null)
            .select();

        if (deleteError) {
            console.error('❌ 削除エラー:', deleteError.message);
            return false;
        }

        console.log(`✅ ${deleted.length}件のプランを削除しました\n`);

        // 最終確認
        const { data: remaining, error: checkError } = await supabase
            .from('plans')
            .select('id, plan_code, plan_name, maguchi, oku_yuki');

        if (!checkError) {
            console.log('========================================');
            console.log('📊 削除後の状態\n');
            console.log(`残存プラン数: ${remaining.length}件\n`);

            if (remaining.length > 0) {
                console.log('残っているプラン:');
                remaining.forEach((plan, i) => {
                    console.log(`  ${i+1}. [${plan.plan_code || '(未設定)'}] ${plan.plan_name || '(名称なし)'}`);
                    console.log(`     間口: ${plan.maguchi || '(未設定)'}m / 奥行: ${plan.oku_yuki || '(未設定)'}m`);
                });
            }
            console.log('========================================\n');
        }

        return true;

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
        return false;
    }
}

deleteOldPlans().then((success) => {
    if (success) {
        console.log('✅ 完了: 古いプランの削除が完了しました');
    } else {
        console.log('❌ 失敗: プラン削除中にエラーが発生しました');
    }
    process.exit(success ? 0 : 1);
});
