import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration class"""
    
    # Basic Flask config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f"postgresql://{os.environ.get('DB_USER', 'petplace_admin')}:{os.environ.get('DB_PASSWORD', 'PetPlace2025!')}@{os.environ.get('DB_HOST', 'localhost')}:{os.environ.get('DB_PORT', '5432')}/{os.environ.get('DB_NAME', 'petplace')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.environ.get('SQLALCHEMY_ECHO', 'False').lower() == 'true'
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    
    # File Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or 'uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # AWS S3 Configuration
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_S3_BUCKET = os.environ.get('AWS_S3_BUCKET')
    AWS_REGION = os.environ.get('AWS_REGION') or 'ap-northeast-2'
    
    # Email Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    
    # Redis Configuration (for caching and sessions)
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # Pagination
    POSTS_PER_PAGE = 20
    BUSINESSES_PER_PAGE = 20
    REVIEWS_PER_PAGE = 10
    
    # API Rate Limiting
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_DEFAULT = "100 per hour"
    
    # Social Login
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    KAKAO_CLIENT_ID = os.environ.get('KAKAO_CLIENT_ID')
    KAKAO_CLIENT_SECRET = os.environ.get('KAKAO_CLIENT_SECRET')
    NAVER_CLIENT_ID = os.environ.get('NAVER_CLIENT_ID')
    NAVER_CLIENT_SECRET = os.environ.get('NAVER_CLIENT_SECRET')
    
    # External APIs
    GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')
    GOOGLE_PLACES_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')
    
    # Affiliate Marketing APIs
    COUPANG_PARTNER_ID = os.environ.get('COUPANG_PARTNER_ID')
    COUPANG_PARTNER_SECRET = os.environ.get('COUPANG_PARTNER_SECRET')
    NAVER_SHOPPING_CLIENT_ID = os.environ.get('NAVER_SHOPPING_CLIENT_ID')
    NAVER_SHOPPING_CLIENT_SECRET = os.environ.get('NAVER_SHOPPING_CLIENT_SECRET')
    
    # Google AdSense
    GOOGLE_ADSENSE_CLIENT_ID = os.environ.get('GOOGLE_ADSENSE_CLIENT_ID')
    GOOGLE_ADSENSE_SLOT_ID = os.environ.get('GOOGLE_ADSENSE_SLOT_ID')
    
    # Elasticsearch (for search)
    ELASTICSEARCH_URL = os.environ.get('ELASTICSEARCH_URL') or 'http://localhost:9200'
    
    # Monitoring
    SENTRY_DSN = os.environ.get('SENTRY_DSN')
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Business Categories
    BUSINESS_CATEGORIES = [
        'restaurant',      # 식당/카페
        'accommodation',   # 숙박시설
        'veterinary',      # 동물병원
        'grooming',        # 미용실
        'park',           # 공원/놀이터
        'shopping',       # 쇼핑몰/매장
        'transport',      # 교통시설
        'culture',        # 문화시설
        'sports',         # 스포츠시설
        'education',      # 교육시설
        'other'           # 기타
    ]
    
    # Pet Types
    PET_TYPES = [
        'dog',      # 강아지
        'cat',      # 고양이
        'bird',     # 새
        'rabbit',   # 토끼
        'hamster',  # 햄스터
        'fish',     # 물고기
        'reptile',  # 파충류
        'other'     # 기타
    ]
    
    # User Roles
    USER_ROLES = [
        'user',        # 일반 사용자
        'business',    # 사업자
        'admin',       # 관리자
        'moderator'    # 운영자
    ]


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    
    # Development-specific settings
    WTF_CSRF_ENABLED = False
    MAIL_SUPPRESS_SEND = True


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    WTF_CSRF_ENABLED = False
    
    # Use in-memory SQLite for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable email sending in tests
    MAIL_SUPPRESS_SEND = True
    
    # JWT settings for testing
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(minutes=10)


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Production-specific settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Force HTTPS
    PREFERRED_URL_SCHEME = 'https'
    
    # Enhanced security headers
    SEND_FILE_MAX_AGE_DEFAULT = timedelta(days=365)


class StagingConfig(Config):
    """Staging configuration"""
    DEBUG = False
    TESTING = False
    
    # Staging database
    SQLALCHEMY_DATABASE_URI = os.environ.get('STAGING_DATABASE_URL') or \
        'postgresql://animal_user:animal_pass@localhost/animal_staging_db'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'staging': StagingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])