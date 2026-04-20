# TimeBridge

**フリーランスITエンジニア向け統合管理プラットフォーム**

稼働時間記録、プロジェクト管理、検収管理、請求書自動生成をワンプラットフォームで実現します。

## 📋 プロジェクト概要

### 主な機能
- ⏱️ **リアルタイムタイマー** - 稼働時間の正確な記録（開始/停止/手動入力対応）
- 📊 **プロジェクト管理** - 複数案件の同時管理、予算管理、進捗追跡
- ✅ **検収管理** - チェックリスト機能、クライアント承認フロー、コメント機能
- 📄 **請求書管理** - PDF自動生成、複数案件合算対応、入金管理
- 📈 **ダッシュボード** - KPI表示、グラフ表示、売上推移分析

## 🏗️ 技術スタック

### フロントエンド
- **React 18** + **Next.js 14** - モダンなSPAフレームワーク
- **TypeScript** - 型安全な開発
- **Zustand** - 軽量な状態管理
- **TanStack React Query** - サーバー状態管理
- **TailwindCSS** + **Shadcn/UI** - スタイリング
- **Recharts** - データビジュアライゼーション

### バックエンド
- **Laravel 11** - PHPのモダンフレームワーク
- **PHP 8.4** - 最新PHP
- **PostgreSQL 15+** - リレーショナルDB
- **Redis 7** - キャッシュ、セッション、ジョブキュー
- **Laravel Sanctum** - API認証

### インフラ・DevOps
- **Docker / Docker Compose** - 開発環境
- **GitHub Actions** - CI/CDパイプライン
- **Rocky Linux 10** - 本番環境
- **Nginx** - Webサーバー

## 🚀 クイックスタート

### Docker Compose で起動

```bash
cd TimeBridge
docker-compose up -d

# マイグレーション実行
docker-compose exec backend php artisan migrate
```

アクセス:
- **フロント**: http://localhost:3000
- **API**: http://localhost:8000
- **メール**: http://localhost:8025 (Mailpit)

## 📁 ファイル構成

```
TimeBridge/
├── backend/
│   ├── app/Models/           # 5個のEloquent models
│   ├── app/Http/Controllers/ # 6個のREST controllers
│   ├── database/migrations/  # 6個のマイグレーション
│   ├── routes/api.php
│   └── composer.json
├── frontend/
│   ├── src/app/             # ページコンポーネント
│   ├── src/components/      # UIコンポーネント
│   ├── src/store/           # Zustand stores
│   ├── src/api/             # APIクライアント
│   └── package.json
├── .github/workflows/        # CI/CDパイプライン
├── docker-compose.yml
└── README.md
```

## 🔧 開発環境セットアップ

### ローカル開発（Docker非使用）

**Backend:**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🧪 テスト実行

```bash
# Backend
cd backend
php artisan test

# Frontend
cd frontend
npm test
```

## 📊 CI/CD パイプライン

**GitHub Actions:**
- ✅ Backend CI - Laravel テスト、Linter
- ✅ Frontend CI - Next.js ビルド、テスト
- ✅ Deploy - VPS へのデプロイ自動化

**必要な GitHub Secrets:**
```
DOCKER_USERNAME
DOCKER_PASSWORD
DOCKER_REGISTRY
VPS_HOST
VPS_USERNAME
VPS_SSH_KEY
VPS_PORT
SLACK_WEBHOOK_URL
```

## 📝 コミット規約

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント
style: コード整形
refactor: リファクタリング
test: テスト追加
chore: ビルド・依存関係
```

## 🔗 参考ドキュメント

- `TimeBridge_仕様書.docx` - 詳細な技術仕様
- [Laravel Docs](https://laravel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

**Version:** 1.0.0  
**Created:** 2026年4月17日
