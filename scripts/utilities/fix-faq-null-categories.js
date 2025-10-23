import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3OTkyNiwiZXhwIjoyMDc2MjU1OTI2fQ.OYB1WmG_xWsAVJQZFQ4fToCR6AXcFYHYNH-1QDOS8uM';

const client = createClient(supabaseUrl, supabaseServiceKey);

async function fixNullCategories() {
    console.log('========================================');
    console.log('🔧 FAQ null category_id 修正');
    console.log('========================================\n');

    // Get "その他" category ID
    const { data: otherCategory, error: catError } = await client
        .from('faq_categories')
        .select('id, name')
        .eq('name', 'その他')
        .single();

    if (catError || !otherCategory) {
        console.error('❌ "その他" カテゴリが見つかりません:', catError);
        return;
    }

    console.log(`✅ "その他" カテゴリID: ${otherCategory.id}\n`);

    // Find FAQs with null category_id
    const { data: nullFAQs, error: faqError } = await client
        .from('faqs')
        .select('*')
        .is('category_id', null);

    if (faqError) {
        console.error('❌ FAQ取得エラー:', faqError);
        return;
    }

    console.log(`📋 category_id が null の FAQ: ${nullFAQs.length}件\n`);

    if (nullFAQs.length === 0) {
        console.log('✅ 修正が必要なFAQはありません');
        return;
    }

    // Update each FAQ
    for (const faq of nullFAQs) {
        console.log(`修正中: FAQ ID ${faq.id}`);
        console.log(`   質問: "${faq.question}"`);

        const { error: updateError } = await client
            .from('faqs')
            .update({ category_id: otherCategory.id })
            .eq('id', faq.id);

        if (updateError) {
            console.error(`   ❌ 更新失敗:`, updateError);
        } else {
            console.log(`   ✅ category_id を "その他" (${otherCategory.id}) に設定\n`);
        }
    }

    console.log('========================================');
    console.log('完了');
    console.log('========================================');
}

fixNullCategories().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
});
