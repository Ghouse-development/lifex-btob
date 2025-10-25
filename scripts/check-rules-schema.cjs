const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local から環境変数を読み込む
const envContent = fs.readFileSync('.env.local', 'utf-8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSchema() {
  console.log('🔍 === rule_categoriesテーブルのスキーマチェック ===\n');

  // Get one row to see the columns
  const { data, error } = await supabase
    .from('rule_categories')
    .select('*')
    .limit(1);

  if (error) {
    console.log(`❌ エラー: ${error.message}`);
    return;
  }

  if (data && data.length > 0) {
    console.log('カラム一覧:');
    Object.keys(data[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof data[0][key]} = ${data[0][key]}`);
    });
  } else {
    console.log('⚠️  rule_categoriesテーブルにデータがありません');
  }

  console.log('\n=== rulesテーブルのスキーマチェック ===\n');

  const { data: rulesData, error: rulesError } = await supabase
    .from('rules')
    .select('*')
    .limit(1);

  if (rulesError) {
    console.log(`❌ エラー: ${rulesError.message}`);
    return;
  }

  if (rulesData && rulesData.length > 0) {
    console.log('カラム一覧:');
    Object.keys(rulesData[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof rulesData[0][key]} = ${JSON.stringify(rulesData[0][key]).substring(0, 50)}`);
    });
  } else {
    console.log('⚠️  rulesテーブルにデータがありません');
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  });
