#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 環境変数ファイルの作成
if [ ! -f backend/.env ]; then
  echo "→ backend/.env を作成します"
  cp backend/.env.example backend/.env
fi

# 初回かどうか判定（イメージが存在するか）
if docker image inspect timebridge-api >/dev/null 2>&1; then
  echo "→ サービスを起動します"
  docker-compose up -d
else
  echo "→ 初回ビルド＆起動します（数分かかります）"
  docker-compose up -d --build
fi

# 起動待ち
echo "→ サービスの起動を待っています..."
sleep 3

docker-compose ps

echo ""
echo "✅ 起動完了"
echo "   フロントエンド : http://localhost:3000"
echo "   バックエンドAPI: http://localhost:8000"
echo "   メール確認     : http://localhost:8025"
