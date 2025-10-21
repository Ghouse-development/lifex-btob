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
- **Supabase (PostgreSQL)** - データベース（Proプラン）
- **Vercel** - ホスティング・デプロイ（Proプラン）
- **Vercel Functions** - サーバーレス機能（管理機能用）

### データ保存方式
✅ **全ての管理機能でSupabaseを使用**
- プラン管理 → Supabase
- FAQ管理 → Supabase
- ルール管理 → Supabase
- ダウンロード管理 → Supabase
- LocalStorageはフォールバックのみ使用

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

## 📋 要件と実装状況

### 📊 実装状況レポート
**詳細レポート**: [implementation-status-report.md](docs/implementation-status-report.md)

**総合完成度**: 70% | **コア機能**: 80% | **セキュリティ**: 30%

### 機能要件
- [x] 間取マトリックス表示
- [x] プラン検索・フィルタ
- [x] 資料ダウンロード機能
- [x] 管理画面（CRUD完備）
- [x] レスポンシブデザイン
- [ ] 認証・アクセス制御（⚠️ 簡易実装）
- [ ] 通知・お知らせ機能
- [ ] アクセス解析

### 非機能要件
- [x] パフォーマンス最適化
- [x] SEO対応
- [x] アクセシビリティ
- [ ] セキュリティ対策（⚠️ 本番運用には不十分）
- [x] データ永続化（Supabase）

## 💾 データ永続性とアカウント移行

### インフラ情報
- **Vercel**: Proプラン
- **Supabase**: Proプラン

### データの永続性
システム上でアップロードしたデータは、Supabaseデータベースに永続的に保存されます。

#### 安全な操作 ✅
- コードの変更・再デプロイ → データに影響なし
- HTMLやJavaScriptの修正 → データは保持される
- Vercelへの再デプロイ → フロントエンドの更新のみ
- git操作（commit, push等） → データベースとは無関係

#### 注意が必要な操作 ⚠️
1. **データベーススキーマの変更**
   - テーブルやカラムの削除 → データも削除される
   - カラムの追加は安全
2. **Supabaseプロジェクトの削除**
   - プロジェクトごと全データが削除される
3. **Proプランの制限**
   - 通常は非アクティブでも一時停止されない
   - データは永続的に保持される

### アカウント移行手順

別のアカウント（VercelまたはSupabase）に移行する場合でも、データとレイアウトは完全に移行できます。

#### Supabaseデータの移行

**方法1: SQLダンプ（推奨）**
```bash
# データをエクスポート
supabase db dump > backup_$(date +%Y%m%d).sql

# 新しいプロジェクトでインポート
psql -h [NEW_PROJECT_URL] -U postgres -d postgres < backup_YYYYMMDD.sql
```

**方法2: Dashboard経由**
1. [Supabase Dashboard](https://supabase.com) にログイン
2. Database → Backups → Create backup
3. 新しいプロジェクトで Restore from backup

#### Vercelプロジェクトの移行

1. GitHubリポジトリを新しいアカウントに転送 or Clone
2. 新しいVercelアカウントでプロジェクト作成
3. GitHubリポジトリを接続
4. 環境変数を設定（下記参照）

#### 移行チェックリスト

- [ ] Supabaseバックアップを取得
- [ ] 環境変数をメモ
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - その他のカスタム環境変数
- [ ] GitHubリポジトリを準備
- [ ] 新しいSupabaseプロジェクト作成
- [ ] データをインポート
- [ ] テーブル・RLSポリシーの確認
- [ ] 新しいVercelプロジェクト作成
- [ ] 環境変数を設定
- [ ] デプロイとテスト

#### データ消失リスク

適切な移行手順に従えば、**データ消失のリスクはほぼゼロ** ✅

移行前に必ずバックアップを取得してください。

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