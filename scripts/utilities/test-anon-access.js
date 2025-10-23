import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

// ANON KEYで接続（フロントエンドと同じ）
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

console.log('========================================');
console.log('🔍 ANON KEY でのデータアクセステスト');
console.log('========================================\n');

async function testAnonAccess() {
    console.log('📊 Plans テーブル (ANON KEY)');
    const { data: plans, error: plansError } = await anonClient
        .from('plans')
        .select('*')
        .eq('status', 'published');

    if (plansError) {
        console.log('   ❌ エラー:', plansError.message);
        console.log('   コード:', plansError.code);
        console.log('   詳細:', plansError.details);
        console.log('   ヒント:', plansError.hint);
    } else {
        console.log('   ✅ 取得成功:', plans.length, '件');
        if (plans.length === 0) {
            console.log('   ⚠️  データが0件です！RLSポリシーを確認してください');
        }
    }

    console.log('\n📊 Rules テーブル (ANON KEY)');
    const { data: rules, error: rulesError } = await anonClient
        .from('rules')
        .select('*')
        .eq('status', 'active');

    if (rulesError) {
        console.log('   ❌ エラー:', rulesError.message);
        console.log('   コード:', rulesError.code);
    } else {
        console.log('   ✅ 取得成功:', rules.length, '件');
        if (rules.length === 0) {
            console.log('   ⚠️  データが0件です！RLSポリシーを確認してください');
        }
    }

    console.log('\n📊 FAQs テーブル (ANON KEY)');
    const { data: faqs, error: faqsError } = await anonClient
        .from('faqs')
        .select('*')
        .eq('status', 'published');

    if (faqsError) {
        console.log('   ❌ エラー:', faqsError.message);
        console.log('   コード:', faqsError.code);
    } else {
        console.log('   ✅ 取得成功:', faqs.length, '件');
        if (faqs.length === 0) {
            console.log('   ⚠️  データが0件です！RLSポリシーを確認してください');
        }
    }

    console.log('\n========================================');
    console.log('📝 まとめ');
    console.log('========================================\n');

    if (plansError || rulesError || faqsError) {
        console.log('🚨 RLSポリシーに問題があります！');
        console.log('匿名ユーザーがデータを取得できません。');
        console.log('\n解決方法:');
        console.log('1. Supabase Dashboard → Authentication → Policies');
        console.log('2. 各テーブルで "Enable read access for anon users" を確認');
        console.log('3. 以下のポリシーが必要:');
        console.log('   - plans: SELECT (status = \'published\')');
        console.log('   - rules: SELECT (status = \'active\')');
        console.log('   - faqs: SELECT (status = \'published\')');
    } else if (plans.length === 0 || rules.length === 0 || faqs.length === 0) {
        console.log('⚠️  RLSポリシーはあるが、データが取得できません');
        console.log('ポリシーの条件を確認してください');
    } else {
        console.log('✅ ANON KEYでデータ取得成功！');
        console.log('フロントエンドの問題を確認してください');
    }
}

testAnonAccess().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
