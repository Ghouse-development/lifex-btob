#!/usr/bin/env node

/**
 * ユーザーリスト表示
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
  console.log('👥 ユーザーリスト取得中...\n');

  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, email, company_name, status, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ エラー:', error.message);
      console.error('詳細:', error);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ ユーザーが見つかりませんでした');
      console.log('');
      console.log('user_profilesテーブルが空か、RLSポリシーによりアクセスできません。');
      return;
    }

    console.log(`✅ ${profiles.length}件のユーザーが見つかりました\n`);
    console.log('='.repeat(80));

    profiles.forEach((profile, i) => {
      console.log(`\n${i + 1}. ${profile.company_name || '(会社名なし)'}`);
      console.log(`   Email: ${profile.email || '(メールアドレスなし)'}`);
      console.log(`   Status: ${profile.status}`);
      console.log(`   Role: ${profile.role || 'user'}`);
      console.log(`   Created: ${new Date(profile.created_at).toLocaleString('ja-JP')}`);
    });

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

listUsers();
