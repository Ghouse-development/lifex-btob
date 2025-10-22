/**
 * プランデータをSupabaseにインポートするスクリプト
 *
 * 実行方法:
 * node scripts/utilities/import-plans-to-supabase.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase接続情報（既存のtest-supabase-connection.jsと同じ）
const supabaseUrl = process.env.SUPABASE_URL || 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

// Supabaseクライアント作成
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// CSVファイルパス
const csvPath = path.join(__dirname, '../../data/plan-metadata/plan-list-generated.csv');

/**
 * CSVファイルを読み込んでパースする
 */
function parseCsv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    // ヘッダー行をスキップ
    const dataLines = lines.slice(1);

    const plans = dataLines.map(line => {
        const columns = line.split(',');

        return {
            plan_name: columns[0],
            tsubo: parseFloat(columns[1]),
            maguchi: parseFloat(columns[2]),
            oku_yuki: parseFloat(columns[3]),
            plan_category: columns[4],
            plan_sub_category: columns[5],
            total_area: parseFloat(columns[6]),
            floor1_area: parseFloat(columns[7]),
            floor2_area: parseFloat(columns[8]),
            drawing_file_path: columns[9],
            remarks: columns[10] || ''
        };
    });

    return plans;
}

/**
 * プランデータをSupabaseにインポート
 */
async function importPlans() {
    console.log('📊 CSVファイルを読み込み中...');
    const plans = parseCsv(csvPath);
    console.log(`✓ ${plans.length}件のプランデータを読み込みました`);

    console.log('\n🚀 Supabaseへのインポート開始...');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const plan of plans) {
        try {
            // plan_nameの重複チェック
            const { data: existing } = await supabase
                .from('plans')
                .select('id')
                .eq('plan_name', plan.plan_name)
                .single();

            if (existing) {
                // 既存データを更新
                const { error } = await supabase
                    .from('plans')
                    .update(plan)
                    .eq('plan_name', plan.plan_name);

                if (error) throw error;
                console.log(`  ↻ ${plan.plan_name} - 更新完了`);
            } else {
                // 新規データを挿入
                const { error } = await supabase
                    .from('plans')
                    .insert([plan]);

                if (error) throw error;
                console.log(`  ✓ ${plan.plan_name} - 追加完了`);
            }

            successCount++;
        } catch (error) {
            errorCount++;
            errors.push({
                plan: plan.plan_name,
                error: error.message
            });
            console.error(`  ✗ ${plan.plan_name} - エラー: ${error.message}`);
        }
    }

    console.log('\n========================================');
    console.log('📊 インポート結果');
    console.log('========================================');
    console.log(`✓ 成功: ${successCount}件`);
    console.log(`✗ 失敗: ${errorCount}件`);
    console.log('========================================');

    if (errors.length > 0) {
        console.log('\n❌ エラー詳細:');
        errors.forEach(({ plan, error }) => {
            console.log(`  - ${plan}: ${error}`);
        });
    }

    return { successCount, errorCount, errors };
}

/**
 * データベース確認
 */
async function verifyImport() {
    console.log('\n🔍 データベース確認中...');

    const { data: plans, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ データベース確認エラー:', error.message);
        return;
    }

    console.log(`\n✅ 確認完了: 最新5件のプラン`);
    console.log('========================================');
    plans.forEach((plan, index) => {
        console.log(`${index + 1}. ${plan.plan_name} (${plan.tsubo}坪)`);
        console.log(`   カテゴリ: ${plan.plan_category}`);
        console.log(`   延床面積: ${plan.total_area}㎡`);
        console.log('');
    });

    // 統計情報
    const { count } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true });

    console.log(`📈 総プラン数: ${count}件`);
    console.log('========================================');
}

// スクリプト実行
(async () => {
    try {
        console.log('========================================');
        console.log('プランデータインポートツール');
        console.log('========================================\n');

        const result = await importPlans();

        if (result.errorCount === 0) {
            await verifyImport();
            console.log('\n✨ インポートが正常に完了しました！');
            process.exit(0);
        } else {
            console.log('\n⚠️ 一部のデータでエラーが発生しました');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ 致命的なエラーが発生しました:', error);
        process.exit(1);
    }
})();
