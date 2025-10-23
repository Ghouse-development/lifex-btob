import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const client = createClient(supabaseUrl, supabaseServiceKey);

async function checkFAQData() {
    console.log('========================================');
    console.log('🔍 FAQデータ詳細チェック');
    console.log('========================================\n');

    // Get all FAQs
    const { data: faqs, error: faqError } = await client
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false });

    if (faqError) {
        console.error('❌ Error fetching FAQs:', faqError);
        return;
    }

    console.log(`📋 FAQ総数: ${faqs.length}件\n`);

    // Get all categories
    const { data: categories } = await client
        .from('faq_categories')
        .select('*');

    console.log('📂 カテゴリ一覧:');
    categories.forEach(cat => {
        console.log(`   ${cat.name}: ${cat.id}`);
    });
    console.log('');

    // Analyze each FAQ
    faqs.forEach((faq, index) => {
        console.log(`FAQ #${index + 1}:`);
        console.log(`   ID: ${faq.id}`);
        console.log(`   質問: ${faq.question}`);
        console.log(`   回答: ${faq.answer.substring(0, 50)}...`);
        console.log(`   category_id: ${faq.category_id}`);
        console.log(`   status: ${faq.status}`);
        console.log(`   display_order: ${faq.display_order}`);

        // Check if category_id is valid
        if (!faq.category_id) {
            console.log('   ⚠️  警告: category_id が null です！');
        } else {
            const cat = categories.find(c => c.id === faq.category_id);
            if (cat) {
                console.log(`   ✅ カテゴリ: ${cat.name}`);
            } else {
                console.log(`   ❌ エラー: category_id が存在しないカテゴリを参照`);
            }
        }
        console.log('');
    });

    // Check for FAQs with null category_id
    const faqsWithNullCategory = faqs.filter(f => !f.category_id);
    if (faqsWithNullCategory.length > 0) {
        console.log('========================================');
        console.log(`⚠️  category_id が null の FAQ: ${faqsWithNullCategory.length}件`);
        console.log('========================================\n');
        faqsWithNullCategory.forEach(faq => {
            console.log(`   - 質問: "${faq.question}"`);
            console.log(`     ID: ${faq.id}`);
        });
    }
}

checkFAQData().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
