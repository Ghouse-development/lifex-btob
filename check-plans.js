import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// LocalStorageのデータを読み取る関数
function getLocalStorageData() {
    const indexPath = path.join('src', 'data', 'plans-index.json');
    try {
        const data = fs.readFileSync(indexPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading plans-index.json:', error);
        return { plans: [] };
    }
}

const plansData = getLocalStorageData();
const allPlans = plansData.plans || [];
const publishedPlans = allPlans.filter(plan => 
    !plan.status || plan.status === 'published' || plan.status === 'active'
);

console.log('=== プラン数の詳細 ===');
console.log('全プラン数（下書き含む）:', allPlans.length);
console.log('公開中のプラン数:', publishedPlans.length);
console.log('');
console.log('=== 各プランの詳細 ===');
allPlans.forEach((plan, index) => {
    console.log(`${index + 1}. ${plan.name || 'プラン名なし'}`);
    console.log(`   ID: ${plan.id}`);
    console.log(`   ステータス: ${plan.status || '未設定'}`);
    console.log(`   階数: ${plan.floors || '-'}`);
    console.log(`   広さ: ${plan.size || '-'}㎡`);
    console.log('');
});