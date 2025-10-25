const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local から環境変数を読み込む
const envContent = fs.readFileSync('.env.local', 'utf-8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

console.log('🔍 === Supabase設定チェック ===\n');

// Service Role Keyで接続（全権限）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSupabase() {
  const results = {
    connection: null,
    tables: [],
    policies: [],
    errors: []
  };

  // 1. 接続テスト
  console.log('📡 === 接続テスト ===');
  try {
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ 接続失敗: ${error.message}`);
      results.connection = { status: 'ERROR', detail: error.message };
      results.errors.push(`接続エラー: ${error.message}`);
    } else {
      console.log(`✅ Supabase接続成功`);
      results.connection = { status: 'OK', detail: '接続成功' };
    }
  } catch (error) {
    console.log(`❌ 接続例外: ${error.message}`);
    results.connection = { status: 'ERROR', detail: error.message };
    results.errors.push(`接続例外: ${error.message}`);
  }

  // 2. テーブル存在確認
  console.log('\n📋 === テーブル構造チェック ===');
  const requiredTables = [
    'user_profiles',
    'plans',
    'rules',
    'rule_categories'
  ];

  for (const tableName of requiredTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName}: エラー - ${error.message}`);
        results.tables.push({ name: tableName, status: 'ERROR', detail: error.message, count: 0 });
        results.errors.push(`${tableName}テーブル: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: 存在する (${count || 0}行)`);
        results.tables.push({ name: tableName, status: 'OK', detail: '存在する', count: count || 0 });
      }
    } catch (error) {
      console.log(`❌ ${tableName}: 例外 - ${error.message}`);
      results.tables.push({ name: tableName, status: 'ERROR', detail: error.message, count: 0 });
      results.errors.push(`${tableName}テーブル例外: ${error.message}`);
    }
  }

  // 3. RLSポリシーチェック（SQL直接実行）
  console.log('\n🔐 === RLSポリシーチェック ===');

  try {
    const { data: policies, error } = await supabase.rpc('get_policies');

    if (error) {
      // RPCが存在しない場合、pg_policies から直接取得を試みる
      console.log('⚠️  RPC get_policies が存在しないため、代替方法で確認します');

      // テーブルごとにRLS状態を確認
      for (const tableName of requiredTables) {
        try {
          // anonキーで接続テスト
          const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          const { data, error: anonError } = await anonClient
            .from(tableName)
            .select('*')
            .limit(1);

          if (anonError) {
            if (anonError.code === '42501') {
              console.log(`❌ ${tableName}: RLSポリシーなし（403 Forbidden）`);
              results.policies.push({
                table: tableName,
                status: 'ERROR',
                detail: 'anonロールでのアクセス不可 - ポリシー未設定'
              });
              results.errors.push(`${tableName}: RLSポリシー未設定`);
            } else if (anonError.code === '42P01') {
              console.log(`⚠️  ${tableName}: テーブルが存在しない`);
              results.policies.push({
                table: tableName,
                status: 'WARNING',
                detail: 'テーブルが存在しない'
              });
            } else {
              console.log(`⚠️  ${tableName}: ${anonError.message}`);
              results.policies.push({
                table: tableName,
                status: 'WARNING',
                detail: anonError.message
              });
            }
          } else {
            console.log(`✅ ${tableName}: anonロールでアクセス可能（RLSポリシー設定済み）`);
            results.policies.push({
              table: tableName,
              status: 'OK',
              detail: 'anonロールでアクセス可能'
            });
          }
        } catch (error) {
          console.log(`❌ ${tableName}: 例外 - ${error.message}`);
          results.policies.push({
            table: tableName,
            status: 'ERROR',
            detail: error.message
          });
        }
      }
    }
  } catch (error) {
    console.log(`❌ RLSポリシーチェック例外: ${error.message}`);
    results.errors.push(`RLSチェック例外: ${error.message}`);
  }

  // 4. データサンプル確認
  console.log('\n📊 === データ確認 ===');

  // user_profiles
  try {
    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('id, company_name, role', { count: 'exact' })
      .limit(3);

    if (error) {
      console.log(`❌ user_profiles データ: ${error.message}`);
    } else {
      console.log(`✅ user_profiles: ${count || 0}件`);
      if (data && data.length > 0) {
        console.log(`   サンプル: ${data[0].company_name || 'N/A'} (role: ${data[0].role || 'N/A'})`);
      }
    }
  } catch (error) {
    console.log(`❌ user_profiles データ例外: ${error.message}`);
  }

  // plans
  try {
    const { data, error, count } = await supabase
      .from('plans')
      .select('id, name, price', { count: 'exact' })
      .limit(3);

    if (error) {
      console.log(`❌ plans データ: ${error.message}`);
    } else {
      console.log(`✅ plans: ${count || 0}件`);
      if (data && data.length > 0) {
        console.log(`   サンプル: ${data[0].name || 'N/A'} (¥${data[0].price || 0})`);
      }
    }
  } catch (error) {
    console.log(`❌ plans データ例外: ${error.message}`);
  }

  // サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 === チェックサマリー ===');
  console.log('='.repeat(60));

  const allOk = results.errors.length === 0;

  console.log(`\n接続: ${results.connection?.status === 'OK' ? '✅ OK' : '❌ NG'}`);
  console.log(`テーブル: ${results.tables.filter(t => t.status === 'OK').length}/${requiredTables.length} OK`);
  console.log(`RLSポリシー: ${results.policies.filter(p => p.status === 'OK').length}/${requiredTables.length} OK`);

  if (results.errors.length > 0) {
    console.log('\n❌ === エラー一覧 ===');
    results.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  if (allOk) {
    console.log('🎉 === 全てのチェックが合格しました ===');
  } else {
    console.log('❌ === 一部のチェックが失敗しました ===');
    console.log('\n📝 修正が必要な項目:');

    results.policies
      .filter(p => p.status === 'ERROR')
      .forEach(p => {
        console.log(`\n${p.table} テーブルのRLSポリシー設定:`);
        console.log(`  1. Supabase Dashboard → Authentication → Policies`);
        console.log(`  2. ${p.table} テーブルを選択`);
        console.log(`  3. "New Policy" → "Enable read access for all users"`);
        console.log(`  4. Target roles: anon + authenticated を選択`);
        console.log(`  5. Create policy`);
      });
  }
  console.log('='.repeat(60) + '\n');

  return allOk;
}

checkSupabase()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  });
