# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 업데이트 및 필요 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 파일 복사
COPY requirements.txt .

# Python 의존성 설치
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 환경 변수 설정
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# 포트 5000 노출
EXPOSE 5000

# 데이터베이스 초기화 및 애플리케이션 시작
CMD ["python", "run.py"]