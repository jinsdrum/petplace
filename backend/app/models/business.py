from app import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import text

class Business(db.Model):
    __tablename__ = 'businesses'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # 기본 정보
    name = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.Enum('restaurant', 'accommodation', 'veterinary', 'grooming', 
                                'park', 'shopping', 'transport', 'culture', 'sports', 
                                'education', 'other', name='business_categories'), 
                         nullable=False, index=True)
    
    # 연락처 정보
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    
    # 위치 정보
    address = db.Column(db.String(500), nullable=False)
    address_detail = db.Column(db.String(255), nullable=True)
    postal_code = db.Column(db.String(10), nullable=True)
    latitude = db.Column(db.Float, nullable=False, index=True)
    longitude = db.Column(db.Float, nullable=False, index=True)
    
    # 영업 정보
    business_hours = db.Column(db.JSON, nullable=True)  # {'mon': '09:00-18:00', ...}
    holiday_info = db.Column(db.Text, nullable=True)
    parking_available = db.Column(db.Boolean, default=False)
    wifi_available = db.Column(db.Boolean, default=False)
    outdoor_seating = db.Column(db.Boolean, default=False)
    
    # 반려동물 관련 정보
    pet_allowed_types = db.Column(ARRAY(db.String), nullable=True)  # ['dog', 'cat', ...]
    pet_size_limit = db.Column(db.String(50), nullable=True)  # 'small', 'medium', 'large', 'all'
    pet_fee = db.Column(db.Integer, nullable=True)  # 반려동물 추가 요금
    pet_facilities = db.Column(db.JSON, nullable=True)  # ['water_bowl', 'treats', 'playground']
    pet_rules = db.Column(db.Text, nullable=True)  # 반려동물 이용 규칙
    
    # 이미지
    main_image = db.Column(db.String(255), nullable=True)
    gallery_images = db.Column(ARRAY(db.String), nullable=True)
    
    # 상태 및 승인
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'suspended', name='business_status'), 
                      default='pending', nullable=False, index=True)
    is_premium = db.Column(db.Boolean, default=False, nullable=False)
    is_featured = db.Column(db.Boolean, default=False, nullable=False)
    
    # 통계
    view_count = db.Column(db.Integer, default=0, nullable=False)
    favorite_count = db.Column(db.Integer, default=0, nullable=False)
    review_count = db.Column(db.Integer, default=0, nullable=False)
    average_rating = db.Column(db.Float, default=0.0, nullable=False)
    
    # 검색 및 SEO
    search_keywords = db.Column(ARRAY(db.String), nullable=True)
    meta_title = db.Column(db.String(100), nullable=True)
    meta_description = db.Column(db.String(200), nullable=True)
    
    # 타임스탬프
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    # 관계 정의
    reviews = db.relationship('Review', backref='business', lazy='dynamic', cascade='all, delete-orphan')
    
    # 인덱스 정의 (위치 기반 검색용)
    __table_args__ = (
        db.Index('idx_business_location', 'latitude', 'longitude'),
        db.Index('idx_business_category_status', 'category', 'status'),
        db.Index('idx_business_rating', 'average_rating'),
    )
    
    def __repr__(self):
        return f'<Business {self.name}>'
    
    def to_dict(self, include_sensitive=False):
        """사업체 정보를 딕셔너리로 변환"""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'phone': self.phone,
            'website': self.website,
            'address': self.address,
            'address_detail': self.address_detail,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'business_hours': self.business_hours,
            'holiday_info': self.holiday_info,
            'parking_available': self.parking_available,
            'wifi_available': self.wifi_available,
            'outdoor_seating': self.outdoor_seating,
            'pet_allowed_types': self.pet_allowed_types,
            'pet_size_limit': self.pet_size_limit,
            'pet_fee': self.pet_fee,
            'pet_facilities': self.pet_facilities,
            'pet_rules': self.pet_rules,
            'main_image': self.main_image,
            'gallery_images': self.gallery_images,
            'status': self.status,
            'is_premium': self.is_premium,
            'is_featured': self.is_featured,
            'view_count': self.view_count,
            'favorite_count': self.favorite_count,
            'review_count': self.review_count,
            'average_rating': self.average_rating,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_sensitive:
            data.update({
                'owner_id': self.owner_id,
                'email': self.email,
                'postal_code': self.postal_code,
                'search_keywords': self.search_keywords,
                'meta_title': self.meta_title,
                'meta_description': self.meta_description,
                'approved_at': self.approved_at.isoformat() if self.approved_at else None
            })
        
        return data
    
    def update_rating(self):
        """평균 평점 업데이트"""
        reviews = self.reviews.filter_by(status='approved').all()
        if reviews:
            total_rating = sum(review.rating for review in reviews)
            self.average_rating = round(total_rating / len(reviews), 1)
            self.review_count = len(reviews)
        else:
            self.average_rating = 0.0
            self.review_count = 0
        db.session.commit()
    
    def increment_view(self):
        """조회수 증가"""
        self.view_count += 1
        db.session.commit()
    
    def get_distance_from(self, lat, lng):
        """지정된 위치로부터의 거리 계산 (km 단위)"""
        from math import radians, cos, sin, asin, sqrt
        
        # 하버사인 공식
        lat1, lng1 = radians(lat), radians(lng)
        lat2, lng2 = radians(self.latitude), radians(self.longitude)
        
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # 지구 반지름 (km)
        
        return round(c * r, 2)
    
    @staticmethod
    def search_nearby(lat, lng, radius_km=10, category=None, pet_type=None, limit=20):
        """근처 사업체 검색"""
        # PostgreSQL의 지리 함수 사용 (실제로는 PostGIS 필요)
        # 여기서는 간단한 박스 검색 사용
        lat_range = radius_km / 111.0  # 위도 1도 ≈ 111km
        lng_range = radius_km / (111.0 * cos(radians(lat)))
        
        query = Business.query.filter(
            Business.status == 'approved',
            Business.latitude.between(lat - lat_range, lat + lat_range),
            Business.longitude.between(lng - lng_range, lng + lng_range)
        )
        
        if category:
            query = query.filter(Business.category == category)
        
        if pet_type:
            query = query.filter(Business.pet_allowed_types.contains([pet_type]))
        
        return query.order_by(Business.average_rating.desc()).limit(limit).all()
    
    @staticmethod
    def get_featured():
        """추천 사업체 조회"""
        return Business.query.filter(
            Business.status == 'approved',
            Business.is_featured == True
        ).order_by(Business.average_rating.desc()).limit(10).all()
    
    def update_rating(self):
        """리뷰 기반으로 평점 업데이트"""
        from .review import Review
        from sqlalchemy import func
        
        # 평균 평점 계산
        result = db.session.query(
            func.avg(Review.rating).label('avg_rating'),
            func.count(Review.id).label('review_count')
        ).filter(Review.business_id == self.id).first()
        
        if result.avg_rating:
            self.average_rating = round(float(result.avg_rating), 2)
            self.review_count = result.review_count
        else:
            self.average_rating = 0.0
            self.review_count = 0
        
        self.updated_at = datetime.utcnow()
        
        # 업데이트된 통계로 즐겨찾기 수 갱신 (실제로는 별도 로직 필요)
        # 여기서는 단순히 기존 값 유지