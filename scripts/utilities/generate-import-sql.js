/**
 * CSVからSQL INSERT文を生成するスクリプト
 *
 * 実行方法:
 * node scripts/utilities/generate-import-sql.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ファイルパス
const csvPath = path.join(__dirname, '../../data/plan-metadata/plan-list-generated.csv');
const outputSqlPath = path.join(__dirname, 'import-plans-complete.sql');

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
            plan_name: columns[0].replace(/'/g, "''"), // シングルクォートをエスケープ
            tsubo: parseFloat(columns[1]),
            maguchi: parseFloat(columns[2]),
            oku_yuki: parseFloat(columns[3]),
            plan_category: columns[4],
            plan_sub_category: columns[5],
            total_area: parseFloat(columns[6]),
            floor1_area: parseFloat(columns[7]),
            floor2_area: parseFloat(columns[8]),
            drawing_file_path: columns[9],
            remarks: (columns[10] || '').replace(/'/g, "''") // シングルクォートをエスケープ
        };
    });

    return plans;
}

/**
 * SQL INSERT文を生成
 */
function generateSql() {
    console.log('📊 CSVファイルを読み込み中...');
    const plans = parseCsv(csvPath);
    console.log(`✓ ${plans.length}件のプランデータを読み込みました`);

    console.log('\n📝 SQL INSERT文を生成中...');

    // SQLヘッダー
    const sqlHeader = `-- ==========================================================
-- プランデータ一括インポートSQL
-- ==========================================================
-- 使い方: このファイル全体をSupabase SQL Editorにコピペして実行
-- データ件数: ${plans.length}件
-- ==========================================================

-- 1. RLSを一時的に無効化
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- 2. 既存データを削除（必要に応じてコメントアウトを解除）
-- DELETE FROM plans;

-- 3. プランデータを挿入
INSERT INTO plans (plan_name, tsubo, maguchi, oku_yuki, plan_category, plan_sub_category, total_area, floor1_area, floor2_area, drawing_file_path, remarks) VALUES
`;

    // INSERT文の生成
    const insertValues = plans.map((plan, index) => {
        const isLast = index === plans.length - 1;
        return `('${plan.plan_name}', ${plan.tsubo}, ${plan.maguchi}, ${plan.oku_yuki}, '${plan.plan_category}', '${plan.plan_sub_category}', ${plan.total_area}, ${plan.floor1_area}, ${plan.floor2_area}, '${plan.drawing_file_path}', '${plan.remarks}')${isLast ? '' : ','}`;
    }).join('\n');

    // SQLフッター
    const sqlFooter = `
ON CONFLICT (plan_name) DO UPDATE SET
    tsubo = EXCLUDED.tsubo,
    maguchi = EXCLUDED.maguchi,
    oku_yuki = EXCLUDED.oku_yuki,
    plan_category = EXCLUDED.plan_category,
    plan_sub_category = EXCLUDED.plan_sub_category,
    total_area = EXCLUDED.total_area,
    floor1_area = EXCLUDED.floor1_area,
    floor2_area = EXCLUDED.floor2_area,
    drawing_file_path = EXCLUDED.drawing_file_path,
    remarks = EXCLUDED.remarks,
    updated_at = NOW();

-- 4. RLSを再度有効化
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 5. 結果確認
SELECT COUNT(*) as total_plans FROM plans;
SELECT plan_name, tsubo, plan_category FROM plans ORDER BY created_at DESC LIMIT 10;

-- 完了メッセージ
DO $$
DECLARE
    plan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plan_count FROM plans;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'プランデータのインポートが完了しました！';
    RAISE NOTICE '総プラン数: % 件', plan_count;
    RAISE NOTICE '========================================';
END $$;
`;

    // SQL全体を結合
    const fullSql = sqlHeader + insertValues + sqlFooter;

    // ファイルに書き込み
    fs.writeFileSync(outputSqlPath, fullSql, 'utf8');

    console.log(`\n✅ SQLファイルを生成しました: ${outputSqlPath}`);
    console.log(`📊 プラン数: ${plans.length}件`);
    console.log('\n次のステップ:');
    console.log('1. Supabaseダッシュボードにアクセス: https://supabase.com/dashboard');
    console.log('2. プロジェクトを選択');
    console.log('3. 左メニューから「SQL Editor」を選択');
    console.log(`4. ${outputSqlPath} の内容をコピーして貼り付け`);
    console.log('5. 「RUN」ボタンをクリック');
    console.log('\n✨ 完了！');
}

// スクリプト実行
try {
    generateSql();
    process.exit(0);
} catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
}
