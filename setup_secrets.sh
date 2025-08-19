#!/bin/bash

# GitHub Secrets 자동 설정
TOKEN=$1
REPO="jinsdrum/petplace"

echo "🔑 GitHub Secrets 설정 중..."

# GitHub CLI로 인증
echo "$TOKEN" | gh auth login --with-token

# Secrets 설정
echo "EC2_HOST secret 설정..."
echo "13.209.242.211" | gh secret set EC2_HOST -R $REPO

echo "EC2_SSH_KEY secret 설정..."
cat petplace-key.pem | gh secret set EC2_SSH_KEY -R $REPO

echo "AWS secrets 설정..."
echo "$AWS_ACCESS_KEY_ID" | gh secret set AWS_ACCESS_KEY_ID -R $REPO
echo "$AWS_SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY -R $REPO

echo "Database secrets 설정..."
echo "your_secure_password_123" | gh secret set DB_PASSWORD -R $REPO
echo "your-super-secret-jwt-key-here-make-it-very-long-and-random" | gh secret set JWT_SECRET_KEY -R $REPO
echo "your-flask-secret-key-here-also-make-it-very-long-and-random" | gh secret set SECRET_KEY -R $REPO

echo "✅ 모든 GitHub Secrets가 설정되었습니다!"
echo ""
echo "🚀 이제 GitHub Actions에서 자동 배포가 시작됩니다:"
echo "Repository → Actions에서 배포 진행 상황 확인"
echo ""
echo "📍 배포 완료 후 접속: http://13.209.242.211"