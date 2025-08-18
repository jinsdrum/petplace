from app import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import ARRAY

class AffiliateLink(db.Model):
    __tablename__ = 'affiliate_links'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blog_post_id = db.Column(db.String(36), db.ForeignKey('blog_posts.id'), nullable=False, index=True)
    
    # 제품 정보
    product_name = db.Column(db.String(300), nullable=False)
    product_description = db.Column(db.Text, nullable=True)
    product_image = db.Column(db.String(255), nullable=True)
    product_price = db.Column(db.Integer, nullable=True)  # 원 단위
    product_category = db.Column(db.String(100), nullable=True)
    
    # 제휴사 정보
    partner = db.Column(db.Enum('coupang', 'naver_shopping', 'gmarket', 'eleventh_street', 
                               'interpark', 'amazon', 'other', name='affiliate_partners'), 
                       nullable=False, index=True)
    partner_product_id = db.Column(db.String(100), nullable=True)
    
    # 링크 정보
    original_url = db.Column(db.String(500), nullable=False)
    affiliate_url = db.Column(db.String(500), nullable=False)
    short_url = db.Column(db.String(100), nullable=True)  # 단축 URL
    
    # 수수료 정보
    commission_rate = db.Column(db.Float, nullable=False)  # 0.05 = 5%
    commission_type = db.Column(db.Enum('percentage', 'fixed', name='commission_types'), 
                               default='percentage', nullable=False)
    
    # 클릭 및 전환 추적
    click_count = db.Column(db.Integer, default=0, nullable=False)
    conversion_count = db.Column(db.Integer, default=0, nullable=False)
    total_revenue = db.Column(db.Float, default=0.0, nullable=False)
    last_click_at = db.Column(db.DateTime, nullable=True)
    last_conversion_at = db.Column(db.DateTime, nullable=True)
    
    # 상태 및 설정
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_featured = db.Column(db.Boolean, default=False, nullable=False)
    priority = db.Column(db.Integer, default=0, nullable=False)  # 표시 우선순위
    
    # 타겟팅 및 분석
    target_keywords = db.Column(ARRAY(db.String), nullable=True)
    placement_context = db.Column(db.String(200), nullable=True)  # 링크가 배치된 문맥
    
    # 타임스탬프
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)  # 링크 만료 시간
    
    # 관계 정의
    clicks = db.relationship('AffiliateLinkClick', backref='affiliate_link', 
                           lazy='dynamic', cascade='all, delete-orphan')
    conversions = db.relationship('AffiliateLinkConversion', backref='affiliate_link', 
                                lazy='dynamic', cascade='all, delete-orphan')
    
    # 인덱스
    __table_args__ = (
        db.Index('idx_affiliate_partner_active', 'partner', 'is_active'),
        db.Index('idx_affiliate_blog_priority', 'blog_post_id', 'priority'),
        db.Index('idx_affiliate_revenue', 'total_revenue'),
    )
    
    def __repr__(self):
        return f'<AffiliateLink {self.product_name}>'
    
    def to_dict(self, include_stats=True):
        """제휴 링크를 딕셔너리로 변환"""
        data = {
            'id': self.id,
            'product_name': self.product_name,
            'product_description': self.product_description,
            'product_image': self.product_image,
            'product_price': self.product_price,
            'product_category': self.product_category,
            'partner': self.partner,
            'affiliate_url': self.affiliate_url,
            'short_url': self.short_url,
            'commission_rate': self.commission_rate,
            'commission_type': self.commission_type,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'priority': self.priority,
            'target_keywords': self.target_keywords,
            'placement_context': self.placement_context,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
        
        if include_stats:
            data.update({
                'click_count': self.click_count,
                'conversion_count': self.conversion_count,
                'total_revenue': self.total_revenue,
                'conversion_rate': self.get_conversion_rate(),
                'revenue_per_click': self.get_revenue_per_click(),
                'last_click_at': self.last_click_at.isoformat() if self.last_click_at else None,
                'last_conversion_at': self.last_conversion_at.isoformat() if self.last_conversion_at else None
            })
        
        return data
    
    def track_click(self, user_id=None, ip_address=None, user_agent=None, referrer=None):
        """클릭 추적"""
        click = AffiliateLinkClick(
            affiliate_link_id=self.id,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer
        )
        db.session.add(click)
        
        self.click_count += 1
        self.last_click_at = datetime.utcnow()
        db.session.commit()
        
        return click
    
    def track_conversion(self, user_id=None, order_amount=None, commission_earned=None):
        """전환 추적"""
        conversion = AffiliateLinkConversion(
            affiliate_link_id=self.id,
            user_id=user_id,
            order_amount=order_amount,
            commission_earned=commission_earned or (order_amount * self.commission_rate if order_amount else 0)
        )
        db.session.add(conversion)
        
        self.conversion_count += 1
        self.last_conversion_at = datetime.utcnow()
        if conversion.commission_earned:
            self.total_revenue += conversion.commission_earned
        
        db.session.commit()
        return conversion
    
    def get_conversion_rate(self):
        """전환율 계산"""
        if self.click_count == 0:
            return 0.0
        return round((self.conversion_count / self.click_count) * 100, 2)
    
    def get_revenue_per_click(self):
        """클릭당 수익 계산"""
        if self.click_count == 0:
            return 0.0
        return round(self.total_revenue / self.click_count, 2)
    
    def is_expired(self):
        """링크 만료 여부 확인"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    @staticmethod
    def get_top_performing(limit=10, partner=None, days=30):
        """상위 성과 링크 조회"""
        from datetime import timedelta
        
        since_date = datetime.utcnow() - timedelta(days=days)
        query = AffiliateLink.query.filter(
            AffiliateLink.is_active == True,
            AffiliateLink.last_click_at >= since_date
        )
        
        if partner:
            query = query.filter(AffiliateLink.partner == partner)
        
        return query.order_by(AffiliateLink.total_revenue.desc()).limit(limit).all()
    
    @staticmethod
    def generate_short_url(original_url):
        """단축 URL 생성 (실제 구현 시 외부 서비스 사용)"""
        import hashlib
        hash_object = hashlib.md5(original_url.encode())
        return f"pet.ly/{hash_object.hexdigest()[:8]}"


class AffiliateLinkClick(db.Model):
    """제휴 링크 클릭 추적"""
    __tablename__ = 'affiliate_link_clicks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    affiliate_link_id = db.Column(db.String(36), db.ForeignKey('affiliate_links.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    # 클릭 정보
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    referrer = db.Column(db.String(500), nullable=True)
    
    # 위치 정보 (IP 기반)
    country = db.Column(db.String(50), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    
    # 디바이스 정보
    device_type = db.Column(db.String(50), nullable=True)  # mobile, desktop, tablet
    browser = db.Column(db.String(50), nullable=True)
    os = db.Column(db.String(50), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # 인덱스
    __table_args__ = (
        db.Index('idx_click_link_date', 'affiliate_link_id', 'created_at'),
        db.Index('idx_click_user_date', 'user_id', 'created_at'),
    )


class AffiliateLinkConversion(db.Model):
    """제휴 링크 전환 추적"""
    __tablename__ = 'affiliate_link_conversions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    affiliate_link_id = db.Column(db.String(36), db.ForeignKey('affiliate_links.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    # 주문 정보
    order_id = db.Column(db.String(100), nullable=True)
    order_amount = db.Column(db.Float, nullable=True)
    commission_earned = db.Column(db.Float, nullable=False)
    
    # 상태
    status = db.Column(db.Enum('pending', 'confirmed', 'cancelled', name='conversion_status'), 
                      default='pending', nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    
    # 인덱스
    __table_args__ = (
        db.Index('idx_conversion_link_date', 'affiliate_link_id', 'created_at'),
        db.Index('idx_conversion_status', 'status'),
    )