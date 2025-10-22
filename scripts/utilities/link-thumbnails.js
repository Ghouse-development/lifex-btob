/**
 * サムネイル画像をプランに紐付けるスクリプト
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function linkThumbnails() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 サムネイル画像リンク更新');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    // 全プランを取得
    const { data: plans, error } = await supabase
      .from('plans')
      .select('id');

    if (error) throw error;

    console.log(`📋 対象プラン数: ${plans.length} 件`);
    console.log('');

    let updated = 0;
    let failed = 0;

    for (const plan of plans) {
      try {
        // ストレージから画像URLを構築
        const thumbnailUrl = `${supabaseUrl}/storage/v1/object/public/plan-images/${plan.id}/thumbnail.jpg`;

        // プランを更新
        const { error: updateError } = await supabase
          .from('plans')
          .update({ thumbnail_url: thumbnailUrl })
          .eq('id', plan.id);

        if (updateError) {
          console.error(`   ❌ ${plan.id}: ${updateError.message}`);
          failed++;
        } else {
          updated++;
          if (updated % 10 === 0) {
            console.log(`   ✅ 処理中... ${updated}/${plans.length}`);
          }
        }
      } catch (err) {
        console.error(`   ❌ ${plan.id}: ${err.message}`);
        failed++;
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 結果');
    console.log('');
    console.log(`   ✅ 更新成功: ${updated} 件`);
    console.log(`   ❌ 更新失敗: ${failed} 件`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('');
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

linkThumbnails();
