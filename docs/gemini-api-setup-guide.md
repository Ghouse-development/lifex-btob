# Gemini API統合 セットアップガイド

**作成日**: 2025-01-21
**目的**: LIFE X AIアシスタントでGemini APIを使用する

---

## 📋 概要

LIFE X AIアシスタント (`/ai.html`) は、Google Gemini APIを使用して、加盟店からの質問に自動で回答します。

### 機能
- ✅ LIFE Xに関する専門知識を持つAIアシスタント
- ✅ プラン、仕様、設計、施工に関する質問に対応
- ✅ 会話履歴を保持（直近10メッセージ）
- ✅ エラー時はナレッジベースにフォールバック

---

## 🔧 セットアップ手順

### ステップ1: Vercelに環境変数を設定

**Gemini APIキー**: `AIzaSyAfEI3sFVWbZvG9qp2Y8irYCuNMbZFbntw`

#### 1.1 Vercel Dashboardにアクセス

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. LIFE-X-site プロジェクトを選択
3. **Settings** → **Environment Variables** をクリック

#### 1.2 環境変数を追加

**Name**: `GEMINI_API_KEY`
**Value**: `AIzaSyAfEI3sFVWbZvG9qp2Y8irYCuNMbZFbntw`
**Environment**: ✅ Production, ✅ Preview, ✅ Development

**Save** をクリック

---

### ステップ2: 再デプロイ

環境変数を設定後、プロジェクトを再デプロイする必要があります。

#### 方法1: Git Push（推奨）

```bash
git add .
git commit -m "feat: Gemini API統合"
git push
```

Vercelが自動的に再デプロイします。

#### 方法2: Vercel Dashboardから手動デプロイ

1. **Deployments** タブを開く
2. 最新のデプロイメントの右側にある **⋮** をクリック
3. **Redeploy** をクリック

---

### ステップ3: 動作確認

1. デプロイが完了したら、サイトにアクセス
2. `/ai` ページを開く
3. 質問を入力して送信
4. Gemini APIからの回答が表示されることを確認

**テスト用の質問例**:
- 「LIFE Xの標準プランについて教えてください」
- 「耐震等級3の詳細を教えてください」
- 「30坪のプランでおすすめはありますか？」

---

## 🏗️ システム構成

### ファイル構成

```
LIFE-X-site/
├── api/
│   └── gemini-chat.js          # Vercel Function（APIエンドポイント）
├── src/
│   └── ai.html                 # AIアシスタントUI
├── .env.example                # 環境変数のサンプル
└── vercel.json                 # Vercel設定
```

### APIエンドポイント

**URL**: `/api/gemini-chat`
**メソッド**: POST
**リクエスト**:
```json
{
  "message": "ユーザーの質問",
  "history": [
    { "role": "user", "content": "前の質問" },
    { "role": "assistant", "content": "前の回答" }
  ]
}
```

**レスポンス**:
```json
{
  "success": true,
  "response": "AIの回答",
  "model": "gemini-1.5-flash"
}
```

---

## 🤖 システムプロンプト

Gemini APIには以下のシステムプロンプトが設定されています：

```
あなたはGハウス規格住宅「LIFE X」の専門AIアシスタントです。

【あなたの役割】
- LIFE Xの加盟店（工務店・ビルダー）向けの技術サポート
- プラン、仕様、設計、施工に関する質問に正確に回答
- 専門的かつ分かりやすい説明を提供

【LIFE Xの基本情報】
- 規格住宅: 複数の標準プランを提供（詳細なプラン数は担当者にお問い合わせください）
- 坪数: 約25〜50坪
- 構造: 木造軸組工法
- 耐震性能: 標準で耐震等級3
- 断熱性能: ZEH基準対応可能
- 工期: 約4〜5ヶ月
- 価格帯: 坪単価60〜80万円

（その他、詳細な仕様情報が含まれます）
```

