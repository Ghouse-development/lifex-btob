import { createClient } from '@supabase/supabase-js';

// Supabase接続情報
const supabaseUrl = 'https://tkemcbxqbrfqgmyswkjg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrZW1jYnhxYnJmcWdteXN3a2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTIwMjUsImV4cCI6MjA3NDM2ODAyNX0.UKHU7iTO35N3MuIzJYp9VVxB7ga2YDQ5Vrzd6Gf3k-I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('========================================');
    console.log('Supabaseデータベースの状態確認');
    console.log('========================================\n');

    try {
        // 各テーブルのレコード数を取得
        const tables = [
            'plans',
            'plan_images',
            'faqs',
            'faq_categories',
            'rules',
            'rule_categories',
            'downloads',
            'download_categories',
            'users',
            'design_categories'
        ];

        console.log('【レコード数】');
        for (const table of tables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.log(`${table}: エラー (${error.message})`);
                } else {
                    console.log(`${table}: ${count || 0} 件`);
                }
            } catch (e) {
                console.log(`${table}: 接続エラー`);
            }
        }

        // プランの詳細を確認
        console.log('\n【プランデータ（最初の3件）】');
        const { data: plans, error: plansError } = await supabase
            .from('plans')
            .select('id, name, status')
            .limit(3);

        if (plans && plans.length > 0) {
            plans.forEach(plan => {
                console.log(`- ${plan.id}: ${plan.name} (${plan.status})`);
            });
        } else {
            console.log('プランデータなし');
        }

        // FAQの詳細を確認
        console.log('\n【FAQデータ（最初の3件）】');
        const { data: faqs, error: faqsError } = await supabase
            .from('faqs')
            .select('id, question, status')
            .limit(3);

        if (faqs && faqs.length > 0) {
            faqs.forEach(faq => {
                console.log(`- ${faq.question?.substring(0, 50)}... (${faq.status})`);
            });
        } else {
            console.log('FAQデータなし');
        }

        // カテゴリデータを確認
        console.log('\n【カテゴリデータ】');
        const { data: faqCategories } = await supabase
            .from('faq_categories')
            .select('name');

        if (faqCategories && faqCategories.length > 0) {
            console.log('FAQカテゴリ:', faqCategories.map(c => c.name).join(', '));
        } else {
            console.log('FAQカテゴリ: なし');
        }

        const { data: ruleCategories } = await supabase
            .from('rule_categories')
            .select('name');

        if (ruleCategories && ruleCategories.length > 0) {
            console.log('ルールカテゴリ:', ruleCategories.map(c => c.name).join(', '));
        } else {
            console.log('ルールカテゴリ: なし');
        }

        console.log('\n========================================');
        console.log('確認完了');
        console.log('========================================');

    } catch (error) {
        console.error('エラー:', error);
    }
}

// 実行
checkDatabase().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('実行エラー:', error);
    process.exit(1);
});