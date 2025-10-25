/**
 * すべてのデータを表示するスクリプト
 *
 * 使用方法: node scripts/view-all-data.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// .env.local ファイルから環境変数を読み込む
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseKey);

async function viewAllData() {
    console.log('📋 すべてのデータを表示します...\n');

    try {
        // 1. ルールカテゴリ
        console.log('=== ルールカテゴリ ===');
        const { data: categories, error: catError } = await supabase
            .from('rule_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (catError) {
            console.error('❌ エラー:', catError);
        } else {
            categories.forEach(cat => {
                console.log(`\n📁 ${cat.name} (ID: ${cat.id})`);
                console.log(`   説明: ${cat.description || 'なし'}`);
                console.log(`   表示順: ${cat.display_order}`);
                console.log(`   ステータス: ${cat.status}`);
            });
        }

        // 2. ルール
        console.log('\n\n=== ルール ===');
        const { data: rules, error: rulesError } = await supabase
            .from('rules')
            .select('*')
            .order('display_order', { ascending: true });

        if (rulesError) {
            console.error('❌ エラー:', rulesError);
        } else {
            rules.forEach(rule => {
                console.log(`\n📌 ${rule.title} (ID: ${rule.id})`);
                console.log(`   カテゴリID: ${rule.category_id}`);
                console.log(`   内容: ${rule.content}`);
                console.log(`   表示順: ${rule.display_order}`);
                console.log(`   ステータス: ${rule.status}`);
                console.log(`   登録日: ${rule.registered_date || '未設定'}`);
            });
        }

        // 3. プラン
        console.log('\n\n=== プラン ===');
        const { data: plans, error: plansError } = await supabase
            .from('plans')
            .select('*')
            .order('created_at', { ascending: false });

        if (plansError) {
            console.error('❌ エラー:', plansError);
        } else {
            plans.forEach(plan => {
                console.log(`\n🏠 ${plan.plan_name} (ID: ${plan.id})`);
                console.log(`   坪数: ${plan.tsubo}坪`);
                console.log(`   間口×奥行: ${plan.maguchi}mm × ${plan.oku_yuki}mm`);
                console.log(`   販売価格: ${plan.sell_price?.toLocaleString()}円`);
                console.log(`   ステータス: ${plan.status}`);
                console.log(`   作成日: ${plan.created_at}`);
            });
        }

        // 4. FAQ
        console.log('\n\n=== FAQ ===');
        const { data: faqs, error: faqsError } = await supabase
            .from('faqs')
            .select('*')
            .order('display_order', { ascending: true });

        if (faqsError) {
            console.error('❌ エラー:', faqsError);
        } else {
            faqs.forEach(faq => {
                console.log(`\n❓ ${faq.question} (ID: ${faq.id})`);
                console.log(`   カテゴリID: ${faq.category_id}`);
                console.log(`   回答: ${faq.answer?.substring(0, 100)}...`);
                console.log(`   表示順: ${faq.display_order}`);
                console.log(`   ステータス: ${faq.status}`);
            });
        }

        // 5. FAQカテゴリ
        console.log('\n\n=== FAQカテゴリ ===');
        const { data: faqCategories, error: faqCatError } = await supabase
            .from('faq_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (faqCatError) {
            console.error('❌ エラー:', faqCatError);
        } else {
            faqCategories.forEach(cat => {
                console.log(`\n📂 ${cat.name} (ID: ${cat.id})`);
                console.log(`   説明: ${cat.description || 'なし'}`);
                console.log(`   表示順: ${cat.display_order}`);
                console.log(`   ステータス: ${cat.status}`);
            });
        }

        console.log('\n\n✅ データ表示完了');

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
    }
}

// スクリプト実行
viewAllData();
