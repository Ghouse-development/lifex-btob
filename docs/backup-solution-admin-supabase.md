# Admin.html Supabase初期化 - バックアップソリューション

## 現在の方法で動作しない場合の代替案

### 方法1: Supabaseクライアントをインラインで初期化

```html
<script>
    // Supabase設定を直接記述
    const SUPABASE_URL = 'https://hegpxvyziovlfxdfsrsv.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    // CDN経由でSupabaseクライアントを読み込み
    import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
        .then(({ createClient }) => {
            window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.dispatchEvent(new CustomEvent('supabase-ready'));
        });
</script>
```

### 方法2: auth-guard.jsで初期化

既存の`auth-guard.js`でSupabaseクライアントを初期化し、
それをwindow.supabaseに設定する。

### 方法3: common.jsで初期化

common.jsにSupabase初期化コードを追加し、
全てのadminページで共通利用する。

## 推奨する対応順序

1. まず現在のデプロイを確認
2. エラーが出る場合 → 方法1を試す（最も確実）
3. それでもダメなら → 方法2または3
