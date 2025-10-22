/**
 * プランフォルダからCSVを自動生成するスクリプト
 *
 * 実行方法:
 * node scripts/utilities/generate-plan-csv.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// フォルダパス
const planDrawingsDir = path.join(__dirname, '../../data/plan-drawings/01｜実施図面');
const outputCsvPath = path.join(__dirname, '../../data/plan-metadata/plan-list-generated.csv');

// 方位コードマッピング
const directionMap = {
    'N': '北入',
    'S': '南入',
    'E': '東入',
    'W': '西入'
};

// 階数コードマッピング
const floorCodeMap = {
    '11': { living: '1階', bath: '1階', category: '平屋' },
    '12': { living: '1階', bath: '2階', category: '2階建て' },
    '21': { living: '2階', bath: '1階', category: '2階建て' },
    '22': { living: '2階', bath: '2階', category: '2階建て' }
};

/**
 * プランフォルダ名をパースする
 * 例: 28-40-N-12-001 -> { tsubo: 28, maguchi: 4.0, direction: '北入', floorCode: '12', planNo: '001' }
 */
function parsePlanFolderName(folderName) {
    // 特殊なケース（箕面市稲など）を処理
    const cleanName = folderName.replace(/\(.*\)/, '').trim();

    const parts = cleanName.split('-');
    if (parts.length < 5) {
        return null; // txtファイルなどをスキップ
    }

    const tsubo = parseInt(parts[0]);
    const maguchi = parseInt(parts[1]) / 10.0; // 40 -> 4.0m
    const direction = directionMap[parts[2]] || parts[2];
    const floorCode = parts[3];
    const planNo = parts[4];

    const floorInfo = floorCodeMap[floorCode] || {
        living: '不明',
        bath: '不明',
        category: '2階建て'
    };

    // 延床面積を坪数から計算（1坪 = 3.30578512㎡）
    const totalArea = (tsubo * 3.30578512).toFixed(2);

    // 1階・2階床面積を推定
    let floor1Area = 0;
    let floor2Area = 0;

    if (floorInfo.category === '平屋') {
        floor1Area = totalArea;
        floor2Area = 0;
    } else if (floorInfo.category === '2階建て') {
        // 簡易推定: 1階6割、2階4割
        floor1Area = (totalArea * 0.6).toFixed(2);
        floor2Area = (totalArea * 0.4).toFixed(2);
    }

    // プラン名を生成
    const planName = `${tsubo}坪_${direction}_${floorInfo.living}LDK_${planNo}`;

    // サブカテゴリ
    const subCategory = `${direction}_${floorInfo.living}LDK${floorInfo.bath}UB`;

    // 図面ファイルパス
    const drawingFile = `01｜実施図面/${folderName}/プレゼン　${folderName}.pdf`;

    return {
        planName,
        tsubo,
        maguchi,
        okuYuki: 0, // 奥行は計算できないため0
        category: floorInfo.category,
        subCategory,
        totalArea,
        floor1Area,
        floor2Area,
        drawingFile,
        remarks: `接道: ${direction}, リビング: ${floorInfo.living}, UB: ${floorInfo.bath}`,
        originalFolder: folderName
    };
}

/**
 * CSVを生成
 */
function generateCsv() {
    console.log('プランフォルダを読み込み中...');

    // フォルダ一覧を取得
    const folders = fs.readdirSync(planDrawingsDir);
    console.log(`${folders.length} 個のアイテムを発見`);

    // プランデータをパース
    const plans = [];
    for (const folder of folders) {
        const folderPath = path.join(planDrawingsDir, folder);
        const stat = fs.statSync(folderPath);

        if (stat.isDirectory()) {
            const planData = parsePlanFolderName(folder);
            if (planData) {
                plans.push(planData);
                console.log(`✓ ${folder} -> ${planData.planName}`);
            }
        }
    }

    console.log(`\n合計 ${plans.length} プランを解析しました`);

    // CSVヘッダー
    const header = 'プラン名,坪数,間口,奥行,カテゴリ,サブカテゴリ,延床面積,1階床面積,2階床面積,図面ファイル名,備考';

    // CSV行を生成
    const rows = plans.map(plan => {
        return [
            plan.planName,
            plan.tsubo,
            plan.maguchi,
            plan.okuYuki,
            plan.category,
            plan.subCategory,
            plan.totalArea,
            plan.floor1Area,
            plan.floor2Area,
            plan.drawingFile,
            plan.remarks
        ].join(',');
    });

    // CSVファイルに書き込み
    const csvContent = [header, ...rows].join('\n');
    fs.writeFileSync(outputCsvPath, csvContent, 'utf8');

    console.log(`\n✅ CSVファイルを生成しました: ${outputCsvPath}`);
    console.log(`📊 プラン数: ${plans.length}`);

    // 統計情報
    const stats = {
        平屋: plans.filter(p => p.category === '平屋').length,
        '2階建て': plans.filter(p => p.category === '2階建て').length,
        最小坪数: Math.min(...plans.map(p => p.tsubo)),
        最大坪数: Math.max(...plans.map(p => p.tsubo))
    };

    console.log('\n📈 統計情報:');
    console.log(`  - 平屋: ${stats.平屋}件`);
    console.log(`  - 2階建て: ${stats['2階建て']}件`);
    console.log(`  - 坪数範囲: ${stats.最小坪数}坪 〜 ${stats.最大坪数}坪`);

    return plans;
}

// スクリプト実行
try {
    const plans = generateCsv();
    console.log('\n✨ 完了しました！');
    process.exit(0);
} catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
}
