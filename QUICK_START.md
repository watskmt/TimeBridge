# TimeBridge - Quick Start Guide

## 最速スタートガイド

### 1. ファイルの確認
```bash
cd ~/IdeaProjects/TimeBridge
ls -la
```

ディレクトリ構成:
```
TimeBridge/
├── backend/              # Laravel API
├── frontend/             # Next.js フロント
├── docker-compose.yml    # Docker 設定
├── start.sh              # 起動スクリプト
└── README.md             # 開発ガイド
```

### 2. Docker で起動

```bash
cd ~/IdeaProjects/TimeBridge

# スクリプトで起動（推奨）
./start.sh
```

または手動で:

```bash
# 初回（ビルドあり）
docker-compose up -d --build

# 2回目以降
docker-compose up -d
```

アクセスURL:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000/api
- **Mailpit**: http://localhost:8025

### 3. バージョン情報

| パッケージ      | バージョン |
|----------------|-----------|
| Next.js | 15.x |
| React | 18.x |
| Laravel | 11.x |
| PHP | 8.4 |
| PostgreSQL | 15 |
| Redis | 7 |

### 4. ローカル開発（Docker なし）

#### Backend セットアップ
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

#### Frontend セットアップ
```bash
cd frontend
npm install
npm run dev
```

### 5. テストユーザー情報

**登録ページからアカウント作成:**
- Email: `test@example.com`
- Password: `password123`

### 6. 主な機能へのアクセス

- **ダッシュボード**: http://localhost:3000/dashboard
- **プロジェクト管理**: http://localhost:3000/dashboard/projects
- **稼働時間記録**: http://localhost:3000/dashboard/time-tracking
- **API ルート**: `backend/routes/api.php`

### 7. よく使うコマンド

```bash
# ログを確認
docker-compose logs -f backend
docker-compose logs -f frontend

# コンテナに入る
docker-compose exec backend bash
docker-compose exec frontend sh

# マイグレーション実行
docker-compose exec backend php artisan migrate

# 初期データシード（オプション）
docker-compose exec backend php artisan db:seed

# コンテナを停止
docker-compose down

# 全削除（データベース含む）
docker-compose down -v
```

### 8. 開発時のヒント

```bash
# Backend テスト
docker-compose exec backend php artisan test

# Frontend テスト
docker-compose exec frontend npm test

# Linter
docker-compose exec backend composer lint
docker-compose exec frontend npm run lint
```

### 9. コード生成（Laravel）

```bash
docker-compose exec backend php artisan make:model ModelName -m
docker-compose exec backend php artisan make:controller Controllers/ControllerName
docker-compose exec backend php artisan make:migration table_name
```

### 10. トラブルシューティング

**PostgreSQL に接続できない**
```bash
docker-compose ps
docker-compose logs postgres
```

**ポート競合エラー**
```
# docker-compose.yml の ports を変更
"5433:5432"  # 5432 → 5433
```

**パッケージ変更後は必ず再ビルド**
```bash
docker-compose down -v && docker-compose up -d --build
```

---

## ドキュメント

- **README.md** - 完全な開発ガイド
- **TimeBridge_仕様書.docx** - 技術仕様書

## 参考資料

- [Laravel 公式ドキュメント](https://laravel.com/docs)
- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [Docker ドキュメント](https://docs.docker.com)
