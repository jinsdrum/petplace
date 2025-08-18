#!/usr/bin/env python3
"""
애니멀 플랫폼 개발 서버 실행 스크립트
"""

import os
import sys
from flask import Flask
from flask_migrate import upgrade

# 현재 디렉토리를 Python 경로에 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from app import create_app, db

def create_database_tables(app):
    """데이터베이스 테이블 생성"""
    with app.app_context():
        try:
            # 데이터베이스 테이블 생성
            db.create_all()
            print("✅ 데이터베이스 테이블이 생성되었습니다.")
            
            # 마이그레이션 실행 (migrations 폴더가 있는 경우)
            migrations_dir = os.path.join(current_dir, 'migrations')
            if os.path.exists(migrations_dir):
                upgrade()
                print("✅ 데이터베이스 마이그레이션이 완료되었습니다.")
                
        except Exception as e:
            print(f"❌ 데이터베이스 설정 오류: {e}")

def setup_initial_data(app):
    """초기 데이터 설정"""
    with app.app_context():
        try:
            from app.models.user import User
            from app.models.category import Category
            
            # 관리자 계정이 없으면 생성
            admin_user = User.query.filter_by(email='admin@animal.com').first()
            if not admin_user:
                admin_user = User(
                    email='admin@animal.com',
                    name='관리자',
                    role='admin',
                    is_active=True,
                    is_verified=True
                )
                admin_user.set_password('admin123!')
                db.session.add(admin_user)
                print("✅ 관리자 계정이 생성되었습니다. (admin@animal.com / admin123!)")
            
            # 기본 카테고리 생성
            business_categories = [
                ('restaurant', '식당/카페', 'Restaurant & Cafe'),
                ('accommodation', '숙박시설', 'Pet-friendly Accommodation'),
                ('veterinary', '동물병원', 'Veterinary Clinic'),
                ('grooming', '미용실', 'Pet Grooming'),
                ('park', '공원/놀이터', 'Parks & Playgrounds'),
                ('shopping', '쇼핑몰/매장', 'Pet Shopping'),
                ('transport', '교통시설', 'Transportation'),
                ('culture', '문화시설', 'Cultural Facilities'),
                ('sports', '스포츠시설', 'Sports Facilities'),
                ('education', '교육시설', 'Educational Facilities'),
                ('other', '기타', 'Other Facilities')
            ]
            
            for slug, name, description in business_categories:
                existing = Category.query.filter_by(slug=slug, category_type='business').first()
                if not existing:
                    category = Category(
                        name=name,
                        slug=slug,
                        description=description,
                        category_type='business',
                        is_active=True
                    )
                    db.session.add(category)
            
            db.session.commit()
            print("✅ 기본 카테고리가 생성되었습니다.")
            
        except Exception as e:
            print(f"❌ 초기 데이터 설정 오류: {e}")
            db.session.rollback()

def main():
    """메인 실행 함수"""
    # Flask 앱 생성
    app = create_app()
    
    # 개발 환경 설정
    if not app.config.get('TESTING'):
        print("🚀 반려동물 편의시설 플랫폼 API 서버 시작")
        print(f"📍 환경: {app.config.get('ENV', 'development')}")
        print(f"🗄️ 데이터베이스: {app.config.get('SQLALCHEMY_DATABASE_URI', 'N/A')}")
        
        # 데이터베이스 및 초기 데이터 설정
        create_database_tables(app)
        setup_initial_data(app)
        
        print("\n📚 API 엔드포인트:")
        print("   POST /api/auth/register     - 회원가입")
        print("   POST /api/auth/login        - 로그인")
        print("   GET  /api/auth/me           - 현재 사용자 정보")
        print("   GET  /api/users/dashboard   - 사용자 대시보드")
        print("   GET  /health                - 서버 상태 확인")
        
        print(f"\n🌐 서버 주소: http://localhost:{app.config.get('PORT', 5000)}")
        print("🔧 개발 모드에서 실행 중... (Ctrl+C로 종료)")
    
    # 서버 실행
    try:
        app.run(
            host=app.config.get('HOST', '0.0.0.0'),
            port=app.config.get('PORT', 5000),
            debug=app.config.get('DEBUG', True),
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n👋 서버가 종료되었습니다.")
    except Exception as e:
        print(f"❌ 서버 실행 오류: {e}")

if __name__ == '__main__':
    main()