const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/rules.html', 'utf8');

// Fix broken HTML patterns with double buttons
content = content.replace(
    /<\/span><button @click="showDetail\('.*?'\)" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">詳細<\/button><\/li>/g,
    '</li>'
);

// Replace all button patterns with just clickable text
// Pattern 1: li with flex and button (blue sections)
content = content.replace(
    /<li class="flex items-center justify-between">\s*<span>(.*?)<\/span>\s*<button @click="showDetail\('(.*?)'\)"[^>]*>詳細<\/button>\s*<\/li>/gs,
    (match, text, detail) => `<li @click="showDetail('${detail}')" class="cursor-pointer hover:text-blue-600 hover:underline transition-colors">${text}</li>`
);

// Pattern 2:営業ルール sections (green)
content = content.replace(
    /<li @click="showDetail\('(.*?)'\)" class="flex items-center justify-between"><span>(.*?)<\/span><button @click="showDetail\('.*?'\)"[^>]*>詳細<\/button><\/li>/g,
    (match, detail, text) => `<li @click="showDetail('${detail}')" class="cursor-pointer hover:text-green-600 hover:underline transition-colors">${text}</li>`
);

// Pattern 3: 施工ルール sections (orange)
content = content.replace(
    /<li @click="showDetail\('(.*?)'\)" class="cursor-pointer hover:text-orange-600 transition-colors">(.*?)<\/span><button @click="showDetail\('.*?'\)"[^>]*>詳細<\/button><\/li>/g,
    (match, detail, text) => `<li @click="showDetail('${detail}')" class="cursor-pointer hover:text-orange-600 hover:underline transition-colors">${text}</li>`
);

// Pattern 4: 品質管理 sections (purple)
content = content.replace(
    /<li @click="showDetail\('(.*?)'\)" class="cursor-pointer hover:text-purple-600 transition-colors">(.*?)<\/span><button @click="showDetail\('.*?'\)"[^>]*>詳細<\/button><\/li>/g,
    (match, detail, text) => `<li @click="showDetail('${detail}')" class="cursor-pointer hover:text-purple-600 hover:underline transition-colors">${text}</li>`
);

// Pattern 5: Fix simple li items that are broken
content = content.replace(
    /<li>(.*?)<\/span><button @click="showDetail\('(.*?)'\)"[^>]*>詳細<\/button><\/li>/g,
    (match, text, detail) => `<li @click="showDetail('${detail}')" class="cursor-pointer hover:text-blue-600 hover:underline transition-colors">${text}</li>`
);

// Change space-y-3 to space-y-2 for all lists
content = content.replace(/class="text-sm text-(\w+)-800 space-y-3"/g, 'class="text-sm text-$1-800 space-y-2"');

// Write the fixed content
fs.writeFileSync('src/rules.html', content, 'utf8');

console.log("Fixed rules.html - removed all detail buttons and made text clickable");