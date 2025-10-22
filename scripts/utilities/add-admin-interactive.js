/**
 * 管理者アカウント追加スクリプト（対話式）
 *
 * 使用方法:
 * node scripts/utilities/add-admin-interactive.js
 *
 * Service Role Key は実行時に入力してください
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 管理者アカウント追加スクリプト（対話式）');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('このスクリプトは以下のアカウントを追加します:');
  console.log('  📧 Email: admin@ghouse.jp');
  console.log('  🔑 Password: Ghouse0648');
  console.log('  👤 Role: admin');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Service Role Key を取得する手順を表示
  console.log('📋 準備: Supabase Service Role Key を取得してください');
  console.log('');
  console.log('1. https://supabase.com/dashboard にアクセス');
  console.log('2. プロジェクト hegpxvyziovlfxdfsrsv を選択');
  console.log('3. Settings → API をクリック');
  console.log('4. "Project API keys" セクションを探す');
  console.log('5. "service_role" の "secret" 欄をコピー');
  console.log('   （注意: anon ではなく service_role です！）');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const serviceRoleKey = await question('Service Role Key を貼り付けてください: ');
  console.log('');

  if (!serviceRoleKey || serviceRoleKey.length < 100) {
    console.error('❌ エラー: Service Role Key が無効です');
    console.error('   キーは通常 100文字以上の長い文字列です');
    rl.close();
    process.exit(1);
  }

  const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';

  // Supabase Admin クライアント作成
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('👤 ユーザーを作成中...');

    // ユーザー作成
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@ghouse.jp',
      password: 'Ghouse0648',
      email_confirm: true,
      user_metadata: {
        company_name: '株式会社Gハウス',
        contact_name: '西野秀樹'
      }
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('⚠️  ユーザーは既に存在します - プロフィールを更新します');
        console.log('');

        // 既存ユーザーを取得
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === 'admin@ghouse.jp');

        if (existingUser) {
          await updateProfile(supabase, existingUser.id);
          rl.close();
          return;
        }
      }
      throw createError;
    }

    console.log('✅ ユーザー作成成功');
    console.log(`   User ID: ${user.user.id}`);
    console.log('');

    // プロフィール更新
    await updateProfile(supabase, user.user.id);

  } catch (error) {
    console.error('');
    console.error('❌ エラーが発生しました:');
    console.error('   ', error.message);
    console.error('');

    if (error.message.includes('JWT')) {
      console.error('💡 ヒント: Service Role Key が正しいか確認してください');
      console.error('   anon key ではなく service_role key を使用してください');
    }
  } finally {
    rl.close();
  }
}

async function updateProfile(supabase, userId) {
  console.log('📝 user_profiles を更新中...');

  const profileData = {
    id: userId,
    email: 'admin@ghouse.jp',
    company_name: '株式会社Gハウス',
    company_code: 'GH000',
    contact_name: '西野秀樹',
    phone: '06-6954-0648',
    role: 'admin',
    status: 'active',
    updated_at: new Date().toISOString()
  };

  // 既存プロフィールを確認
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existing) {
    // 更新
    const { error } = await supabase
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

    if (error) throw error;
    console.log('✅ プロフィール更新成功');
  } else {
    // 新規作成
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        ...profileData,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
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
}

main();
