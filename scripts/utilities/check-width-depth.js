import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3B4dnl6aW92bGZ4ZGZzcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzk5MjYsImV4cCI6MjA3NjI1NTkyNn0.uLCJvgKDOWpTxRjt39DVyqUotQcSam3v4lItofWeDws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { data } = await supabase.from('plans').select('plan_code, width, depth');

console.log('========================================');
console.log('プランの間口と奥行チェック');
console.log('========================================\n');

data.forEach(p => {
    console.log(`プラン: ${p.plan_code}`);
    console.log(`  間口 (width): ${p.width || '❌ 未設定'} mm`);
    console.log(`  奥行 (depth): ${p.depth || '❌ 未設定'} mm`);
    console.log('');
});

const missing = data.filter(p => !p.width || !p.depth);

console.log('========================================');
console.log('📊 結果');
console.log('========================================');
console.log(`総プラン数: ${data.length}`);
console.log(`間口・奥行あり: ${data.length - missing.length}`);
console.log(`間口・奥行なし: ${missing.length}`);

if (missing.length > 0) {
    console.log('\n⚠️  間口・奥行が未設定のプランはマトリックスに表示されません！');
    console.log('   プラン管理で間口と奥行を入力してください。');
}

console.log('\n========================================\n');
