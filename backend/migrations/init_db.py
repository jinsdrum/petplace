#!/usr/bin/env python3
"""
PetPlace 데이터베이스 초기화 스크립트
RDS PostgreSQL에 필요한 테이블과 인덱스를 생성합니다.
"""

import os
import sys
import logging
from datetime import datetime

# Flask 앱 경로 추가
sys.path.append('/app')

from app import create_app, db
from app.models.user import User
from app.models.business import Business
from app.models.review import Review
from app.models.blog_post import BlogPost
from app.models.category import Category
from app.models.affiliate_link import AffiliateLink
from app.models.notification import Notification

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database_tables():
    """모든 데이터베이스 테이블 생성"""
    try:
        logger.info("데이터베이스 테이블 생성 시작...")
        
        # Flask 앱 생성
        app = create_app()
        
        with app.app_context():
            # 모든 테이블 생성
            db.create_all()
            
            logger.info("✅ 모든 테이블이 성공적으로 생성되었습니다.")
            
            # 테이블 목록 출력
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            logger.info(f"생성된 테이블 목록: {tables}")
            
    except Exception as e:
        logger.error(f"❌ 데이터베이스 테이블 생성 실패: {str(e)}")
        raise

def create_initial_data():
    """초기 데이터 생성"""
    try:
        logger.info("초기 데이터 생성 시작...")
        
        app = create_app()
        
        with app.app_context():
            # 관리자 계정 생성
            admin_user = User.query.filter_by(email='admin@petplace.com').first()
            if not admin_user:
                admin_user = User(
                    email='admin@petplace.com',
                    name='PetPlace 관리자',
                    nickname='admin',
                    role='admin',
                    is_active=True,
                    is_verified=True,
                    pet_types=['dog', 'cat']
                )
                admin_user.set_password('admin123!')
                db.session.add(admin_user)
                logger.info("✅ 관리자 계정 생성됨: admin@petplace.com")
            
            # 카테고리 생성
            categories = [
                {'name': '레스토랑', 'slug': 'restaurant', 'description': '반려동물과 함께 식사할 수 있는 곳'},
                {'name': '숙박시설', 'slug': 'accommodation', 'description': '반려동물과 함께 머물 수 있는 곳'},
                {'name': '동물병원', 'slug': 'veterinary', 'description': '반려동물 진료 및 건강관리'},
                {'name': '미용실', 'slug': 'grooming', 'description': '반려동물 미용 및 관리'},
                {'name': '공원', 'slug': 'park', 'description': '반려동물과 산책할 수 있는 곳'},
                {'name': '쇼핑', 'slug': 'shopping', 'description': '반려동물 용품 및 쇼핑'},
            ]
            
            for cat_data in categories:
                category = Category.query.filter_by(slug=cat_data['slug']).first()
                if not category:
                    category = Category(
                        name=cat_data['name'],
                        slug=cat_data['slug'],
                        description=cat_data['description']
                    )
                    db.session.add(category)
                    logger.info(f"✅ 카테고리 생성됨: {cat_data['name']}")
            
            # 데이터베이스 커밋
            db.session.commit()
            logger.info("✅ 초기 데이터가 성공적으로 생성되었습니다.")
            
    except Exception as e:
        logger.error(f"❌ 초기 데이터 생성 실패: {str(e)}")
        db.session.rollback()
        raise

def create_indexes():
    """추가 인덱스 생성 (성능 최적화)"""
    try:
        logger.info("추가 인덱스 생성 시작...")
        
        app = create_app()
        
        with app.app_context():
            # PostgreSQL 확장 및 인덱스 생성
            db.engine.execute("""
                -- 전문 검색을 위한 인덱스
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_search 
                ON businesses USING gin(to_tsvector('korean', name || ' ' || COALESCE(description, '')));
                
                -- 지리적 검색을 위한 인덱스 (PostGIS 없이)
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_location_box 
                ON businesses (latitude, longitude) WHERE status = 'approved';
                
                -- 리뷰 성능 인덱스
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_business_rating 
                ON reviews (business_id, rating) WHERE status = 'approved';
                
                -- 사용자 검색 인덱스
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
                ON users (email) WHERE is_active = true;
            """)
            
            logger.info("✅ 추가 인덱스가 성공적으로 생성되었습니다.")
            
    except Exception as e:
        logger.warning(f"⚠️ 추가 인덱스 생성 실패 (무시 가능): {str(e)}")

def check_database_connection():
    """데이터베이스 연결 확인"""
    try:
        logger.info("데이터베이스 연결 확인 중...")
        
        app = create_app()
        
        with app.app_context():
            # 간단한 쿼리로 연결 확인
            result = db.engine.execute("SELECT version();")
            version = result.fetchone()[0]
            logger.info(f"✅ PostgreSQL 연결 성공: {version}")
            
            # 데이터베이스 정보 확인
            result = db.engine.execute("SELECT current_database(), current_user;")
            db_info = result.fetchone()
            logger.info(f"✅ 데이터베이스: {db_info[0]}, 사용자: {db_info[1]}")
            
    except Exception as e:
        logger.error(f"❌ 데이터베이스 연결 실패: {str(e)}")
        raise

def main():
    """메인 실행 함수"""
    try:
        logger.info("🚀 PetPlace 데이터베이스 마이그레이션 시작")
        logger.info(f"시작 시간: {datetime.now()}")
        
        # 1. 데이터베이스 연결 확인
        check_database_connection()
        
        # 2. 테이블 생성
        create_database_tables()
        
        # 3. 초기 데이터 생성
        create_initial_data()
        
        # 4. 추가 인덱스 생성
        create_indexes()
        
        logger.info("✅ 데이터베이스 마이그레이션이 성공적으로 완료되었습니다!")
        logger.info(f"완료 시간: {datetime.now()}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ 마이그레이션 실패: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)