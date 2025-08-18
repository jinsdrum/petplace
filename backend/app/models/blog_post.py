from app import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import ARRAY
from slugify import slugify

class BlogPost(db.Model):
    __tablename__ = 'blog_posts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    author_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # 기본 정보
    title = db.Column(db.String(300), nullable=False, index=True)
    slug = db.Column(db.String(350), unique=True, nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.Text, nullable=True)  # 요약/미리보기
    
    # 이미지
    thumbnail = db.Column(db.String(255), nullable=True)
    featured_image = db.Column(db.String(255), nullable=True)
    gallery_images = db.Column(ARRAY(db.String), nullable=True)
    
    # 카테고리 및 태그
    category = db.Column(db.String(50), nullable=False, index=True)
    tags = db.Column(ARRAY(db.String), nullable=True, index=True)
    
    # 상태 및 발행
    status = db.Column(db.Enum('draft', 'published', 'scheduled', 'archived', name='post_status'), 
                      default='draft', nullable=False, index=True)
    is_featured = db.Column(db.Boolean, default=False, nullable=False)
    is_premium = db.Column(db.Boolean, default=False, nullable=False)
    
    # 발행 정보
    published_at = db.Column(db.DateTime, nullable=True, index=True)
    scheduled_at = db.Column(db.DateTime, nullable=True)
    
    # SEO 및 메타데이터
    meta_title = db.Column(db.String(100), nullable=True)
    meta_description = db.Column(db.String(200), nullable=True)
    meta_keywords = db.Column(ARRAY(db.String), nullable=True)
    
    # 통계
    view_count = db.Column(db.Integer, default=0, nullable=False)
    like_count = db.Column(db.Integer, default=0, nullable=False)
    comment_count = db.Column(db.Integer, default=0, nullable=False)
    share_count = db.Column(db.Integer, default=0, nullable=False)
    
    # 제휴 마케팅
    has_affiliate_links = db.Column(db.Boolean, default=False, nullable=False)
    estimated_revenue = db.Column(db.Float, default=0.0, nullable=False)
    
    # 반려동물 관련 정보
    related_pet_types = db.Column(ARRAY(db.String), nullable=True)
    related_businesses = db.Column(ARRAY(db.String), nullable=True)  # business_id 배열
    
    # 타임스탬프
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계 정의
    affiliate_links = db.relationship('AffiliateLink', backref='blog_post', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('BlogComment', backref='blog_post', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('BlogLike', backref='blog_post', lazy='dynamic', cascade='all, delete-orphan')
    
    # 인덱스
    __table_args__ = (
        db.Index('idx_blog_status_published', 'status', 'published_at'),
        db.Index('idx_blog_category_status', 'category', 'status'),
        db.Index('idx_blog_featured', 'is_featured', 'published_at'),
    )
    
    def __repr__(self):
        return f'<BlogPost {self.title}>'
    
    def __init__(self, **kwargs):
        super(BlogPost, self).__init__(**kwargs)
        if not self.slug and self.title:
            self.slug = self.generate_slug(self.title)
    
    def generate_slug(self, title):
        """제목으로부터 슬러그 생성"""
        base_slug = slugify(title, max_length=300)
        slug = base_slug
        counter = 1
        
        while BlogPost.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug
    
    def to_dict(self, include_content=True, include_author=True):
        """블로그 포스트를 딕셔너리로 변환"""
        data = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'excerpt': self.excerpt,
            'thumbnail': self.thumbnail,
            'featured_image': self.featured_image,
            'category': self.category,
            'tags': self.tags,
            'status': self.status,
            'is_featured': self.is_featured,
            'is_premium': self.is_premium,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'view_count': self.view_count,
            'like_count': self.like_count,
            'comment_count': self.comment_count,
            'share_count': self.share_count,
            'has_affiliate_links': self.has_affiliate_links,
            'related_pet_types': self.related_pet_types,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_content:
            data['content'] = self.content
            data['gallery_images'] = self.gallery_images
        
        if include_author and self.author:
            data['author'] = {
                'id': self.author.id,
                'name': self.author.name,
                'nickname': self.author.nickname,
                'profile_image': self.author.profile_image
            }
        
        return data
    
    def publish(self):
        """포스트 발행"""
        self.status = 'published'
        self.published_at = datetime.utcnow()
        db.session.commit()
    
    def increment_view(self):
        """조회수 증가"""
        self.view_count += 1
        db.session.commit()
    
    def add_like(self, user_id):
        """좋아요 추가"""
        existing = BlogLike.query.filter_by(
            blog_post_id=self.id,
            user_id=user_id
        ).first()
        
        if not existing:
            like = BlogLike(blog_post_id=self.id, user_id=user_id)
            db.session.add(like)
            self.like_count += 1
            db.session.commit()
            return True
        return False
    
    def remove_like(self, user_id):
        """좋아요 제거"""
        like = BlogLike.query.filter_by(
            blog_post_id=self.id,
            user_id=user_id
        ).first()
        
        if like:
            db.session.delete(like)
            self.like_count = max(0, self.like_count - 1)
            db.session.commit()
            return True
        return False
    
    def update_affiliate_revenue(self):
        """제휴 수익 업데이트"""
        total_revenue = sum(link.total_revenue for link in self.affiliate_links)
        self.estimated_revenue = total_revenue
        db.session.commit()
    
    @staticmethod
    def get_published_posts(category=None, tag=None, limit=20, offset=0):
        """발행된 포스트 조회"""
        query = BlogPost.query.filter_by(status='published')
        
        if category:
            query = query.filter_by(category=category)
        
        if tag:
            query = query.filter(BlogPost.tags.contains([tag]))
        
        return query.order_by(BlogPost.published_at.desc()).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_featured_posts(limit=5):
        """추천 포스트 조회"""
        return BlogPost.query.filter(
            BlogPost.status == 'published',
            BlogPost.is_featured == True
        ).order_by(BlogPost.published_at.desc()).limit(limit).all()
    
    @staticmethod
    def search_posts(keyword, limit=20):
        """포스트 검색"""
        return BlogPost.query.filter(
            BlogPost.status == 'published',
            db.or_(
                BlogPost.title.contains(keyword),
                BlogPost.content.contains(keyword),
                BlogPost.tags.contains([keyword])
            )
        ).order_by(BlogPost.published_at.desc()).limit(limit).all()


class BlogComment(db.Model):
    """블로그 댓글"""
    __tablename__ = 'blog_comments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blog_post_id = db.Column(db.String(36), db.ForeignKey('blog_posts.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    parent_id = db.Column(db.String(36), db.ForeignKey('blog_comments.id'), nullable=True)  # 대댓글용
    
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum('pending', 'approved', 'rejected', name='comment_status'), 
                      default='pending', nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계 정의
    user = db.relationship('User', backref='blog_comments')
    replies = db.relationship('BlogComment', backref=db.backref('parent', remote_side=[id]), 
                            lazy='dynamic', cascade='all, delete-orphan')


class BlogLike(db.Model):
    """블로그 좋아요"""
    __tablename__ = 'blog_likes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blog_post_id = db.Column(db.String(36), db.ForeignKey('blog_posts.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('blog_post_id', 'user_id', name='uq_blog_like'),
    )