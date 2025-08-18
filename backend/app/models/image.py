from app import db
from datetime import datetime
import uuid
import os

class Image(db.Model):
    """이미지 관리"""
    __tablename__ = 'images'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # 업로더 정보
    uploader_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # 파일 정보
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # bytes
    mime_type = db.Column(db.String(100), nullable=False)
    
    # 이미지 정보
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    
    # 용도 분류
    image_type = db.Column(db.Enum('profile', 'business', 'review', 'blog', 'product', 'other', 
                                  name='image_types'), nullable=False, index=True)
    
    # 관련 엔티티 ID (선택적)
    related_entity_id = db.Column(db.String(36), nullable=True, index=True)
    related_entity_type = db.Column(db.String(50), nullable=True)
    
    # 상태
    is_processed = db.Column(db.Boolean, default=False, nullable=False)
    is_optimized = db.Column(db.Boolean, default=False, nullable=False)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    
    # 썸네일 및 변형 이미지
    thumbnail_path = db.Column(db.String(500), nullable=True)
    medium_path = db.Column(db.String(500), nullable=True)
    large_path = db.Column(db.String(500), nullable=True)
    
    # 메타데이터
    alt_text = db.Column(db.String(255), nullable=True)
    caption = db.Column(db.Text, nullable=True)
    tags = db.Column(db.JSON, nullable=True)
    
    # S3 정보 (클라우드 저장 시)
    s3_bucket = db.Column(db.String(100), nullable=True)
    s3_key = db.Column(db.String(500), nullable=True)
    cdn_url = db.Column(db.String(500), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계 정의
    uploader = db.relationship('User', backref='uploaded_images')
    
    # 인덱스
    __table_args__ = (
        db.Index('idx_image_type_entity', 'image_type', 'related_entity_id'),
        db.Index('idx_image_uploader_date', 'uploader_id', 'created_at'),
        db.Index('idx_image_public', 'is_public'),
    )
    
    def __repr__(self):
        return f'<Image {self.filename}>'
    
    def to_dict(self, include_paths=True):
        """이미지 정보를 딕셔너리로 변환"""
        data = {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'width': self.width,
            'height': self.height,
            'image_type': self.image_type,
            'is_processed': self.is_processed,
            'is_optimized': self.is_optimized,
            'alt_text': self.alt_text,
            'caption': self.caption,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_paths:
            data.update({
                'url': self.get_url(),
                'thumbnail_url': self.get_thumbnail_url(),
                'medium_url': self.get_medium_url(),
                'large_url': self.get_large_url()
            })
        
        return data
    
    def get_url(self):
        """메인 이미지 URL 반환"""
        if self.cdn_url:
            return self.cdn_url
        elif self.s3_bucket and self.s3_key:
            return f"https://{self.s3_bucket}.s3.amazonaws.com/{self.s3_key}"
        else:
            return f"/uploads/{self.file_path}"
    
    def get_thumbnail_url(self):
        """썸네일 URL 반환"""
        if self.thumbnail_path:
            if self.cdn_url:
                base_url = self.cdn_url.rsplit('/', 1)[0]
                return f"{base_url}/thumb_{self.filename}"
            return f"/uploads/{self.thumbnail_path}"
        return self.get_url()
    
    def get_medium_url(self):
        """중간 크기 이미지 URL 반환"""
        if self.medium_path:
            if self.cdn_url:
                base_url = self.cdn_url.rsplit('/', 1)[0]
                return f"{base_url}/medium_{self.filename}"
            return f"/uploads/{self.medium_path}"
        return self.get_url()
    
    def get_large_url(self):
        """큰 크기 이미지 URL 반환"""
        if self.large_path:
            if self.cdn_url:
                base_url = self.cdn_url.rsplit('/', 1)[0]
                return f"{base_url}/large_{self.filename}"
            return f"/uploads/{self.large_path}"
        return self.get_url()
    
    def get_file_size_formatted(self):
        """파일 크기를 사람이 읽기 쉬운 형태로 반환"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
    
    def delete_files(self):
        """실제 파일들 삭제"""
        try:
            # 로컬 파일 삭제
            if self.file_path and os.path.exists(self.file_path):
                os.remove(self.file_path)
            
            if self.thumbnail_path and os.path.exists(self.thumbnail_path):
                os.remove(self.thumbnail_path)
            
            if self.medium_path and os.path.exists(self.medium_path):
                os.remove(self.medium_path)
            
            if self.large_path and os.path.exists(self.large_path):
                os.remove(self.large_path)
            
            # S3 파일 삭제 (구현 필요)
            if self.s3_bucket and self.s3_key:
                # boto3를 사용한 S3 삭제 로직
                pass
                
        except Exception as e:
            print(f"파일 삭제 오류: {e}")
    
    @staticmethod
    def create_from_upload(file, uploader_id, image_type='other', related_entity_id=None, related_entity_type=None):
        """업로드된 파일로부터 이미지 객체 생성"""
        from werkzeug.utils import secure_filename
        from PIL import Image as PILImage
        import uuid
        
        # 안전한 파일명 생성
        original_filename = secure_filename(file.filename)
        file_extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # 파일 저장 경로
        upload_folder = f"uploads/{image_type}"
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, unique_filename)
        
        # 파일 저장
        file.save(file_path)
        
        # 이미지 정보 추출
        file_size = os.path.getsize(file_path)
        
        try:
            with PILImage.open(file_path) as img:
                width, height = img.size
        except:
            width, height = None, None
        
        # 이미지 객체 생성
        image = Image(
            uploader_id=uploader_id,
            filename=unique_filename,
            original_filename=original_filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=file.content_type or 'image/jpeg',
            width=width,
            height=height,
            image_type=image_type,
            related_entity_id=related_entity_id,
            related_entity_type=related_entity_type
        )
        
        db.session.add(image)
        db.session.commit()
        
        return image
    
    @staticmethod
    def get_by_entity(entity_type, entity_id, limit=10):
        """특정 엔티티의 이미지들 조회"""
        return Image.query.filter_by(
            related_entity_type=entity_type,
            related_entity_id=entity_id,
            is_public=True
        ).order_by(Image.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_user_images(user_id, image_type=None, limit=20):
        """사용자가 업로드한 이미지들 조회"""
        query = Image.query.filter_by(uploader_id=user_id)
        
        if image_type:
            query = query.filter_by(image_type=image_type)
        
        return query.order_by(Image.created_at.desc()).limit(limit).all()