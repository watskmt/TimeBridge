#!/bin/bash
# TimeBridge サーバーセットアップスクリプト (Rocky Linux / EL10)
set -e

# ===== 設定 =====
REPO_URL="git@github.com:watskmt/TimeBridge.git"
DEPLOY_DIR="/opt/timebridge"
SECRETS_DIR="/opt/timebridge-secrets"
DOMAIN="timebridge.amtech-service.com"
FRONTEND_PORT="3001"
BACKEND_PORT="8000"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ===== 1. Docker インストール =====
info "1/8 Docker をインストール中..."
if command -v docker &>/dev/null; then
  info "Docker は既にインストール済みです"
else
  sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo -y 2>/dev/null || true
  sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
  sudo systemctl enable docker
fi

# ===== 2. Docker networking 設定 (EL10 / nftables 環境) =====
info "2/8 Docker ネットワーク設定中..."
sudo mkdir -p /etc/docker

# EL10 では iptables kernel モジュールが存在しないため iptables:false で起動
# コンテナ間の DNS は docker-compose の extra_hosts + static IP で解決する
cat <<EOF | sudo tee /etc/docker/daemon.json > /dev/null
{
  "iptables": false
}
EOF

sudo systemctl enable --now nftables 2>/dev/null || true
sudo systemctl start docker
sudo systemctl enable docker

# IP フォワーディング
sudo sysctl -w net.ipv4.ip_forward=1
grep -q "net.ipv4.ip_forward" /etc/sysctl.conf || echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf

# Docker 起動待ち
sleep 3
docker info &>/dev/null || error "Docker の起動に失敗しました"

# nftables MASQUERADE ルール (コンテナからインターネット接続)
DOCKER_SUBNET="172.30.0.0/16"
OUTBOUND_IF=$(ip route show default | awk '{print $5}' | head -1)
info "  Docker subnet: $DOCKER_SUBNET, interface: $OUTBOUND_IF"
sudo nft add table ip nat 2>/dev/null || true
sudo nft 'add chain ip nat postrouting { type nat hook postrouting priority 100 ; }' 2>/dev/null || true
sudo nft add rule ip nat postrouting ip saddr "$DOCKER_SUBNET" oif "$OUTBOUND_IF" masquerade 2>/dev/null || true

# ===== 3. ユーザーを docker グループに追加 =====
info "3/8 docker グループ設定中..."
sudo usermod -aG docker "$USER" 2>/dev/null || true

# ===== 4. GitHub SSH キー設定 =====
info "4/8 GitHub SSH キー設定中..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keyscan -H github.com >> ~/.ssh/known_hosts 2>/dev/null

if [ ! -f ~/.ssh/github_deploy_key ]; then
  warn "GitHub の SSH deploy key が ~/.ssh/github_deploy_key に存在しません"
  warn "以下を実行してから再度このスクリプトを実行してください:"
  warn "  echo 'YOUR_PRIVATE_KEY' > ~/.ssh/github_deploy_key && chmod 600 ~/.ssh/github_deploy_key"
  exit 1
fi
chmod 600 ~/.ssh/github_deploy_key
export GIT_SSH_COMMAND="ssh -i ~/.ssh/github_deploy_key -o StrictHostKeyChecking=no"

# ===== 5. リポジトリのクローン =====
info "5/8 リポジトリをセットアップ中..."
sudo mkdir -p "$DEPLOY_DIR"
sudo chown "$USER:$USER" "$DEPLOY_DIR"

if [ ! -d "$DEPLOY_DIR/.git" ]; then
  git clone "$REPO_URL" "$DEPLOY_DIR"
else
  cd "$DEPLOY_DIR"
  git fetch origin main
  git reset --hard origin/main
fi

# ===== 6. 本番 .env ファイルの確認 =====
info "6/8 環境変数ファイルを確認中..."
sudo mkdir -p "$SECRETS_DIR"
sudo chown "$USER:$USER" "$SECRETS_DIR"

if [ ! -f "$SECRETS_DIR/backend.env" ]; then
  warn "本番用 .env ファイルを作成してください: $SECRETS_DIR/backend.env"
  cat <<ENV_TEMPLATE | sudo tee "$SECRETS_DIR/backend.env" > /dev/null
APP_NAME="TimeBridge"
APP_ENV=production
APP_KEY=          # php artisan key:generate --show で生成
APP_DEBUG=false
APP_URL=http://${DOMAIN}

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=timebridge
DB_USERNAME=timebridge_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=cookie

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

SANCTUM_STATEFUL_DOMAINS=${DOMAIN}
CORS_ALLOWED_ORIGINS=http://${DOMAIN}

MAIL_MAILER=log
MAIL_FROM_ADDRESS="noreply@timebridge.app"
MAIL_FROM_NAME="TimeBridge"

PDF_ORIENTATION=Portrait
PDF_PAPER_SIZE=A4
ENV_TEMPLATE
  sudo chown "$USER:$USER" "$SECRETS_DIR/backend.env"
  sudo chmod 600 "$SECRETS_DIR/backend.env"
  warn "↑ $SECRETS_DIR/backend.env を編集してから再度このスクリプトを実行してください"
  exit 1
fi

# docker-compose 用 .env
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  DB_PASS=$(grep DB_PASSWORD "$SECRETS_DIR/backend.env" | cut -d= -f2)
  cat <<COMPOSE_ENV | tee "$DEPLOY_DIR/.env" > /dev/null
DB_DATABASE=timebridge
DB_USERNAME=timebridge_user
DB_PASSWORD=${DB_PASS}
NEXT_PUBLIC_API_URL=http://${DOMAIN}
COMPOSE_ENV
fi

cp "$SECRETS_DIR/backend.env" "$DEPLOY_DIR/backend/.env"

# ===== 7. Docker Compose 起動 =====
info "7/8 Docker コンテナを起動中..."
cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --build

# 起動待ち
info "  コンテナ起動を待機中..."
sleep 10
docker compose -f docker-compose.prod.yml ps

# ===== 8. nginx 設定 =====
info "8/8 nginx を設定中..."
sudo tee /etc/nginx/conf.d/timebridge.conf > /dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    access_log /var/log/nginx/timebridge_access.log;
    error_log  /var/log/nginx/timebridge_error.log;

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 20M;
    }

    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

sudo nginx -t && sudo systemctl reload nginx

# ===== 完了 =====
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} TimeBridge セットアップ完了!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  アプリURL: http://${DOMAIN}"
echo "  API URL:   http://${DOMAIN}/api/health"
echo ""
echo "動作確認:"
echo "  curl -s http://${DOMAIN}/api/health"
echo ""
echo "ログ確認:"
echo "  docker compose -f $DEPLOY_DIR/docker-compose.prod.yml logs -f"
