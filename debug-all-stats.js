import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAllStats() {
    try {
        console.log('🔍 Checking all statistics in Supabase...\n');

        // 1. Rules
        console.log('1️⃣ RULES:');
        console.log('=========');
        const { data: rules, error: rulesError } = await supabase
            .from('rules')
            .select('*');

        if (rulesError) {
            console.log('❌ Rules error:', rulesError.message);
        } else {
            console.log(`Total rules: ${rules?.length || 0}`);
            if (rules && rules.length > 0) {
                console.table(rules.map(r => ({
                    ID: r.id?.substring(0, 8) + '...',
                    Title: r.title?.substring(0, 40),
                    Category: r.category_id?.substring(0, 8) + '...',
                    Status: r.status
                })));
            }
        }

        // 2. Rule Categories
        console.log('\n2️⃣ RULE CATEGORIES:');
        console.log('===================');
        const { data: ruleCategories, error: ruleCatError } = await supabase
            .from('rule_categories')
            .select('*');

        if (ruleCatError) {
            console.log('❌ Rule categories error:', ruleCatError.message);
        } else {
            console.log(`Total categories: ${ruleCategories?.length || 0}`);
            if (ruleCategories && ruleCategories.length > 0) {
                console.table(ruleCategories.map(c => ({
                    ID: c.id?.substring(0, 8) + '...',
                    Name: c.name,
                    Order: c.display_order
                })));
            }
        }

        // 3. FAQs
        console.log('\n3️⃣ FAQs:');
        console.log('========');
        const { data: faqs, error: faqError } = await supabase
            .from('faqs')
            .select('*');

        if (faqError) {
            console.log('❌ FAQ error:', faqError.message);
        } else {
            console.log(`Total FAQs: ${faqs?.length || 0}`);
            console.log(`Published FAQs: ${faqs?.filter(f => f.status === 'published').length || 0}`);
        }

        // 4. FAQ Categories
        console.log('\n4️⃣ FAQ CATEGORIES:');
        console.log('==================');
        const { data: faqCategories, error: faqCatError } = await supabase
            .from('faq_categories')
            .select('*');

        if (faqCatError) {
            console.log('❌ FAQ categories error:', faqCatError.message);
        } else {
            console.log(`Total FAQ categories: ${faqCategories?.length || 0}`);
        }

        // 5. Downloads
        console.log('\n5️⃣ DOWNLOADS:');
        console.log('=============');
        const { data: downloads, error: downloadsError } = await supabase
            .from('downloads')
            .select('*');

        if (downloadsError) {
            console.log('❌ Downloads error:', downloadsError.message);
        } else {
            console.log(`Total downloads: ${downloads?.length || 0}`);
            if (downloads && downloads.length > 0) {
                console.table(downloads.slice(0, 5).map(d => ({
                    ID: d.id?.substring(0, 8) + '...',
                    Title: d.title?.substring(0, 30),
                    Status: d.status
                })));
            }
        }

        // 6. Download Categories
        console.log('\n6️⃣ DOWNLOAD CATEGORIES:');
        console.log('=======================');
        const { data: downloadCategories, error: downloadCatError } = await supabase
            .from('download_categories')
            .select('*');

        if (downloadCatError) {
            console.log('❌ Download categories error:', downloadCatError.message);
        } else {
            console.log(`Total download categories: ${downloadCategories?.length || 0}`);
        }

        // Summary
        console.log('\n📊 SUMMARY:');
        console.log('===========');
        console.log(`Rules: ${rules?.length || 0}`);
        console.log(`Rule Categories: ${ruleCategories?.length || 0}`);
        console.log(`FAQs: ${faqs?.length || 0} (Published: ${faqs?.filter(f => f.status === 'published').length || 0})`);
        console.log(`FAQ Categories: ${faqCategories?.length || 0}`);
        console.log(`Downloads: ${downloads?.length || 0}`);
        console.log(`Download Categories: ${downloadCategories?.length || 0}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

debugAllStats();
