from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
import uuid

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    nickname = db.Column(db.String(50), unique=True, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    profile_image = db.Column(db.String(255), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    
    # 권한 및 역할
    role = db.Column(db.Enum('user', 'business', 'admin', 'moderator', name='user_roles'), 
                     default='user', nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_premium = db.Column(db.Boolean, default=False, nullable=False)
    
    # 소셜 로그인
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    kakao_id = db.Column(db.String(100), unique=True, nullable=True)
    naver_id = db.Column(db.String(100), unique=True, nullable=True)
    
    # 반려동물 정보
    pet_types = db.Column(db.JSON, nullable=True)  # ['dog', 'cat'] 등
    
    # 위치 정보
    address = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # 설정
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=True)
    marketing_consent = db.Column(db.Boolean, default=False)
    
    # 타임스탬프
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = db.Column(db.DateTime, nullable=True)
    
    # 관계 정의
    businesses = db.relationship('Business', backref='owner', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    blog_posts = db.relationship('BlogPost', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """비밀번호 해시 설정"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """비밀번호 확인"""
        return check_password_hash(self.password_hash, password)
    
    def generate_tokens(self):
        """JWT 토큰 생성"""
        access_token = create_access_token(
            identity=self.id,
            additional_claims={
                'email': self.email,
                'role': self.role,
                'name': self.name
            }
        )
        refresh_token = create_refresh_token(identity=self.id)
        return {
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    
    def to_dict(self, include_sensitive=False):
        """사용자 정보를 딕셔너리로 변환"""
        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'nickname': self.nickname,
            'phone': self.phone,
            'profile_image': self.profile_image,
            'bio': self.bio,
            'role': self.role,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'is_premium': self.is_premium,
            'pet_types': self.pet_types,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
        
        if include_sensitive:
            data.update({
                'email_notifications': self.email_notifications,
                'push_notifications': self.push_notifications,
                'marketing_consent': self.marketing_consent,
                'latitude': self.latitude,
                'longitude': self.longitude
            })
        
        return data
    
    @staticmethod
    def find_by_email(email):
        """이메일로 사용자 찾기"""
        return User.query.filter_by(email=email).first()
    
    @staticmethod
    def find_by_social_id(provider, social_id):
        """소셜 ID로 사용자 찾기"""
        if provider == 'google':
            return User.query.filter_by(google_id=social_id).first()
        elif provider == 'kakao':
            return User.query.filter_by(kakao_id=social_id).first()
        elif provider == 'naver':
            return User.query.filter_by(naver_id=social_id).first()
        return None