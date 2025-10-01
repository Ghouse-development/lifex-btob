#!/usr/bin/env python3
import re

# Read the file
with open('src/rules.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix broken HTML patterns with double buttons
content = re.sub(
    r'</span><button @click="showDetail\(\'</li>\'\)" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">詳細</button></li>',
    '</li>',
    content
)

# Replace all button patterns with just clickable text
# Pattern 1: li with flex and button
pattern1 = r'<li class="flex items-center justify-between">\s*<span>(.*?)</span>\s*<button @click="showDetail\(\'(.*?)\'\)"[^>]*>詳細</button>\s*</li>'
replacement1 = r'<li @click="showDetail(\'\2\')" class="cursor-pointer hover:text-blue-600 hover:underline transition-colors">\1</li>'
content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)

# Pattern 2: li with @click and flex (営業ルール sections)
pattern2 = r'<li @click="showDetail\(\'(.*?)\'\)" class="flex items-center justify-between"><span>(.*?)</span><button @click="showDetail\(\'.*?\'\)"[^>]*>詳細</button></li>'
replacement2 = r'<li @click="showDetail(\'\1\')" class="cursor-pointer hover:text-green-600 hover:underline transition-colors">\2</li>'
content = re.sub(pattern2, replacement2, content)

# Pattern 3: li with cursor-pointer and button (施工ルール sections) 
pattern3 = r'<li @click="showDetail\(\'(.*?)\'\)" class="cursor-pointer hover:text-orange-600 transition-colors">(.*?)</span><button @click="showDetail\(\'.*?\'\)"[^>]*>詳細</button></li>'
replacement3 = r'<li @click="showDetail(\'\1\')" class="cursor-pointer hover:text-orange-600 hover:underline transition-colors">\2</li>'
content = re.sub(pattern3, replacement3, content)

# Pattern 4: li with cursor-pointer and button (品質管理 sections)
pattern4 = r'<li @click="showDetail\(\'(.*?)\'\)" class="cursor-pointer hover:text-purple-600 transition-colors">(.*?)</span><button @click="showDetail\(\'.*?\'\)"[^>]*>詳細</button></li>'
replacement4 = r'<li @click="showDetail(\'\1\')" class="cursor-pointer hover:text-purple-600 hover:underline transition-colors">\2</li>'
content = re.sub(pattern4, replacement4, content)

# Pattern 5: Fix simple li items that are broken
pattern5 = r'<li>(.*?)</span><button @click="showDetail\(\'(.*?)\'\)"[^>]*>詳細</button></li>'
replacement5 = r'<li @click="showDetail(\'\2\')" class="cursor-pointer hover:text-blue-600 hover:underline transition-colors">\1</li>'
content = re.sub(pattern5, replacement5, content)

# Change space-y-3 to space-y-2 for all lists
content = re.sub(r'class="text-sm text-(\w+)-800 space-y-3"', r'class="text-sm text-\1-800 space-y-2"', content)

# Write the fixed content
with open('src/rules.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed rules.html - removed all detail buttons and made text clickable")