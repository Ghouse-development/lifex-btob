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

async function checkAllStatus() {
  console.log('🔍 === 全テーブルのstatusカラムチェック ===\n');

  // Rules
  console.log('📋 === Rules ===');
  const { data: rules } = await supabase
    .from('rules')
    .select('id, title, status');
  console.log(`総数: ${rules?.length || 0}`);
  const ruleStatuses = [...new Set((rules || []).map(r => r.status || '(null)'))];
  console.log(`statusの値: ${ruleStatuses.join(', ')}`);
  console.log('');

  // Plans
  console.log('🏠 === Plans ===');
  const { data: plans } = await supabase
    .from('plans')
    .select('id, plan_name, status');
  console.log(`総数: ${plans?.length || 0}`);
  const planStatuses = [...new Set((plans || []).map(p => p.status || '(null)'))];
  console.log(`statusの値: ${planStatuses.join(', ')}`);
  console.log('');

  // FAQs
  console.log('❓ === FAQs ===');
  const { data: faqs } = await supabase
    .from('faqs')
    .select('id, question, status');
  console.log(`総数: ${faqs?.length || 0}`);
  const faqStatuses = [...new Set((faqs || []).map(f => f.status || '(null)'))];
  console.log(`statusの値: ${faqStatuses.join(', ')}`);
  console.log('');

  // Summary
  console.log('📊 === まとめ ===');
  console.log('rules.html は .eq("status", "公開") でフィルタ → 実際の値:', ruleStatuses.join(', '));
  console.log('plans.html は .eq("status", "公開") でフィルタ → 実際の値:', planStatuses.join(', '));
  console.log('faq.html は .eq("status", "published") でフィルタ → 実際の値:', faqStatuses.join(', '));
}

checkAllStatus()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  });
