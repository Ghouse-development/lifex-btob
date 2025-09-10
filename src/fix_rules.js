// Fix rules.html file
const fs = require('fs');

let content = fs.readFileSync('src/rules.html', 'utf8');

// Fix broken HTML
content = content.replace(/• (.*?)<\/span><button @click="showDetail\('\<\/li\>'\)"/g, (match, text) => {
    return `• ${text}</span><button @click="showDetail('${text}')"`
});

// Fix broken list items that have double buttons
content = content.replace(/<\/button>\s*<\/span><button[^>]*>詳細<\/button><\/li>/g, '</button></li>');

// Fix the structure design section
content = content.replace(
    /<li>• 建築基準法に準拠した構造計算<\/span><button @click="showDetail\('\<\/li\>'\)" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">詳細<\/button><\/li>/g,
    '<li class="flex items-center justify-between"><span>• 建築基準法に準拠した構造計算</span><button @click="showDetail(\'建築基準法に準拠した構造計算\')" class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">詳細</button></li>'
);

content = content.replace(
    /<li>• 耐震等級3の確保<\/span><button @click="showDetail\('\<\/li\>'\)" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">詳細<\/button><\/li>/g,
    '<li class="flex items-center justify-between"><span>• 耐震等級3の確保</span><button @click="showDetail(\'耐震等級3の確保\')" class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">詳細</button></li>'
);

content = content.replace(
    /<li>• 基礎設計の標準仕様遵守<\/span><button @click="showDetail\('\<\/li\>'\)" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">詳細<\/button><\/li>/g,
    '<li class="flex items-center justify-between"><span>• 基礎設計の標準仕様遵守</span><button @click="showDetail(\'基礎設計の標準仕様遵守\')" class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">詳細</button></li>'
);

content = content.replace(
    /<li>• 構造材の品質管理基準<\/span><button @click="showDetail\('\<\/li\>'\)" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">詳細<\/button><\/li>/g,
    '<li class="flex items-center justify-between"><span>• 構造材の品質管理基準</span><button @click="showDetail(\'構造材の品質管理基準\')" class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">詳細</button></li>'
);

// Change space-y-2 to space-y-3 for structure section
content = content.replace(
    /<ul class="text-sm text-blue-800 space-y-2">\s*<li>• 建築/g,
    '<ul class="text-sm text-blue-800 space-y-3">\n                                <li class="flex items-center justify-between"><span>• 建築'
);

fs.writeFileSync('src/rules_fixed.html', content, 'utf8');
console.log('Fixed rules.html saved as rules_fixed.html');