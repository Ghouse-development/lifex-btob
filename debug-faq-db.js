import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugFAQs() {
    try {
        console.log('🔍 Fetching all FAQs from database...\n');

        // Get all FAQs (no status filter)
        const { data: faqs, error: faqError } = await supabase
            .from('faqs')
            .select('*')
            .order('display_order', { ascending: true });

        if (faqError) throw faqError;

        // Get all categories
        const { data: categories, error: catError } = await supabase
            .from('faq_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (catError) throw catError;

        console.log('📊 FAQ CATEGORIES:');
        console.log('==================');
        console.table(categories.map(c => ({
            ID: c.id,
            Name: c.name,
            'Display Order': c.display_order
        })));

        console.log('\n📝 ALL FAQs IN DATABASE:');
        console.log('========================');
        console.table(faqs.map(f => ({
            ID: f.id.substring(0, 8) + '...',
            Question: f.question.substring(0, 50) + (f.question.length > 50 ? '...' : ''),
            Status: f.status,
            'Category ID': f.category_id ? f.category_id.substring(0, 8) + '...' : 'null',
            'Display Order': f.display_order,
            'Created': new Date(f.created_at).toISOString().split('T')[0]
        })));

        // Published FAQs only
        const publishedFAQs = faqs.filter(f => f.status === 'published');
        console.log('\n✅ PUBLISHED FAQs (what users see):');
        console.log('===================================');
        console.table(publishedFAQs.map(f => ({
            Question: f.question,
            Status: f.status,
            'Display Order': f.display_order
        })));

        // Draft/Other FAQs
        const otherFAQs = faqs.filter(f => f.status !== 'published');
        if (otherFAQs.length > 0) {
            console.log('\n📋 NON-PUBLISHED FAQs (draft/archived):');
            console.log('========================================');
            console.table(otherFAQs.map(f => ({
                Question: f.question,
                Status: f.status,
                'Display Order': f.display_order
            })));
        }

        console.log('\n📈 SUMMARY:');
        console.log('===========');
        console.log(`Total FAQs: ${faqs.length}`);
        console.log(`Published: ${publishedFAQs.length}`);
        console.log(`Draft/Archived: ${otherFAQs.length}`);
        console.log(`Categories: ${categories.length}`);

        // Check for the specific FAQs mentioned by user
        console.log('\n🔎 CHECKING FOR SPECIFIC FAQs:');
        console.log('==============================');

        const testFAQ = faqs.find(f => f.question.includes('てすと'));
        const floorPlanFAQ = faqs.find(f => f.question.includes('間取は変更できますか'));
        const contractFAQ = faqs.find(f => f.question.includes('契約後の流れ'));

        console.log('「てすと」:', testFAQ ? `Found (status: ${testFAQ.status})` : 'NOT FOUND');
        console.log('「間取は変更できますか？」:', floorPlanFAQ ? `Found (status: ${floorPlanFAQ.status})` : 'NOT FOUND');
        console.log('「契約後の流れについて教えてください。」:', contractFAQ ? `Found (status: ${contractFAQ.status})` : 'NOT FOUND');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

debugFAQs();
