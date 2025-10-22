/**
 * プラン画像・PDFファイルをSupabase Storageにアップロードするスクリプト
 *
 * 実行方法:
 * node scripts/utilities/upload-plans-to-storage.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase接続情報
const supabaseUrl = process.env.SUPABASE_URL || 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseKey);

// ディレクトリパス
const drawingsDir = path.join(__dirname, '../../data/plan-drawings/01｜実施図面');

/**
 * ファイルをSupabase Storageにアップロード
 */
async function uploadFile(filePath, storagePath, bucketName) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        // MIMEタイプを判定
        let contentType = 'application/octet-stream';
        if (fileName.endsWith('.pdf')) {
            contentType = 'application/pdf';
        } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
            contentType = 'image/jpeg';
        } else if (fileName.endsWith('.png')) {
            contentType = 'image/png';
        }

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, fileBuffer, {
                contentType,
                upsert: true // 既存ファイルを上書き
            });

        if (error) {
            throw error;
        }

        // 公開URLを取得
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

        return { success: true, publicUrl };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * プランフォルダを走査してファイルをアップロード
 */
async function uploadPlanFiles() {
    console.log('========================================');
    console.log('プランファイルアップロード開始');
    console.log('========================================\n');

    if (!fs.existsSync(drawingsDir)) {
        console.error(`❌ ディレクトリが見つかりません: ${drawingsDir}`);
        process.exit(1);
    }

    const planFolders = fs.readdirSync(drawingsDir);
    console.log(`📁 ${planFolders.length}個のプランフォルダを発見\n`);

    let uploadedImages = 0;
    let uploadedPDFs = 0;
    let errors = 0;

    for (const planFolder of planFolders) {
        const planPath = path.join(drawingsDir, planFolder);

        if (!fs.statSync(planPath).isDirectory()) {
            continue;
        }

        console.log(`\n📦 処理中: ${planFolder}`);

        // プレゼンPDFを探す
        const presentationFile = `プレゼン　${planFolder}.pdf`;
        const presentationPath = path.join(planPath, presentationFile);

        if (fs.existsSync(presentationPath)) {
            const storagePath = `${planFolder}/${presentationFile}`;
            const result = await uploadFile(presentationPath, storagePath, 'plan-drawings');

            if (result.success) {
                console.log(`  ✓ PDF: ${presentationFile}`);
                uploadedPDFs++;
            } else {
                console.error(`  ✗ PDF エラー: ${result.error}`);
                errors++;
            }
        }

        // パース画像を探す
        const parseImagePath = path.join(planPath, '06その他', `パース外観　${planFolder}.jpg`);

        if (fs.existsSync(parseImagePath)) {
            const storagePath = `${planFolder}/exterior.jpg`;
            const result = await uploadFile(parseImagePath, storagePath, 'plan-images');

            if (result.success) {
                console.log(`  ✓ 画像: exterior.jpg`);
                uploadedImages++;
            } else {
                console.error(`  ✗ 画像 エラー: ${result.error}`);
                errors++;
            }
        }
    }

    console.log('\n========================================');
    console.log('アップロード完了');
    console.log('========================================');
    console.log(`✓ 画像: ${uploadedImages}件`);
    console.log(`✓ PDF: ${uploadedPDFs}件`);
    console.log(`✗ エラー: ${errors}件`);
    console.log('========================================\n');

    return { uploadedImages, uploadedPDFs, errors };
}

/**
 * プランデータのURLを更新
 */
async function updatePlanUrls() {
    console.log('プランデータのURL更新中...\n');

    const { data: plans, error } = await supabase
        .from('plans')
        .select('id, plan_name, drawing_file_path');

    if (error) {
        console.error('❌ プラン取得エラー:', error.message);
        return;
    }

    let updated = 0;

    for (const plan of plans) {
        // drawing_file_pathからプランフォルダ名を抽出
        const match = plan.drawing_file_path?.match(/01｜実施図面\/([^/]+)\//);
        if (!match) continue;

        const planFolder = match[1];

        // ストレージのURLを生成
        const { data: { publicUrl: drawingUrl } } = supabase.storage
            .from('plan-drawings')
            .getPublicUrl(`${planFolder}/プレゼン　${planFolder}.pdf`);

        const { data: { publicUrl: thumbnailUrl } } = supabase.storage
            .from('plan-images')
            .getPublicUrl(`${planFolder}/exterior.jpg`);

        // プランデータを更新
        const { error: updateError } = await supabase
            .from('plans')
            .update({
                drawing_file_path: drawingUrl,
                thumbnail_url: thumbnailUrl
            })
            .eq('id', plan.id);

        if (updateError) {
            console.error(`  ✗ ${plan.plan_name}: ${updateError.message}`);
        } else {
            console.log(`  ✓ ${plan.plan_name}`);
            updated++;
        }
    }

    console.log(`\n✅ ${updated}件のプランURLを更新しました\n`);
}

// スクリプト実行
(async () => {
    try {
        // ファイルアップロード
        const result = await uploadPlanFiles();

        if (result.errors === 0) {
            // URL更新
            await updatePlanUrls();
            console.log('✨ 全ての処理が完了しました！');
            process.exit(0);
        } else {
            console.log('⚠️ 一部のファイルでエラーが発生しました');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ 致命的なエラー:', error);
        process.exit(1);
    }
})();
