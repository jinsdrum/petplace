#!/bin/bash

# GitHub을 통한 배포 스크립트
# EC2에서 wget으로 다운로드 후 실행할 수 있도록 함

echo "🚀 PetPlace ECR 최종 배포 시작..."

# 환경 설정 (AWS 자격 증명은 EC2 IAM Role 또는 환경 변수로 설정 필요)
export AWS_DEFAULT_REGION=ap-northeast-2

# 기존 서비스 정리
sudo pkill -f nginx
sudo docker stop $(sudo docker ps -q) 2>/dev/null
sudo docker rm $(sudo docker ps -aq) 2>/dev/null

# ECR 로그인
echo "ECR 로그인 중..."
aws ecr get-login-password --region ap-northeast-2 | sudo docker login --username AWS --password-stdin 365458640975.dkr.ecr.ap-northeast-2.amazonaws.com

# 작업 디렉토리 설정
sudo rm -rf /var/www/petplace
sudo mkdir -p /var/www/petplace
cd /var/www/petplace

# ECR에서 이미지 직접 실행
echo "백엔드 컨테이너 시작..."
sudo docker run -d --name petplace-backend \
  -p 5000:5000 \
  -e FLASK_ENV=production \
  -e DATABASE_URL=postgresql://petplace_admin:PetPlace2025!@petplace-db.cpuw4w8giin7.ap-northeast-2.rds.amazonaws.com:5432/petplace \
  -e JWT_SECRET_KEY=petplace-jwt-secret-2025 \
  -e SECRET_KEY=petplace-secret-key-2025 \
  --restart unless-stopped \
  365458640975.dkr.ecr.ap-northeast-2.amazonaws.com/petplace-backend:latest

echo "프론트엔드 빌드 추출..."
sudo docker run --rm -v /var/www/html:/output \
  365458640975.dkr.ecr.ap-northeast-2.amazonaws.com/petplace-frontend:latest \
  sh -c "cp -r /build/* /output/"

# Nginx 설정
echo "Nginx 설정 중..."
sudo tee /etc/nginx/sites-available/petplace > /dev/null <<'EOF'
server {
    listen 80;
    server_name xn--2q1b33lznbu5v.xn--h32bi4v.xn--3e0b707e 13.209.242.211 localhost;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
    }
    
    location /health {
        proxy_pass http://localhost:5000/health;
    }
    
    location /admin {
        proxy_pass http://localhost:5000/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Nginx 활성화
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/petplace /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "서비스 시작 대기..."
sleep 30

echo "데이터베이스 초기화..."
sudo docker exec petplace-backend python -c "
from app.models import db
from app import create_app
app = create_app()
with app.app_context():
    db.create_all()
    print('Database initialized!')
" 2>/dev/null

echo "상태 확인..."
sudo docker ps
curl -s http://localhost/health || echo "Health check pending"

echo "✅ 배포 완료!"
echo "🌐 http://xn--2q1b33lznbu5v.xn--h32bi4v.xn--3e0b707e/"