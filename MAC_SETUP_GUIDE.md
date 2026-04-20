# TimeBridge - macOS セットアップガイド

## 🍎 macOS での環境構築手順

このガイドでは、macOS (`/Users/watsk`) で TimeBridge を実行するための詳細な手順を説明します。

---

## 📥 ステップ 1: TimeBridge プロジェクトのダウンロード

### Option A: GitHub から clone（推奨）

```bash
# ホームディレクトリに移動
cd ~

# IdeaProjects ディレクトリを作成（なければ）
mkdir -p IdeaProjects

# プロジェクトを clone
git clone <repository-url> IdeaProjects/TimeBridge

cd IdeaProjects/TimeBridge
```

### Option B: 圧縮ファイルから抽出

```bash
# TimeBridge.tar.gz をダウンロード

# ホームディレクトリに移動
cd ~

# IdeaProjects ディレクトリを作成
mkdir -p IdeaProjects

# 圧縮ファイルを抽出
tar -xzf TimeBridge.tar.gz -C IdeaProjects/

# 確認
cd IdeaProjects/TimeBridge
ls -la
```

---

## 🛠️ ステップ 2: 前提条件の確認・インストール

### 2.1 Homebrew のインストール

```bash
# Homebrew がインストール済みか確認
brew --version

# インストールされていなければ実行
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2.2 Docker Desktop のインストール

```bash
# Homebrew から Docker をインストール
brew install --cask docker

# または Apple Silicon の場合は
brew install --cask docker

# Docker の起動確認
docker --version
```

### 2.3 必要なツールのインストール

```bash
# Git (通常、macOS に含まれています)
git --version

# Node.js と npm のインストール
brew install node

# PHP（ローカル開発の場合）
brew install php

# Composer（PHP パッケージマネージャー）
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Git LFS（大きなファイル対応）
brew install git-lfs
```

---

## 📁 ステップ 3: プロジェクトの初期化

### 3.1 プロジェクトディレクトリの確認

```bash
cd ~/IdeaProjects/TimeBridge

# ファイル構成を確認
ls -la

# 以下のディレクトリ/ファイルが存在することを確認
# - backend/
# - frontend/
# - docker-compose.yml
# - README.md
# - QUICK_START.md
```

### 3.2 環境変数ファイルの設定

**Backend の設定:**

```bash
cd backend

# .env.example をコピー
cp .env.example .env

# エディタで .env を編集
open .env  # または vim .env, nano .env

# 以下の設定を確認・修正
DB_CONNECTION=pgsql
DB_HOST=localhost  # または postgres (Docker 使用時)
DB_PORT=5432
DB_DATABASE=timebridge_dev
DB_USERNAME=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost  # または redis (Docker 使用時)
REDIS_PORT=6379
```

**Frontend の設定:**

```bash
cd ../frontend

# .env.local.example をコピー
cp .env.local.example .env.local

# エディタで .env.local を編集
open .env.local  # または vim .env.local, nano .env.local

# 設定を確認
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🐳 ステップ 4: Docker で実行（推奨）

### 4.1 Docker コンポーネントの起動

```bash
cd ~/IdeaProjects/TimeBridge

# Docker Compose を起動
docker-compose up -d

# 確認（数秒待機してから実行）
sleep 10
docker-compose ps

# 以下のコンテナが UP 状態であることを確認
# - timebridge_postgres
# - timebridge_redis
# - timebridge_api
# - timebridge_frontend
# - timebridge_mailpit
```

### 4.2 データベースマイグレーション

```bash
# API コンテナでマイグレーション実行
docker-compose exec backend php artisan migrate

# 初期データのシード（オプション）
docker-compose exec backend php artisan db:seed
```

### 4.3 アクセス確認

ブラウザで以下にアクセス:

```
Frontend: http://localhost:3000
API:      http://localhost:8000
Mailpit:  http://localhost:8025
```

### 4.4 ログの確認

```bash
# リアルタイムでログを表示
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

---

## 💻 ステップ 5: ローカル開発（Docker 非使用）

### 5.1 Backend セットアップ

```bash
cd ~/IdeaProjects/TimeBridge/backend

# PHP 依存関係をインストール
composer install

# .env ファイルを設定
cp .env.example .env

# APP_KEY を生成
php artisan key:generate

# データベース接続を確認（PostgreSQL が起動していることが必須）
# DB_HOST=localhost
# DB_DATABASE=timebridge_dev
# DB_USERNAME=postgres
# DB_PASSWORD=postgres

# マイグレーション実行
php artisan migrate

# サーバー起動（ターミナル 1）
php artisan serve
# サーバーが http://localhost:8000 で起動します
```

### 5.2 Frontend セットアップ

```bash
cd ~/IdeaProjects/TimeBridge/frontend

# Node 依存関係をインストール
npm install

# 開発サーバー起動（新しいターミナル 2）
npm run dev
# サーバーが http://localhost:3000 で起動します
```

### 5.3 PostgreSQL のローカルセットアップ（必須）

```bash
# Homebrew で PostgreSQL をインストール
brew install postgresql@15

# PostgreSQL サービスを起動
brew services start postgresql@15

# デフォルトユーザーで接続テスト
createdb timebridge_dev

# または psql で確認
psql -U postgres -d postgres
# psql の中で:
# CREATE DATABASE timebridge_dev;
# \q で終了
```

### 5.4 Redis のローカルセットアップ（オプション）

```bash
# Homebrew で Redis をインストール
brew install redis

