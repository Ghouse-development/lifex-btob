import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function checkRulesData() {
    console.log('========================================');
    console.log('ルールデータ確認');
    console.log('========================================\n');

    // Service Role Key で確認
    console.log('【Service Role Key】\n');

    const { data: categoriesService, error: catErrorService } = await serviceClient
        .from('rule_categories')
        .select('*')
        .order('display_order');

    if (catErrorService) {
        console.error('❌ カテゴリ取得エラー:', catErrorService.message);
    } else {
        console.log(`✅ カテゴリ: ${categoriesService.length}件`);
        categoriesService.forEach(cat => {
            console.log(`   - ${cat.name} (status: ${cat.status})`);
        });
    }

    const { data: rulesService, error: rulesErrorService } = await serviceClient
        .from('rules')
        .select('*, rule_categories(name)')
        .order('created_at', { ascending: false });

    if (rulesErrorService) {
        console.error('❌ ルール取得エラー:', rulesErrorService.message);
    } else {
        console.log(`\n✅ ルール: ${rulesService.length}件`);
        rulesService.forEach(rule => {
            console.log(`   - ${rule.title}`);
            console.log(`     カテゴリ: ${rule.rule_categories?.name || 'なし'}`);
            console.log(`     ステータス: ${rule.status}`);
            console.log(`     優先度: ${rule.priority}`);
        });
    }

    // Anon Key で確認（公開ページと同じ）
    console.log('\n========================================');
    console.log('【Anon Key（公開ページと同じ）】\n');

    const { data: categoriesAnon, error: catErrorAnon } = await anonClient
        .from('rule_categories')
        .select('*')
        .order('display_order');

    if (catErrorAnon) {
        console.error('❌ カテゴリ取得エラー:', catErrorAnon.message);
    } else {
        console.log(`✅ カテゴリ: ${categoriesAnon.length}件`);
    }

    const { data: rulesAnon, error: rulesErrorAnon } = await anonClient
        .from('rules')
        .select('*, rule_categories(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (rulesErrorAnon) {
        console.error('❌ ルール取得エラー:', rulesErrorAnon.message);
        console.error('   エラーコード:', rulesErrorAnon.code);
    } else {
        console.log(`✅ アクティブなルール: ${rulesAnon.length}件`);
        if (rulesAnon.length === 0) {
            console.log('   ⚠️  公開されているルールがありません');
        } else {
            rulesAnon.forEach(rule => {
                console.log(`   - ${rule.title} (${rule.rule_categories?.name || 'なし'})`);
            });
        }
    }

    console.log('\n========================================');
    console.log('診断結果');
    console.log('========================================\n');

    if (rulesService.length === 0) {
        console.log('❌ ルールが1件も保存されていません');
        console.log('   → admin-rules.html でルールを作成してください\n');
    } else if (rulesAnon.length === 0) {
        console.log('⚠️  ルールは存在しますが、公開ページで表示されません');
        console.log('   考えられる原因:');
        console.log('   1. ステータスが "active" ではない');
        console.log('   2. RLSポリシーの問題');

        const activeCount = rulesService.filter(r => r.status === 'active').length;
        const draftCount = rulesService.filter(r => r.status === 'draft').length;
        const inactiveCount = rulesService.filter(r => r.status === 'inactive').length;

        console.log('\n   ステータス別:');
        console.log(`   - active: ${activeCount}件`);
        console.log(`   - draft: ${draftCount}件`);
        console.log(`   - inactive: ${inactiveCount}件`);
        console.log('\n   → ルールを "active" に設定してください\n');
    } else {
        console.log('✅ すべて正常です');
        console.log(`   公開ページで ${rulesAnon.length}件のルールが表示されます\n`);
    }
}

checkRulesData().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
