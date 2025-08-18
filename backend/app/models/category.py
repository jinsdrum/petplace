from app import db
from datetime import datetime
import uuid

class Category(db.Model):
    """카테고리 관리 (사업체, 블로그 등)"""
    __tablename__ = 'categories'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=True)
    
    # 기본 정보
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    
    # 타입 (사업체, 블로그, 제품 등)
    category_type = db.Column(db.Enum('business', 'blog', 'product', 'pet', name='category_types'), 
                             nullable=False, index=True)
    
    # 표시 정보
    icon = db.Column(db.String(100), nullable=True)
    color = db.Column(db.String(7), nullable=True)  # HEX 색상
    image = db.Column(db.String(255), nullable=True)
    
    # 순서 및 상태
    order_index = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_featured = db.Column(db.Boolean, default=False, nullable=False)
    
    # SEO
    meta_title = db.Column(db.String(100), nullable=True)
    meta_description = db.Column(db.String(200), nullable=True)
    
    # 통계
    item_count = db.Column(db.Integer, default=0, nullable=False)  # 해당 카테고리 아이템 수
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계 정의
    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]), 
                              lazy='dynamic', cascade='all, delete-orphan')
    
    # 인덱스
    __table_args__ = (
        db.Index('idx_category_type_active', 'category_type', 'is_active'),
        db.Index('idx_category_parent_order', 'parent_id', 'order_index'),
    )
    
    def __repr__(self):
        return f'<Category {self.name}>'
    
    def to_dict(self, include_children=False, include_stats=False):
        """카테고리를 딕셔너리로 변환"""
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'category_type': self.category_type,
            'icon': self.icon,
            'color': self.color,
            'image': self.image,
            'order_index': self.order_index,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_children:
            data['children'] = [child.to_dict() for child in self.children.filter_by(is_active=True).order_by(Category.order_index)]
        
        if include_stats:
            data['item_count'] = self.item_count
        
        return data
    
    def get_full_path(self):
        """전체 경로 반환 (예: 부모 > 자식)"""
        path = [self.name]
        current = self.parent
        while current:
            path.insert(0, current.name)
            current = current.parent
        return ' > '.join(path)
    
    def update_item_count(self):
        """아이템 수 업데이트"""
        if self.category_type == 'business':
            from app.models.business import Business
            count = Business.query.filter_by(category=self.slug, status='approved').count()
        elif self.category_type == 'blog':
            from app.models.blog_post import BlogPost
            count = BlogPost.query.filter_by(category=self.slug, status='published').count()
        else:
            count = 0
        
        self.item_count = count
        db.session.commit()
    
    @staticmethod
    def get_by_type(category_type, parent_only=False):
        """타입별 카테고리 조회"""
        query = Category.query.filter_by(category_type=category_type, is_active=True)
        
        if parent_only:
            query = query.filter_by(parent_id=None)
        
        return query.order_by(Category.order_index).all()
    
    @staticmethod
    def get_hierarchy(category_type):
        """계층 구조로 카테고리 조회"""
        parents = Category.query.filter_by(
            category_type=category_type,
            parent_id=None,
            is_active=True
        ).order_by(Category.order_index).all()
        
        return [parent.to_dict(include_children=True) for parent in parents]


class Tag(db.Model):
    """태그 관리"""
    __tablename__ = 'tags'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # 기본 정보
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    slug = db.Column(db.String(60), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    
    # 타입 (블로그, 리뷰 등)
    tag_type = db.Column(db.Enum('blog', 'review', 'business', 'general', name='tag_types'), 
                        nullable=False, index=True)
    
    # 색상 및 스타일
    color = db.Column(db.String(7), nullable=True)  # HEX 색상
    
    # 통계
    usage_count = db.Column(db.Integer, default=0, nullable=False)
    
    # 상태
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_trending = db.Column(db.Boolean, default=False, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 인덱스
    __table_args__ = (
        db.Index('idx_tag_type_usage', 'tag_type', 'usage_count'),
        db.Index('idx_tag_trending', 'is_trending', 'usage_count'),
    )
    
    def __repr__(self):
        return f'<Tag {self.name}>'
    
    def to_dict(self):
        """태그를 딕셔너리로 변환"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'tag_type': self.tag_type,
            'color': self.color,
            'usage_count': self.usage_count,
            'is_active': self.is_active,
            'is_trending': self.is_trending,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def increment_usage(self):
        """사용 횟수 증가"""
        self.usage_count += 1
        db.session.commit()
    
    @staticmethod
    def get_or_create(name, tag_type='general'):
        """태그 조회 또는 생성"""
        from slugify import slugify
        
        tag = Tag.query.filter_by(name=name, tag_type=tag_type).first()
        if not tag:
            tag = Tag(
                name=name,
                slug=slugify(name),
                tag_type=tag_type
            )
            db.session.add(tag)
            db.session.commit()
        
        return tag
    
    @staticmethod
    def get_trending(tag_type=None, limit=10):
        """인기 태그 조회"""
        query = Tag.query.filter_by(is_active=True)
        
        if tag_type:
            query = query.filter_by(tag_type=tag_type)
        
        return query.order_by(Tag.usage_count.desc()).limit(limit).all()
    
    @staticmethod
    def search(keyword, limit=10):
        """태그 검색"""
        return Tag.query.filter(
            Tag.name.contains(keyword),
            Tag.is_active == True
        ).order_by(Tag.usage_count.desc()).limit(limit).all()