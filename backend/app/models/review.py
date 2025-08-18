from app import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import ARRAY

class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False, index=True)
    
    # 리뷰 내용
    rating = db.Column(db.Integer, nullable=False, index=True)  # 1-5 별점
    title = db.Column(db.String(200), nullable=True)
    content = db.Column(db.Text, nullable=False)
    
    # 이미지
    images = db.Column(ARRAY(db.String), nullable=True)
    
    # 반려동물 관련 정보
    pet_type = db.Column(db.Enum('dog', 'cat', 'bird', 'rabbit', 'hamster', 
                                'fish', 'reptile', 'other', name='pet_types'), 
                        nullable=True)
    pet_size = db.Column(db.String(20), nullable=True)  # 'small', 'medium', 'large'
    visited_with_pet = db.Column(db.Boolean, default=True, nullable=False)
    
    # 상세 평가 (선택사항)
    cleanliness_rating = db.Column(db.Integer, nullable=True)  # 청결도
    service_rating = db.Column(db.Integer, nullable=True)     # 서비스
    facilities_rating = db.Column(db.Integer, nullable=True)  # 시설
    pet_friendliness_rating = db.Column(db.Integer, nullable=True)  # 반려동물 친화도
    
    # 태그 및 키워드
    tags = db.Column(ARRAY(db.String), nullable=True)  # ['좋은음식', '친절한직원', '넓은공간']
    visit_purpose = db.Column(db.String(100), nullable=True)  # '식사', '산책', '미용' 등
    
    # 상태 및 관리
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'reported', name='review_status'), 
                      default='pending', nullable=False, index=True)
    is_verified = db.Column(db.Boolean, default=False)  # 방문 인증 여부
    
    # 통계
    helpful_count = db.Column(db.Integer, default=0, nullable=False)
    report_count = db.Column(db.Integer, default=0, nullable=False)
    
    # 타임스탬프
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    visit_date = db.Column(db.Date, nullable=True)  # 실제 방문 날짜
    
    # 관계 정의
    helpful_users = db.relationship('ReviewHelpful', backref='review', lazy='dynamic', cascade='all, delete-orphan')
    reports = db.relationship('ReviewReport', backref='review', lazy='dynamic', cascade='all, delete-orphan')
    
    # 인덱스
    __table_args__ = (
        db.Index('idx_review_rating_status', 'rating', 'status'),
        db.Index('idx_review_created', 'created_at'),
        db.UniqueConstraint('user_id', 'business_id', name='uq_user_business_review'),
    )
    
    def __repr__(self):
        return f'<Review {self.id}: {self.rating}⭐>'
    
    def to_dict(self, include_user=True, include_business=False):
        """리뷰 정보를 딕셔너리로 변환"""
        data = {
            'id': self.id,
            'rating': self.rating,
            'title': self.title,
            'content': self.content,
            'images': self.images,
            'pet_type': self.pet_type,
            'pet_size': self.pet_size,
            'visited_with_pet': self.visited_with_pet,
            'cleanliness_rating': self.cleanliness_rating,
            'service_rating': self.service_rating,
            'facilities_rating': self.facilities_rating,
            'pet_friendliness_rating': self.pet_friendliness_rating,
            'tags': self.tags,
            'visit_purpose': self.visit_purpose,
            'status': self.status,
            'is_verified': self.is_verified,
            'helpful_count': self.helpful_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'visit_date': self.visit_date.isoformat() if self.visit_date else None
        }
        
        if include_user and self.author:
            data['author'] = {
                'id': self.author.id,
                'name': self.author.name,
                'nickname': self.author.nickname,
                'profile_image': self.author.profile_image
            }
        
        if include_business and self.business:
            data['business'] = {
                'id': self.business.id,
                'name': self.business.name,
                'category': self.business.category,
                'address': self.business.address
            }
        
        return data
    
    def mark_helpful(self, user_id):
        """리뷰에 도움됨 표시"""
        existing = ReviewHelpful.query.filter_by(
            review_id=self.id, 
            user_id=user_id
        ).first()
        
        if not existing:
            helpful = ReviewHelpful(review_id=self.id, user_id=user_id)
            db.session.add(helpful)
            self.helpful_count += 1
            db.session.commit()
            return True
        return False
    
    def remove_helpful(self, user_id):
        """리뷰에서 도움됨 제거"""
        helpful = ReviewHelpful.query.filter_by(
            review_id=self.id, 
            user_id=user_id
        ).first()
        
        if helpful:
            db.session.delete(helpful)
            self.helpful_count = max(0, self.helpful_count - 1)
            db.session.commit()
            return True
        return False
    
    def report_review(self, user_id, reason):
        """리뷰 신고"""
        existing = ReviewReport.query.filter_by(
            review_id=self.id,
            reporter_id=user_id
        ).first()
        
        if not existing:
            report = ReviewReport(
                review_id=self.id,
                reporter_id=user_id,
                reason=reason
            )
            db.session.add(report)
            self.report_count += 1
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def get_business_reviews(business_id, status='approved', limit=20, offset=0):
        """사업체의 리뷰 조회"""
        return Review.query.filter_by(
            business_id=business_id,
            status=status
        ).order_by(Review.created_at.desc()).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_user_reviews(user_id, limit=20, offset=0):
        """사용자의 리뷰 조회"""
        return Review.query.filter_by(
            user_id=user_id
        ).order_by(Review.created_at.desc()).offset(offset).limit(limit).all()


class ReviewHelpful(db.Model):
    """리뷰 도움됨 테이블"""
    __tablename__ = 'review_helpful'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = db.Column(db.String(36), db.ForeignKey('reviews.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('review_id', 'user_id', name='uq_review_helpful'),
    )


class ReviewReport(db.Model):
    """리뷰 신고 테이블"""
    __tablename__ = 'review_reports'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = db.Column(db.String(36), db.ForeignKey('reviews.id'), nullable=False)
    reporter_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum('pending', 'processed', 'dismissed', name='report_status'), 
                      default='pending', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('review_id', 'reporter_id', name='uq_review_report'),
    )