# LIFE X 加盟店専用サイト

Gハウス規格住宅「LIFE X」の加盟店向け専用ポータルサイトです。プラン情報、設計資料、営業ツールなどを効率的に管理・配信します。

## 🏠 概要

LIFE X加盟店が販売・設計・施工に必要な情報・資料を迅速に取得できる専用ポータルを提供します。

### 主な機能
- 📊 **間取マトリックス** - 坪数×奥行/間口での視覚的検索
- 🏠 **プラン一覧** - 高度なフィルタ・検索機能付きプラン管理
- 📁 **ダウンロードセンター** - 営業・設計資料の一元管理
- 🔐 **管理画面** - コンテンツ管理とアクセス解析
- 📱 **レスポンシブ対応** - スマホ・タブレット完全対応

## 🚀 技術構成

### フロントエンド
- **HTML5 + CSS3 + Vanilla JavaScript**
- **Tailwind CSS** - ユーティリティファーストのCSS
- **Alpine.js** - 軽量なReactiveフレームワーク
- **Vite** - 高速ビルドツール

### バックエンド・インフラ
- **静的サイト生成** - JSONベースのデータ管理
- **Vercel** - ホスティング・デプロイ
- **Vercel Functions** - サーバーレス機能（管理機能用）

## 📦 セットアップ

### 前提条件
- Node.js 18+ 
- npm または yarn

### インストール
```bash
# リポジトリをクローン
git clone <repository-url>
cd LIFE-X-site

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 🛠️ 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# ビルド結果をプレビュー
npm run preview

# コード品質チェック
npm run lint
npm run lint:fix
```

## 📁 プロジェクト構造

```
LIFE-X-site/
├── src/                    # ソースコード
│   ├── styles/            # CSS・スタイル
│   ├── utils/             # ユーティリティ関数
│   ├── admin/             # 管理画面
│   ├── index.html         # トップページ
│   ├── matrix.html        # 間取マトリックス
│   ├── plans.html         # プラン一覧
│   └── downloads.html     # ダウンロード
├── data/                  # データファイル
│   ├── plans/            # プランデータ（JSON）
│   ├── resources/        # 共通リソース
│   └── news.json         # お知らせデータ
├── assets/               # 静的アセット
└── static/               # 静的ファイル（PDF等）
```

## 📊 データ構造

### プランデータ例
```json
{
  "id": "LX-030A",
  "name": "LIFE X 30A",
  "tsubo": 30.2,
  "depth": 7.28,
  "width": 8.19,
  "prices": {
    "sell": 23800000,
    "cost": 17800000,
    "gross": 6000000
  },
  "tags": ["2LDK", "平屋", "南入り"],
  "status": "published"
}
```

## 🔐 管理画面

### アクセス
- URL: `/admin/`
- デモログイン: `admin@ghouse.co.jp` / `demo123`

### 機能
- ダッシュボード（統計情報）
- プラン管理（CRUD操作）
- ファイル管理
- お知らせ管理
- アクセス解析

## 📱 レスポンシブ対応

- **デスクトップ**: 1024px以上
- **タブレット**: 768px〜1023px  
- **スマートフォン**: 360px〜767px

## 🎨 デザインシステム

### カラーパレット
- **Primary**: ブルー系グラデーション
- **Success**: グリーン系
- **Warning**: オレンジ系  
- **Error**: レッド系

### タイポグラフィ
- **メインフォント**: Inter
- **日本語フォント**: Noto Sans JP

## 📈 パフォーマンス目標

- ✅ **初回表示**: 1.5秒以内
- ✅ **検索結果**: 3クリック以内で到達
- ✅ **Lighthouse スコア**: 90+ 
- ✅ **モバイル対応**: 完全レスポンシブ

## 🚀 デプロイ

### Vercel（推奨）
```bash
# Vercel CLIでデプロイ
npx vercel

# 本番デプロイ
npx vercel --prod
```

### 環境変数
```
GITHUB_TOKEN=<GitHub API Token>
BASIC_AUTH_USER=<Basic認証ユーザー>
BASIC_AUTH_PASS=<Basic認証パスワード>
```

## 📋 要件

### 機能要件
- [x] 間取マトリックス表示
- [x] プラン検索・フィルタ
- [x] 資料ダウンロード機能
- [x] 管理画面
- [x] レスポンシブデザイン

### 非機能要件
- [x] パフォーマンス最適化
- [x] SEO対応
- [x] アクセシビリティ
- [x] セキュリティ対策

## 🤝 貢献

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 📞 サポート

技術的な問題や質問については、Issues で報告してください。

---

**🏠 Built with ❤️ for LIFE X Partners**