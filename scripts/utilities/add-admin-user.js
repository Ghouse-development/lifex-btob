/**
 * 管理者アカウント追加スクリプト
 *
 * 使用方法:
 * node scripts/utilities/add-admin-user.js
 *
 * 必要な環境変数:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (Service Role Key)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESM で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local を読み込み
dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: 環境変数が設定されていません');
  console.error('');
  console.error('必要な環境変数:');
  console.error('  VITE_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Vercel環境変数を確認するか、.env.local を作成してください');
  process.exit(1);
}

// Service Role Key でクライアント作成（Admin権限）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * 管理者アカウントを追加
 */
async function addAdminUser() {
  console.log('🔐 管理者アカウント追加スクリプト');
  console.log('');

  const email = 'admin@ghouse.jp';
  const password = 'Ghouse0648';

  try {
    console.log('👤 ユーザーを作成中...');
    console.log(`   Email: ${email}`);

    // Admin API でユーザーを作成
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // メール確認をスキップ
      user_metadata: {
        company_name: '株式会社Gハウス',
        contact_name: '西野秀樹'
      }
    });

    if (createError) {
      // ユーザーが既に存在する場合
      if (createError.message.includes('already registered')) {
        console.log('⚠️  ユーザーは既に存在します');
        console.log('');

        // 既存ユーザーを取得
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          throw listError;
        }

        const existingUser = existingUsers.users.find(u => u.email === email);

        if (!existingUser) {
          throw new Error('ユーザーが見つかりませんでした');
        }

        console.log('✅ 既存ユーザーID:', existingUser.id);
        console.log('');

        // user_profiles を更新
        await updateUserProfile(existingUser.id, email);
        return;
      }

      throw createError;
    }

    console.log('✅ ユーザー作成成功');
    console.log(`   User ID: ${user.user.id}`);
    console.log('');

    // user_profiles テーブルを確認・更新
    await updateUserProfile(user.user.id, email);

  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

/**
 * user_profiles テーブルを更新
 */
async function updateUserProfile(userId, email) {
  console.log('📝 user_profiles を更新中...');

  try {
    // 既存のプロフィールを確認
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = Row not found（エラーではない）
      throw fetchError;
    }

    const profileData = {
      id: userId,
      email: email,
      company_name: '株式会社Gハウス',
      company_code: 'GH000',
      contact_name: '西野秀樹',
      phone: '06-6954-0648',
      role: 'admin', // 重要！
      status: 'active',
      updated_at: new Date().toISOString()
    };

    if (existingProfile) {
      // 既存プロフィールを更新
      console.log('   既存プロフィールを更新...');

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          company_name: profileData.company_name,
          company_code: profileData.company_code,
          contact_name: profileData.contact_name,
          phone: profileData.phone,
          role: profileData.role,
          status: profileData.status,
          updated_at: profileData.updated_at
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      console.log('✅ プロフィール更新成功');
    } else {
      // 新規プロフィールを作成
      console.log('   新規プロフィールを作成...');

      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      console.log('✅ プロフィール作成成功');
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎉 管理者アカウントの追加が完了しました！');
    console.log('');
    console.log('📧 Email: admin@ghouse.jp');
    console.log('🔑 Password: Ghouse0648');
    console.log('👤 Role: admin');
    console.log('✅ Status: active');
    console.log('');
    console.log('ログインテスト:');
    console.log('  ローカル: http://localhost:3000/admin-login.html');
    console.log('  本番: https://lifex-btob.vercel.app/admin-login.html');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ プロフィール更新エラー:', error.message);
    throw error;
  }
}

// スクリプト実行
addAdminUser();
