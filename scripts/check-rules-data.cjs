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

async function checkRulesData() {
  console.log('🔍 === rulesテーブルのデータチェック ===\n');

  // 全てのrulesを取得
  const { data: allRules, error: allError } = await supabase
    .from('rules')
    .select('id, title, status, category_id, created_at')
    .order('created_at', { ascending: false });

  if (allError) {
    console.log(`❌ エラー: ${allError.message}`);
    return;
  }

  console.log(`総ルール数: ${allRules.length}\n`);

  allRules.forEach((rule, i) => {
    console.log(`${i + 1}. ${rule.title}`);
    console.log(`   ID: ${rule.id}`);
    console.log(`   ステータス: ${rule.status || '(未設定)'}`);
    console.log(`   カテゴリID: ${rule.category_id || '(未設定)'}`);
    console.log('');
  });

  // 「公開」ステータスのrulesを取得
  const { data: publishedRules, error: pubError } = await supabase
    .from('rules')
    .select('id, title, status')
    .eq('status', '公開');

  console.log(`「公開」ステータスのルール数: ${publishedRules?.length || 0}`);

  if (publishedRules && publishedRules.length > 0) {
    publishedRules.forEach((rule, i) => {
      console.log(`  ${i + 1}. ${rule.title}`);
    });
  }

  // statusカラムのユニークな値を確認
  const statuses = [...new Set(allRules.map(r => r.status || '(null)'))];
  console.log(`\nstatusカラムのユニークな値: ${statuses.join(', ')}`);

  // カテゴリも確認
  console.log('\n🔍 === rule_categoriesテーブルのデータチェック ===\n');
  const { data: categories, error: catError } = await supabase
    .from('rule_categories')
    .select('id, name, display_order')
    .order('display_order', { ascending: true });

  if (catError) {
    console.log(`❌ エラー: ${catError.message}`);
    return;
  }

  console.log(`総カテゴリ数: ${categories.length}\n`);

  categories.forEach((cat, i) => {
    const rulesInCat = allRules.filter(r => r.category_id === cat.id);
    console.log(`${i + 1}. ${cat.name} (ID: ${cat.id})`);
    console.log(`   ルール数: ${rulesInCat.length}`);
    console.log('');
  });
}

checkRulesData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  });
