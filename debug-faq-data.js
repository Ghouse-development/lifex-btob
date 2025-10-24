// FAQ データの直接確認スクリプト
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yftqxmdccaadlafecjbo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdHF4bWRjY2FhZGxhZmVjamJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4Mjc0NzgsImV4cCI6MjA1MjQwMzQ3OH0.zVwj8s9VJO1b0TGLVNnwFPKCfW8g0K_EruQFxh5yoYc';

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFAQData() {
    console.log('\n=== FAQ Categories Check ===\n');

    // 1. FAQ カテゴリーを確認
    const { data: categories, error: catError } = await supabase
        .from('faq_categories')
        .select('*')
        .order('display_order', { ascending: true });

    if (catError) {
        console.error('❌ Error fetching categories:', catError);
        console.error('   Code:', catError.code);
        console.error('   Message:', catError.message);
        console.error('   Details:', catError.details);
        console.error('   Hint:', catError.hint);
    } else {
        console.log('✅ Categories count:', categories?.length || 0);
        if (categories && categories.length > 0) {
            console.log('\n📋 Categories:');
            categories.forEach(cat => {
                console.log(`   - ID: ${cat.id}, Name: ${cat.name}, Order: ${cat.display_order}`);
            });
        } else {
            console.log('⚠️  No categories found in database');
        }
    }

    console.log('\n=== FAQ Items Check ===\n');

    // 2. FAQ アイテムを確認
    const { data: faqs, error: faqError } = await supabase
        .from('faqs')
        .select('*, faq_categories(name)')
        .order('display_order');

    if (faqError) {
        console.error('❌ Error fetching FAQs:', faqError);
        console.error('   Code:', faqError.code);
        console.error('   Message:', faqError.message);
        console.error('   Details:', faqError.details);
        console.error('   Hint:', faqError.hint);
    } else {
        console.log('✅ FAQs count:', faqs?.length || 0);
        if (faqs && faqs.length > 0) {
            console.log('\n📋 FAQs:');
            faqs.forEach(faq => {
                console.log(`   - ID: ${faq.id}`);
                console.log(`     Question: ${faq.question?.substring(0, 50)}...`);
                console.log(`     Category: ${faq.faq_categories?.name || 'N/A'}`);
                console.log(`     Category ID: ${faq.category_id}`);
            });
        } else {
            console.log('⚠️  No FAQs found in database');
        }
    }

    console.log('\n=== RLS Policy Check ===\n');

    // 3. 認証なしでの読み取り確認（RLSポリシーチェック）
    const { data: publicCategories, error: publicError } = await supabase
        .from('faq_categories')
        .select('count');

    if (publicError) {
        console.error('❌ Public read access denied (RLS may be blocking):');
        console.error('   ', publicError.message);
    } else {
        console.log('✅ Public read access works (RLS allows anonymous read)');
    }

    console.log('\n=== Table Schema Check ===\n');

    // 4. テーブル構造を確認
    const { data: sampleCategory } = await supabase
        .from('faq_categories')
        .select('*')
        .limit(1)
        .single();

    if (sampleCategory) {
        console.log('📋 faq_categories columns:', Object.keys(sampleCategory));
    }

    const { data: sampleFaq } = await supabase
        .from('faqs')
        .select('*')
        .limit(1)
        .single();

    if (sampleFaq) {
        console.log('📋 faqs columns:', Object.keys(sampleFaq));
    }

    console.log('\n=== Summary ===\n');
    console.log(`Categories in DB: ${categories?.length || 0}`);
    console.log(`FAQs in DB: ${faqs?.length || 0}`);
    console.log(`Public access: ${publicError ? '❌ Denied' : '✅ Allowed'}`);
}

checkFAQData().catch(console.error);
