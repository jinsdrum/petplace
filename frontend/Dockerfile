# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# 경량 배포 단계
FROM alpine:latest

# 빌드된 파일을 공유 볼륨으로 복사하기 위한 스크립트
COPY --from=builder /app/build /build

# 빌드 파일을 공유 볼륨에 복사하는 스크립트 생성
RUN echo '#!/bin/sh' > /copy-build.sh && \
    echo 'cp -r /build/* /var/www/html/' >> /copy-build.sh && \
    echo 'sleep 3600' >> /copy-build.sh && \
    chmod +x /copy-build.sh

# 공유 볼륨 마운트 포인트
VOLUME ["/var/www/html"]

# 스크립트 실행
CMD ["/copy-build.sh"]