# Redis サービスを起動
brew services start redis
```

---

## 🔐 ステップ 6: テストユーザーの作成

### Option A: UI から登録

1. ブラウザで http://localhost:3000 にアクセス
2. 「登録する」をクリック
3. 以下の情報を入力:
   - 氏名: `田中太郎`
   - メール: `tanaka@example.com`
   - パスワード: `TestPassword123`
   - 企業名: `YourCompany Inc.`
   - 電話: `090-1234-5678`

### Option B: Laravel Tinker で作成

```bash
cd ~/IdeaProjects/TimeBridge/backend

php artisan tinker

# Tinker のプロンプト内で:
> App\Models\User::create([
  'name' => '田中太郎',
  'email' => 'tanaka@example.com',
  'password' => bcrypt('TestPassword123'),
  'company_name' => 'YourCompany Inc.',
  'phone' => '090-1234-5678'
]);

# 確認:
> App\Models\User::all();

# 終了:
> exit
```

---

## 📂 ステップ 7: IntelliJ IDEA での開発

### 7.1 IntelliJ IDEA で開く

```bash
# ターミナルから開く
cd ~/IdeaProjects/TimeBridge
idea .

# または、IntelliJ IDEA のメニューから:
# File → Open → ~/IdeaProjects/TimeBridge
```

### 7.2 プロジェクト設定

**Language Levels:**
- PHP: 8.4
- Node.js: 18+
- TypeScript: Latest

**IDE での実行設定:**

```
Run → Edit Configurations
Add New Configuration → PHP Built-in Web Server

Script: backend/artisan
Port: 8000
```

---

## 🧪 ステップ 8: テストの実行

### Backend テスト

```bash
cd ~/IdeaProjects/TimeBridge/backend

# すべてのテストを実行
php artisan test

# 特定のテストクラスのみ実行
php artisan test tests/Feature/AuthTest.php

# ユニットテストのみ
php artisan test --unit
```

### Frontend テスト

```bash
cd ~/IdeaProjects/TimeBridge/frontend

# Jest テスト実行
npm test

# カバレッジ付きで実行
npm test -- --coverage

# Watch モード
npm test -- --watch
```

---

## 🔧 ステップ 9: トラブルシューティング

### "Port 5432 is already in use"

```bash
# PostgreSQL が既に起動しているか確認
lsof -i :5432

# プロセスを終了
kill -9 <PID>

# または docker-compose で別のポートを使う
# docker-compose.yml を編集:
# ports:
#   - "5433:5432"
```

### "npm install でエラー"

```bash
# キャッシュをクリア
npm cache clean --force

# node_modules を削除
rm -rf node_modules package-lock.json

# 再度インストール
npm install
```

### "composer install でエラー"

```bash
# Composer キャッシュをクリア
composer clear-cache

# 再度実行
composer install
```

### "PostgreSQL に接続できない"

```bash
# PostgreSQL が起動しているか確認
brew services list

# 起動していなければ起動
brew services start postgresql@15

# psql で接続テスト
psql -U postgres
```

---

## 📚 ステップ 10: 開発ワークフロー

### 日常的な開発フロー

```bash
# 毎朝、プロジェクトディレクトリで:
cd ~/IdeaProjects/TimeBridge

# 最新の変更を取得（チームで開発する場合）
git pull origin develop

# Docker で起動（または前のセッションから起動継続）
docker-compose up -d

# コード編集...

# コミット
git add .
git commit -m "feat: 新機能を追加"
git push origin feature-branch
```

### Git ブランチ戦略

```bash
# 機能開発ブランチを作成
git checkout -b feature/project-creation

# 変更をコミット
git commit -m "feat: プロジェクト作成機能"

# リモートにプッシュ
git push origin feature/project-creation

# GitHub で Pull Request を作成
```

---

## 🚀 ステップ 11: 本番環境へのデプロイ（高度）

### 11.1 GitHub Actions で自動デプロイ

`.github/workflows/deploy.yml` で以下を設定:

```yaml
env:
  DOCKER_USERNAME: your-docker-username
  DOCKER_PASSWORD: your-docker-password
  VPS_HOST: your-vps-host
  VPS_USERNAME: your-vps-user
  VPS_SSH_KEY: your-private-key
```

### 11.2 VPS でのセットアップ

```bash
# VPS で実行（Rocky Linux 10）
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# アプリケーションディレクトリ
sudo mkdir -p /home/timebridge
cd /home/timebridge

# Git repository clone
git clone <repo> .

# Docker Compose で起動
docker-compose up -d

# SSL 証明書の設定（Certbot）
sudo yum install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

---

## 📊 ステップ 12: パフォーマンスチューニング

### Laravel パフォーマンス最適化

```bash
cd ~/IdeaProjects/TimeBridge/backend

# キャッシュ最適化
php artisan config:cache
php artisan route:cache
php artisan view:cache

# キャッシュをクリア（開発時）
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Next.js パフォーマンス最適化

```bash
cd ~/IdeaProjects/TimeBridge/frontend

# 本番ビルド
npm run build

# 本番実行
npm run start

# 静的エクスポート（SSG）
npm run export
```

---

## 🎓 推奨される学習リソース

- [Laravel 公式ドキュメント](https://laravel.com/docs/11)
- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [PostgreSQL チュートリアル](https://www.postgresql.org/docs/15/tutorial.html)
- [Docker 公式ドキュメント](https://docs.docker.com)

---

## 📞 サポート

### よくある質問

**Q: macOS で Docker を使うべき？**  
A: はい。PHP, PostgreSQL, Redis を個別にインストールするより、Docker で統一する方が簡単です。

**Q: IntelliJ IDEA が必要？**  
A: いいえ。VS Code や他のエディタでも開発可能です。ただし、IntelliJ はおすすめです。

**Q: 初期データをロードするには？**  
A: `php artisan db:seed` を実行してください。

---

## ✨ 完了！

以上で macOS での TimeBridge 開発環境の構築が完了しました！

Happy Coding! 🚀

---

*Last Updated: 2026-04-18*

