import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPlanStructure() {
    try {
        console.log('🔍 Checking plan table structure...\n');

        const { data: plans, error } = await supabase
            .from('plans')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        if (plans && plans.length > 0) {
            const plan = plans[0];
            console.log('📋 Available fields in plans table:');
            console.log('====================================');

            Object.keys(plan).sort().forEach(key => {
                const value = plan[key];
                const type = typeof value;
                const preview = value === null ? 'null' :
                               type === 'string' ? `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"` :
                               type === 'number' ? value :
                               type === 'object' ? JSON.stringify(value).substring(0, 50) + '...' :
                               String(value);
                console.log(`  ${key.padEnd(30)} : ${type.padEnd(10)} = ${preview}`);
            });

            console.log('\n🎯 Key fields for plans.html:');
            console.log('=============================');
            console.log('  plan_code:', plan.plan_code);
            console.log('  plan_name:', plan.plan_name);
            console.log('  width (間口):', plan.width);
            console.log('  depth (奥行):', plan.depth);
            console.log('  floors (建物階数):', plan.floors);
            console.log('  ldk_floor (LDK階数):', plan.ldk_floor);
            console.log('  bathroom_floor (水廻り階数):', plan.bathroom_floor);
            console.log('  estimated_selling_price (想定販売価格):', plan.estimated_selling_price);
            console.log('  thumbnail_url (外観パース):', plan.thumbnail_url);
            console.log('  drawing_file_path (間取図):', plan.drawing_file_path);
        } else {
            console.log('❌ No plans found in database');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

checkPlanStructure();
