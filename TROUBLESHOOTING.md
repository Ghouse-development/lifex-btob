# データ表示トラブルシューティング

## 状況
- ✅ データベースにデータは存在する（Plans: 57件, Rules: 2件, FAQs: 2件）
- ✅ RLSポリシーは正常（ANON KEYでデータ取得可能）
- ❌ フロントエンドでデータが表示されない

## 根本原因の特定手順

### 1. ブラウザコンソールを確認

**確認方法**:
1. ブラウザで https://lifex-btob.vercel.app/plans.html を開く
2. F12キーを押して開発者ツールを開く
3. Console タブを確認

**確認すべきエラー**:
```
❌ エラー例1: モジュール読み込みエラー
Failed to load module script: Expected a JavaScript module script...

❌ エラー例2: Supabase初期化エラー
Uncaught Error: Supabase client failed to initialize

❌ エラー例3: Alpine.js エラー
Alpine Expression Error: ...

✅ 正常な場合:
✅ Loaded plans from Supabase: 57
✅ Loaded rules from Supabase: 2
✅ Loaded FAQs from Supabase: 2
```

### 2. Network タブを確認

**確認方法**:
1. 開発者ツールの Network タブを開く
2. ページをリロード
3. 赤色（エラー）のリクエストを探す

**確認すべきファイル**:
- `/js/supabase-client.js` → ステータス 200 であること
- `/js/supabase-integration.js` → ステータス 200 であること
- `/js/common.js` → ステータス 200 であること

### 3. Vercelのデプロイ状況を確認

**確認方法**:
1. https://vercel.com/dashboard にアクセス
2. プロジェクトを選択
3. Deployments タブで最新のデプロイを確認

**確認すべき項目**:
- ✅ 最新のコミット（2f11209 または 3ed916b）がデプロイされているか
- ✅ ビルドステータスが "Ready" であるか
- ❌ "Error" や "Failed" になっていないか

## よくある問題と解決方法

### 問題1: 古いバージョンがキャッシュされている

**症状**: 修正したはずのエラーがまだ出ている

**解決方法**:
1. ブラウザのハードリフレッシュ（Ctrl + Shift + R）
2. ブラウザのキャッシュをクリア
3. シークレットモードで開く

### 問題2: JavaScriptモジュールが404エラー

**症状**: `Failed to load module` エラーが出る

**原因**: Viteのビルド設定が正しくない、またはファイルパスが間違っている

**解決方法**:
```bash
# ローカルでビルドして確認
npm run build

# distフォルダの内容を確認
ls -R dist/
```

### 問題3: Supabase APIが初期化されない

**症状**: `window.supabaseAPI is undefined`

**原因**: `supabase-integration.js` が読み込まれていない

**解決方法**:
HTMLファイルで以下が含まれているか確認:
```html
<script type="module" src="/js/supabase-integration.js"></script>
```

### 問題4: Alpine.jsが動作しない

**症状**: `x-data` や `x-text` が展開されず、そのまま表示される

**原因**: Alpine.jsのCDNが読み込まれていない、または初期化前にコードが実行されている

**解決方法**:
```html
<!-- Alpine.jsのCDNを確認 -->
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

### 問題5: データは取得できているが表示されない

**症状**: コンソールに `✅ Loaded plans: 57` と出ているが、画面に何も出ない

**原因**: Alpine.jsのデータバインディングが失敗している、またはCSSで非表示になっている

**デバッグ方法**:
```javascript
// ブラウザコンソールで実行
console.log(Alpine.store('plansPage')); // データが入っているか確認
```

## 緊急対応チェックリスト

現在の状況で確認すべきこと（優先度順）:

1. [ ] **Vercelで最新版がデプロイされているか**
   - 期待されるコミット: 2f11209 または 3ed916b
   - 確認URL: https://vercel.com/dashboard

2. [ ] **ブラウザコンソールにエラーが出ていないか**
   - F12 → Console タブ
   - エラーメッセージをスクリーンショット

3. [ ] **Network タブで JSファイルが404になっていないか**
   - F12 → Network タブ → リロード
   - 赤色のリクエストを確認

4. [ ] **ページのソースコードを表示**
   - 右クリック → ページのソースを表示
   - `<script>` タグが正しく含まれているか確認

5. [ ] **データ取得のログが出ているか**
   - コンソールに `✅ Loaded ... from Supabase` が出ているか

## 次のステップ

上記を確認して、以下の情報を提供してください：

1. **ブラウザコンソールのエラーメッセージ**（あれば）
2. **Network タブのエラー**（あれば）
3. **Vercelの最新デプロイのコミットハッシュ**
4. **コンソールに出ている全てのログ**

これらの情報があれば、正確に問題を特定できます。
