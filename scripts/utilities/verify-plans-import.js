/**
 * プランデータのインポート結果を確認するスクリプト
 *
 * 実行方法:
 * node scripts/utilities/verify-plans-import.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase接続情報
const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPlansImport() {
    console.log('========================================');
    console.log('プランデータインポート結果確認');
    console.log('========================================\n');

    try {
        // 総プラン数を取得
        const { count, error: countError } = await supabase
            .from('plans')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ エラー:', countError.message);
            return;
        }

        console.log(`✅ 総プラン数: ${count}件\n`);

        // カテゴリ別の件数
        const { data: categories, error: catError } = await supabase
            .from('plans')
            .select('plan_category');

        if (!catError && categories) {
            const categoryCounts = categories.reduce((acc, plan) => {
                acc[plan.plan_category] = (acc[plan.plan_category] || 0) + 1;
                return acc;
            }, {});

            console.log('📊 カテゴリ別プラン数:');
            Object.entries(categoryCounts).forEach(([category, count]) => {
                console.log(`  - ${category}: ${count}件`);
            });
            console.log('');
        }

        // 坪数の範囲
        const { data: tsuboData, error: tsuboError } = await supabase
            .from('plans')
            .select('tsubo')
            .order('tsubo', { ascending: true });

        if (!tsuboError && tsuboData && tsuboData.length > 0) {
            const tsubos = tsuboData.map(p => p.tsubo);
            console.log('📏 坪数範囲:');
            console.log(`  最小: ${Math.min(...tsubos)}坪`);
            console.log(`  最大: ${Math.max(...tsubos)}坪`);
            console.log('');
        }

        // 最新5件のプランを表示
        const { data: recentPlans, error: recentError } = await supabase
            .from('plans')
            .select('plan_name, tsubo, plan_category, maguchi, total_area')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!recentError && recentPlans) {
            console.log('📋 最新5件のプラン:');
            recentPlans.forEach((plan, index) => {
                console.log(`\n${index + 1}. ${plan.plan_name}`);
                console.log(`   坪数: ${plan.tsubo}坪 | カテゴリ: ${plan.plan_category}`);
                console.log(`   間口: ${plan.maguchi}m | 延床面積: ${plan.total_area}㎡`);
            });
            console.log('');
        }

        console.log('========================================');
        console.log('✨ インポート結果の確認が完了しました！');
        console.log('========================================');

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
    }
}

// スクリプト実行
verifyPlansImport().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
});
