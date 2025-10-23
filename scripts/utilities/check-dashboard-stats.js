import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('========================================');
console.log('ダッシュボード統計チェック');
console.log('========================================\n');

async function checkStats() {
    try {
        const { data, error } = await supabase
            .from('plans')
            .select('id, plan_code, plan_name, maguchi, oku_yuki');

        if (error) {
            console.error('❌ エラー:', error.message);
            return;
        }

        console.log('📊 データベース統計\n');
        console.log('総プラン数:', data.length);
        console.log('');

        if (data.length > 0) {
            console.log('登録されているプラン:\n');
            data.forEach((plan, i) => {
                console.log(`${i+1}. ID: ${plan.id.substring(0, 8)}...`);
                console.log(`   プランコード: ${plan.plan_code || '(未設定)'}`);
                console.log(`   プラン名: ${plan.plan_name || '(未設定)'}`);
                console.log(`   間口: ${plan.maguchi || '(未設定)'} m`);
                console.log(`   奥行: ${plan.oku_yuki || '(未設定)'} m`);
                console.log('');
            });
        }

        // 間口と奥行のバリエーションをカウント
        const widths = new Set();
        const depths = new Set();

        data.forEach(plan => {
            if (plan.maguchi) widths.add(plan.maguchi);
            if (plan.oku_yuki) depths.add(plan.oku_yuki);
        });

        console.log('========================================');
        console.log('📈 実際のバリエーション\n');
        console.log(`間口バリエーション: ${widths.size}種類`);
        if (widths.size > 0) {
            const widthArray = Array.from(widths).sort((a, b) => a - b);
            console.log('  値:', widthArray.map(w => `${w}m`).join(', '));
            console.log('  mm換算:', widthArray.map(w => `${Math.round(w * 1000)}mm`).join(', '));
        }
        console.log('');
        console.log(`奥行バリエーション: ${depths.size}種類`);
        if (depths.size > 0) {
            const depthArray = Array.from(depths).sort((a, b) => a - b);
            console.log('  値:', depthArray.map(d => `${d}m`).join(', '));
            console.log('  mm換算:', depthArray.map(d => `${Math.round(d * 1000)}mm`).join(', '));
        }
        console.log('');

        // マトリックスのデフォルト範囲をチェック
        const defaultWidths = [];
        for (let i = 4095; i <= 7735; i += 455) {
            defaultWidths.push(i);
        }
        const defaultDepths = [];
        for (let i = 6825; i <= 13650; i += 455) {
            defaultDepths.push(i);
        }

        console.log('========================================');
        console.log('🔧 マトリックス表示設定\n');
        console.log('デフォルト間口範囲:', defaultWidths.length, '種類');
        console.log('  値:', defaultWidths.join(', '), 'mm');
        console.log('');
        console.log('デフォルト奥行範囲:', defaultDepths.length, '種類');
        console.log('  値:', defaultDepths.join(', '), 'mm');
        console.log('');

        // 実データとマージした場合の総数を計算
        const mergedWidths = new Set(defaultWidths);
        data.forEach(plan => {
            if (plan.maguchi) {
                const widthMm = Math.round(plan.maguchi * 1000);
                const roundedWidth = Math.ceil(widthMm / 455) * 455;
                mergedWidths.add(roundedWidth);
            }
        });

        const mergedDepths = new Set(defaultDepths);
        data.forEach(plan => {
            if (plan.oku_yuki) {
                const depthMm = Math.round(plan.oku_yuki * 1000);
                const roundedDepth = Math.ceil(depthMm / 455) * 455;
                mergedDepths.add(roundedDepth);
            }
        });

        console.log('========================================');
        console.log('✅ 最終表示数（デフォルト + 実データ）\n');
        console.log(`登録プラン数: ${data.length}`);
        console.log(`間口バリエーション: ${mergedWidths.size}種類`);
        console.log(`奥行バリエーション: ${mergedDepths.size}種類`);
        console.log('========================================\n');

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
    }
}

checkStats().then(() => {
    process.exit(0);
});