**プロンプトの変更**: `api/gemini-chat.js` の `systemPrompt` 変数を編集

---

## 💰 コスト管理

### Gemini API料金

**使用モデル**: `gemini-2.0-flash`（2025年1月より gemini-1.5-flash から移行）

**料金（2025年1月時点）**:
- 入力: $0.000125 / 1,000 tokens
- 出力: $0.000375 / 1,000 tokens

**推定コスト（月間）**:
- 質問数: 1,000回/月
- 平均トークン: 500 tokens/質問
- **月額コスト**: 約 $0.25 〜 $0.50

非常に低コストで運用可能です！

### コスト削減のヒント

1. **会話履歴の制限**: 現在は直近10メッセージに制限済み
2. **maxOutputTokens**: 1024に制限済み
3. **temperature**: 0.7（適度なランダム性）

---

## 🔒 セキュリティ

### APIキーの保護

- ✅ `.env.local` は`.gitignore`に含まれている
- ✅ APIキーはVercel環境変数として保存
- ✅ フロントエンドにAPIキーは露出しない
- ✅ Vercel Functionsを経由してAPIを呼び出し

### CORS設定

`api/gemini-chat.js` では、以下のCORSヘッダーを設定：

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

本番環境では、`*` を実際のドメインに変更することを推奨します。

---

## 🐛 トラブルシューティング

### 問題1: AIが応答しない

**症状**: 質問を送信しても応答がない

**原因と対策**:
1. ブラウザの開発者ツールでエラーを確認
2. `/api/gemini-chat` のネットワークリクエストを確認
3. Vercel環境変数が設定されているか確認
4. Vercelのログを確認（Function Logs）

### 問題2: ナレッジベースから回答している

**症状**: AIの回答の最後に「※ AI接続エラーのため、ナレッジベースから回答しています」と表示される

**原因と対策**:
1. Gemini APIキーが正しいか確認
2. API制限に達していないか確認
3. Vercel Functionsのログを確認

### 問題3: 回答が途中で切れる

**症状**: AIの回答が途中で終わる

**原因**: `maxOutputTokens` の制限

**対策**: `api/gemini-chat.js` の以下を変更：
```javascript
maxOutputTokens: 1024  // → 2048 に増やす
```

---

## 📊 モニタリング

### Vercel Function Logs

1. Vercel Dashboard → プロジェクト選択
2. **Functions** タブを開く
3. `api/gemini-chat.js` をクリック
4. **Logs** で実行ログを確認

### Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) にログイン
2. **APIs & Services** → **Dashboard**
3. **Generative Language API** の使用状況を確認

---

## 🚀 今後の拡張案

### 1. RAG（検索拡張生成）

Supabaseのプランデータを検索して、より正確な回答を生成：

```javascript
// プランデータを取得
const plans = await supabase
  .from('plans')
  .select('*')
  .ilike('name', `%${keyword}%`);

// プロンプトにプランデータを埋め込む
const contextPrompt = `以下のプランデータを参考に回答してください：
${JSON.stringify(plans)}`;
```

### 2. ストリーミングレスポンス

回答をリアルタイムで表示：

```javascript
// Gemini APIのstreamGenerateContent APIを使用
const stream = await gemini.streamGenerateContent(prompt);

for await (const chunk of stream) {
  // チャンクを逐次送信
}
```

### 3. 画像認識

図面や写真をアップロードして質問：

```javascript
// gemini-1.5-pro-vision を使用
const result = await gemini.generateContent([
  { text: '図面を分析してください' },
  { inlineData: { mimeType: 'image/png', data: imageBase64 } }
]);
```

---

## 📞 サポート

技術的な問題や質問については：

- [Gemini API ドキュメント](https://ai.google.dev/docs)
- [Vercel Functions ドキュメント](https://vercel.com/docs/functions)

---

**作成者**: Claude Code (Sonnet 4.5)
**最終更新**: 2025-01-21
