#!/bin/bash

# コードパターンチェックスクリプト
# 大きな変更後に実行して、古いパターンが残っていないか確認

echo "🔍 古いAPIパターンをチェック中..."
echo ""

# LocalStorage APIの使用を検索
echo "📦 LocalStorage API 使用箇所:"
grep -rn "lifeXAPI.getPlansIndex\|plans_data" src/ --include="*.html" --include="*.js" | grep -v "node_modules"
echo ""

# Supabase接続の確認
echo "✅ Supabase接続の確認:"
grep -rn "window.supabase\|createClient" src/ --include="*.html" --include="*.js" | wc -l
echo "件のSupabase接続を検出"
echo ""

# リンク切れの可能性
echo "🔗 HTML内部リンクの確認:"
grep -rn "href=\"/" src/index.html | grep -v "http"
echo ""

echo "✨ チェック完了"
