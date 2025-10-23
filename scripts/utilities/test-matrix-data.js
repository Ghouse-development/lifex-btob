import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('========================================');
console.log('マトリックスデータ変換テスト');
console.log('========================================\n');

// 455単位で繰り上げる関数（matrix.htmlと同じ）
function roundUpTo455(value) {
    return Math.ceil(value / 455) * 455;
}

async function testMatrixData() {
    try {
        // Supabaseからプランを取得（matrix.htmlと同じクエリ）
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabaseエラー:', error.message);
            return;
        }

        console.log(`📊 取得したプラン数: ${data.length}\n`);

        // Supabaseのデータ形式をマトリックス用に変換（matrix.htmlと同じロジック）
        const plans = (data || []).map(plan => ({
            id: plan.id,
            name: plan.plan_name,
            width: plan.width || 0,
            depth: plan.depth || 0,
            tsubo: plan.tsubo,
            planCode: plan.plan_code
        }));

        console.log('変換後のプランデータ:\n');
        plans.forEach((plan, i) => {
            console.log(`${i+1}. ${plan.planCode || plan.id.substring(0, 8)}`);
            console.log(`   名前: ${plan.name}`);
            console.log(`   width: ${plan.width}mm`);
            console.log(`   depth: ${plan.depth}mm`);
            console.log('');
        });

        // 間口と奥行のオプションを生成（matrix.htmlと同じロジック）
        const widthSet = new Set();
        const depthSet = new Set();

        plans.forEach(plan => {
            if (plan.width) widthSet.add(roundUpTo455(plan.width));
            if (plan.depth) depthSet.add(roundUpTo455(plan.depth));
        });

        const widthOptions = Array.from(widthSet).sort((a, b) => a - b);
        const depthOptions = Array.from(depthSet).sort((a, b) => a - b);

        console.log('========================================');
        console.log('マトリックスオプション:\n');
        console.log(`間口バリエーション: ${widthOptions.length}種類`);
        if (widthOptions.length > 0) {
            console.log('  値:', widthOptions.join('mm, ') + 'mm');
        }
        console.log('');
        console.log(`奥行バリエーション: ${depthOptions.length}種類`);
        if (depthOptions.length > 0) {
            console.log('  値:', depthOptions.join('mm, ') + 'mm');
        }
        console.log('');

        // マトリックス配置
        console.log('========================================');
        console.log('マトリックス配置:\n');

        const planMatrix = {};
        plans.forEach(plan => {
            if (plan.width && plan.depth) {
                const roundedWidth = roundUpTo455(plan.width);
                const roundedDepth = roundUpTo455(plan.depth);
                const key = `${roundedWidth}-${roundedDepth}`;

                if (!planMatrix[key]) {
                    planMatrix[key] = [];
                }
                planMatrix[key].push(plan);

                console.log(`✅ [${plan.planCode || plan.id.substring(0, 8)}]`);
                console.log(`   元の寸法: ${plan.width}mm × ${plan.depth}mm`);
                console.log(`   配置位置: ${roundedWidth}mm × ${roundedDepth}mm`);
                console.log('');
            }
        });

        if (Object.keys(planMatrix).length === 0) {
            console.log('❌ マトリックスにプランが配置されませんでした');
            console.log('   理由: width または depth が 0 です');
        }

        console.log('========================================\n');

    } catch (err) {
        console.error('❌ 予期しないエラー:', err);
    }
}

testMatrixData().then(() => {
    process.exit(0);
});
