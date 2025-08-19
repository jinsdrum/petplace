# 🐾 펫플레이스 (PetPlace)

반려동물과 함께하는 모든 순간을 더 특별하게 만드는 종합 플랫폼

## 🚀 **라이브 서비스**
- **웹사이트**: http://13.209.242.211
- **API 엔드포인트**: http://13.209.242.211:5000
- **배포 상태**: GitHub Actions 자동 배포 활성화! 🎉

## ✨ **주요 기능**

### 🏪 **사업체 관리**
- 반려동물 친화적 업체 검색 및 필터링
- 카테고리별 분류 (카페, 식당, 병원, 미용실 등)
- 상세 정보 및 이미지 갤러리
- 운영 시간 및 위치 정보

### ⭐ **리뷰 시스템**
- 사용자 리뷰 및 평점
- 사진 첨부 지원
- 좋아요 및 댓글 기능
- 리뷰 신뢰도 시스템

### 📝 **블로그 플랫폼**
- 반려동물 관련 정보 공유
- 카테고리 및 태그 시스템
- 마크다운 에디터 지원
- 제휴 링크 통합

### 💰 **수익화 시스템**
- 제휴 마케팅 (쿠팡, 네이버)
- Google AdSense 통합
- 스폰서 콘텐츠 관리
- 수익 분석 대시보드

### 🛠️ **관리자 도구**
- 종합 관리 대시보드
- 통계 및 분석
- 콘텐츠 관리
- 사용자 관리

## 🏗️ **기술 스택**

### Frontend
- **React 18** with TypeScript
- **CSS Variables** for theming
- **React Router** for navigation
- **Responsive Design**

### Backend
- **Flask 3.0** with Python 3.11
- **PostgreSQL** database
- **JWT** authentication
- **Flask-SQLAlchemy** ORM

### DevOps
- **Docker & Docker Compose**
- **GitHub Actions** CI/CD
- **AWS EC2** hosting
- **Nginx** reverse proxy

## 🚀 **배포 방법**

### 자동 배포 (GitHub Actions)
1. GitHub에 코드 푸시
2. Actions가 자동으로 테스트 및 배포
3. AWS EC2에 자동 배포 완료

### 수동 배포 (로컬)
```bash
# 저장소 클론
git clone <repository-url>
cd animal

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# Docker Compose로 실행
docker-compose up --build -d
```

## 🔧 **개발 환경 설정**

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose

### Frontend 개발
```bash
cd frontend
npm install
npm start
```

### Backend 개발
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python run.py
```

---

**Made with ❤️ for pet lovers everywhere** 🐾