#!/usr/bin/env python3
"""
PetPlace 초기 데이터 설정 스크립트
관리자 계정, 카테고리, 샘플 데이터 생성
"""

from app import create_app
from app.models import db, User, Category, PetFacility, Review
from werkzeug.security import generate_password_hash
import os

def init_database():
    app = create_app()
    
    with app.app_context():
        print("🗄️ 데이터베이스 초기화 시작...")
        
        try:
            # 테이블 생성
            db.create_all()
            print("✅ 테이블 생성 완료")
            
            # 관리자 계정 생성
            admin_email = "admin@petplace.co.kr"
            if not User.query.filter_by(email=admin_email).first():
                admin_user = User(
                    username="admin",
                    email=admin_email,
                    password_hash=generate_password_hash("PetPlace2025!"),
                    is_admin=True,
                    is_active=True
                )
                db.session.add(admin_user)
                print("✅ 관리자 계정 생성: admin@petplace.co.kr")
            
            # 기본 카테고리 생성
            categories = [
                {"name": "동물병원", "description": "반려동물 진료 및 건강관리"},
                {"name": "펜션/호텔", "description": "반려동물 숙박 시설"},
                {"name": "카페/레스토랑", "description": "반려동물 동반 가능한 식당"},
                {"name": "미용실", "description": "반려동물 미용 및 그루밍"},
                {"name": "훈련소", "description": "반려동물 교육 및 훈련"},
                {"name": "용품점", "description": "반려동물 용품 및 사료"},
                {"name": "놀이터/공원", "description": "반려동물 놀이 및 산책 공간"}
            ]
            
            for cat_data in categories:
                if not Category.query.filter_by(name=cat_data["name"]).first():
                    category = Category(
                        name=cat_data["name"],
                        description=cat_data["description"]
                    )
                    db.session.add(category)
                    print(f"✅ 카테고리 생성: {cat_data['name']}")
            
            # 샘플 펫 시설 생성
            if not PetFacility.query.first():
                sample_facilities = [
                    {
                        "name": "서울 반려동물 종합병원",
                        "description": "24시간 응급 진료 가능한 종합 동물병원입니다.",
                        "address": "서울시 강남구 테헤란로 123",
                        "phone": "02-1234-5678",
                        "category_id": 1,
                        "rating": 4.5,
                        "latitude": 37.5665,
                        "longitude": 126.9780
                    },
                    {
                        "name": "펫프렌들리 카페",
                        "description": "반려동물과 함께 즐길 수 있는 아늑한 카페입니다.",
                        "address": "서울시 홍대 와우산로 456",
                        "phone": "02-9876-5432",
                        "category_id": 3,
                        "rating": 4.2,
                        "latitude": 37.5511,
                        "longitude": 126.9220
                    }
                ]
                
                for facility_data in sample_facilities:
                    facility = PetFacility(**facility_data)
                    db.session.add(facility)
                    print(f"✅ 샘플 시설 생성: {facility_data['name']}")
            
            # 변경사항 저장
            db.session.commit()
            print("🎉 데이터베이스 초기 데이터 설정 완료!")
            
            # 통계 출력
            user_count = User.query.count()
            category_count = Category.query.count()
            facility_count = PetFacility.query.count()
            
            print(f"📊 현재 데이터:")
            print(f"   - 사용자: {user_count}명")
            print(f"   - 카테고리: {category_count}개")
            print(f"   - 시설: {facility_count}개")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ 데이터베이스 초기화 오류: {e}")
            raise e

if __name__ == "__main__":
    init_database()