/**
 * データインポート確認スクリプト
 * Supabase のデータが正しくインポートされているか確認
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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 データインポート確認');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    // 1. プランデータ確認
    console.log('1️⃣  プランデータ確認');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, plan_name, tsubo, thumbnail_url', { count: 'exact' });

    if (plansError) throw plansError;

    console.log(`   ✅ プラン数: ${plans.length} 件`);

    let withThumbnails = 0;
    if (plans.length > 0) {
      console.log(`   📝 サンプル: ${plans[0].plan_name} (${plans[0].tsubo}坪)`);

      // サムネイルURLがあるプラン数
      withThumbnails = plans.filter(p => p.thumbnail_url).length;
      console.log(`   🖼️  サムネイル設定済み: ${withThumbnails} 件`);
    }
    console.log('');

    // 2. ユーザープロフィール確認
    console.log('2️⃣  ユーザープロフィール確認');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('email, role, status', { count: 'exact' });

    if (usersError) throw usersError;

    console.log(`   ✅ ユーザー数: ${users.length} 件`);

    const admins = users.filter(u => u.role === 'admin');
    const members = users.filter(u => u.role === 'member');

    console.log(`   👑 管理者: ${admins.length} 件`);
    if (admins.length > 0) {
      admins.forEach(admin => {
        console.log(`      - ${admin.email}`);
      });
    }
    console.log(`   👤 メンバー: ${members.length} 件`);
    console.log('');

    // 3. お知らせデータ確認
    console.log('3️⃣  お知らせデータ確認');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('title', { count: 'exact' });

    if (notifError) throw notifError;

    console.log(`   ✅ お知らせ数: ${notifications.length} 件`);
    if (notifications.length > 0) {
      console.log(`   📢 最新: ${notifications[0].title}`);
    }
    console.log('');

    // 4. ストレージ確認
    console.log('4️⃣  ストレージ確認');

    // plan-images バケット
    const { data: images, error: imagesError } = await supabase
      .storage
      .from('plan-images')
      .list();

    if (!imagesError && images) {
      console.log(`   ✅ plan-images: ${images.length} フォルダ`);

      // 各フォルダ内のファイル数をカウント
      let totalImages = 0;
      for (const folder of images.slice(0, 3)) { // 最初の3つだけチェック
        const { data: files } = await supabase
          .storage
          .from('plan-images')
          .list(folder.name);

        if (files) {
          totalImages += files.length;
        }
      }
      console.log(`   🖼️  画像ファイル（サンプル3フォルダ）: ${totalImages} 件`);
    }

    // plan-drawings バケット
    const { data: drawings, error: drawingsError } = await supabase
      .storage
      .from('plan-drawings')
      .list();

    if (!drawingsError && drawings) {
      console.log(`   ✅ plan-drawings: ${drawings.length} フォルダ`);

      let totalPdfs = 0;
      for (const folder of drawings.slice(0, 3)) {
        const { data: files } = await supabase
          .storage
          .from('plan-drawings')
          .list(folder.name);

        if (files) {
          totalPdfs += files.length;
        }
      }
      console.log(`   📄 PDFファイル（サンプル3フォルダ）: ${totalPdfs} 件`);
    }
    console.log('');

    // 5. その他のテーブル確認
    console.log('5️⃣  その他のテーブル確認');

    const tables = [
      { name: 'faqs', label: 'FAQ' },
      { name: 'faq_categories', label: 'FAQカテゴリ' },
      { name: 'rules', label: 'ルール' },
      { name: 'rule_categories', label: 'ルールカテゴリ' },
      { name: 'downloads', label: 'ダウンロード' },
      { name: 'download_categories', label: 'ダウンロードカテゴリ' }
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log(`   ✅ ${table.label}: ${count} 件`);
      }
    }
    console.log('');

    // 総評
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📈 データインポート状況');
    console.log('');

    const checks = [
      { name: 'プランデータ', ok: plans.length >= 50, count: plans.length, target: '57' },
      { name: 'サムネイル画像', ok: withThumbnails >= 50, count: withThumbnails, target: '52' },
      { name: '管理者アカウント', ok: admins.length >= 2, count: admins.length, target: '2' },
      { name: 'ストレージ', ok: images && images.length >= 50, count: images?.length || 0, target: '52' }
    ];

    let allOk = true;
    checks.forEach(check => {
      const status = check.ok ? '✅' : '⚠️';
      console.log(`${status} ${check.name}: ${check.count}/${check.target}`);
      if (!check.ok) allOk = false;
    });

    console.log('');
    if (allOk) {
      console.log('🎉 すべてのデータが正常にインポートされています！');
    } else {
      console.log('⚠️  一部のデータが不足しています');
    }
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('');
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

verifyData();
