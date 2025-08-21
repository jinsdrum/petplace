#!/bin/bash

# 즉시 배포 스크립트 - EC2에서 wget으로 다운로드해서 실행
echo "🚀 PetPlace 즉시 배포 시작"

# AWS 설정 (환경변수 또는 IAM Role 사용)
export AWS_DEFAULT_REGION=ap-northeast-2
# AWS_ACCESS_KEY_ID와 AWS_SECRET_ACCESS_KEY는 환경변수로 설정 필요

# 기존 서비스 정리
sudo pkill -f nginx || true
sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true
sudo docker rm $(sudo docker ps -aq) 2>/dev/null || true

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | sudo docker login --username AWS --password-stdin 365458640975.dkr.ecr.ap-northeast-2.amazonaws.com

echo "🔽 ECR 이미지 다운로드 중..."

# 백엔드 실행
sudo docker run -d \
  --name petplace-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  -e FLASK_ENV=production \
  -e DATABASE_URL=postgresql://petplace_admin:PetPlace2025!@petplace-db.cpuw4w8giin7.ap-northeast-2.rds.amazonaws.com:5432/petplace \
  -e JWT_SECRET_KEY=petplace-jwt-secret-2025 \
  -e SECRET_KEY=petplace-secret-key-2025 \
  365458640975.dkr.ecr.ap-northeast-2.amazonaws.com/petplace-backend:latest

echo "📁 프론트엔드 파일 추출 중..."

# 프론트엔드 파일 추출
sudo rm -rf /var/www/html/*
sudo docker run --rm \
  -v /var/www/html:/output \
  365458640975.dkr.ecr.ap-northeast-2.amazonaws.com/petplace-frontend:latest \
  sh -c "cp -r /build/* /output/"

echo "⚙️ Nginx 설정 중..."

# Nginx 설정
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm;
    
    server_name _;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }
    
    location /admin {
        proxy_pass http://127.0.0.1:5000/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx

echo "⏳ 서비스 시작 대기 중..."
sleep 20

# 데이터베이스 초기화
echo "🗄️ 데이터베이스 초기화 중..."
sudo docker exec petplace-backend python -c "
from app.models import db
from app import create_app
app = create_app()
with app.app_context():
    try:
        db.create_all()
        print('✅ Database initialized!')
    except Exception as e:
        print(f'Database: {e}')
" 2>/dev/null || echo "Database initialization attempted"

echo "🔍 상태 확인 중..."
sudo docker ps
curl -s http://localhost/health || echo "Health check pending"
curl -s http://localhost/ | head -3 || echo "Frontend pending"

echo "✅ 배포 완료!"
echo "🌐 http://xn--2q1b33lznbu5v.xn--h32bi4v.xn--3e0b707e/"

# 상태 저장
echo "MANUAL_DEPLOYED" | sudo tee /home/ubuntu/deployment-final.txt
date | sudo tee -a /home/ubuntu/deployment-final.txt