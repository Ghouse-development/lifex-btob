require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase環境変数が設定されていません');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlansStructure() {
    console.log('\n📋 Plans テーブル構造確認\n');

    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ エラー:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('⚠️  プランが登録されていません');
        return;
    }

    const plan = data[0];
    console.log('✅ 取得したプラン:', plan.plan_code || plan.id);
    console.log('\n📊 カラム一覧:');

    Object.keys(plan).forEach(key => {
        const value = plan[key];
        const type = typeof value;
        const valuePreview = type === 'object' && value !== null
            ? JSON.stringify(value).substring(0, 50) + '...'
            : String(value).substring(0, 50);

        console.log(`   ${key.padEnd(25)} ${type.padEnd(10)} ${valuePreview}`);
    });

    // ファイル関連カラムを探す
    console.log('\n🔍 ファイル・ドキュメント関連カラム:');
    const fileRelatedKeys = Object.keys(plan).filter(key =>
        key.includes('file') ||
        key.includes('document') ||
        key.includes('pdf') ||
        key.includes('attachment') ||
        key.includes('upload')
    );

    if (fileRelatedKeys.length > 0) {
        fileRelatedKeys.forEach(key => {
            console.log(`   ✅ ${key}: ${JSON.stringify(plan[key])}`);
        });
    } else {
        console.log('   ❌ ファイル関連カラムが見つかりません');
    }

    // JSONフィールドを探す
    console.log('\n📦 JSON型カラム:');
    Object.keys(plan).forEach(key => {
        if (typeof plan[key] === 'object' && plan[key] !== null) {
            console.log(`   ${key}:`, JSON.stringify(plan[key], null, 2));
        }
    });
}

checkPlansStructure().catch(console.error);
