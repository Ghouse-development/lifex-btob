#!/usr/bin/env node

/**
 * Supabase認証テスト
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const email = process.argv[2] || 'hn@ghouse.jp';
  const password = process.argv[3] || 'Ghouse0648';

  console.log('🔐 認証テスト開始');
  console.log(`Email: ${email}`);
  console.log('');

  try {
    // 認証を試行
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ 認証エラー:', error.message);
      console.error('エラー詳細:', error);
      return;
    }

    console.log('✅ 認証成功!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);

    // プロファイルを取得
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ プロファイル取得エラー:', profileError.message);
      return;
    }

    console.log('');
    console.log('✅ プロファイル取得成功');
    console.log('Company:', profile.company_name);
    console.log('Status:', profile.status);
    console.log('Role:', profile.role);

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

testAuth();
