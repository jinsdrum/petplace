from app import db
from datetime import datetime
import uuid

class Notification(db.Model):
    """알림 시스템"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # 알림 내용
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    
    # 알림 타입
    notification_type = db.Column(db.Enum('review', 'blog', 'business', 'system', 'marketing', 
                                         'security', 'affiliate', name='notification_types'), 
                                 nullable=False, index=True)
    
    # 우선순위
    priority = db.Column(db.Enum('low', 'normal', 'high', 'urgent', name='notification_priorities'), 
                        default='normal', nullable=False)
    
    # 관련 엔티티
    related_entity_type = db.Column(db.String(50), nullable=True)  # 'review', 'business', 'blog_post' 등
    related_entity_id = db.Column(db.String(36), nullable=True, index=True)
    
    # 액션 정보
    action_url = db.Column(db.String(500), nullable=True)  # 클릭 시 이동할 URL
    action_text = db.Column(db.String(100), nullable=True)  # 액션 버튼 텍스트
    
    # 상태
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    is_sent = db.Column(db.Boolean, default=False, nullable=False)
    is_email_sent = db.Column(db.Boolean, default=False, nullable=False)
    is_push_sent = db.Column(db.Boolean, default=False, nullable=False)
    
    # 메타데이터
    extra_data = db.Column(db.JSON, nullable=True)  # 추가 데이터
    
    # 타임스탬프
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)  # 알림 만료 시간
    
    # 인덱스
    __table_args__ = (
        db.Index('idx_notification_user_read', 'user_id', 'is_read'),
        db.Index('idx_notification_type_created', 'notification_type', 'created_at'),
        db.Index('idx_notification_priority', 'priority', 'created_at'),
    )
    
    def __repr__(self):
        return f'<Notification {self.title}>'
    
    def to_dict(self):
        """알림을 딕셔너리로 변환"""
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'priority': self.priority,
            'related_entity_type': self.related_entity_type,
            'related_entity_id': self.related_entity_id,
            'action_url': self.action_url,
            'action_text': self.action_text,
            'is_read': self.is_read,
            'extra_data': self.extra_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
    
    def mark_as_read(self):
        """알림을 읽음으로 표시"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
            db.session.commit()
    
    def is_expired(self):
        """알림 만료 여부 확인"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    @staticmethod
    def create_notification(user_id, title, message, notification_type='system', 
                          priority='normal', related_entity_type=None, related_entity_id=None,
                          action_url=None, action_text=None, extra_data=None, expires_at=None):
        """새 알림 생성"""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            action_url=action_url,
            action_text=action_text,
            extra_data=extra_data,
            expires_at=expires_at
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return notification
    
    @staticmethod
    def get_user_notifications(user_id, unread_only=False, notification_type=None, limit=20, offset=0):
        """사용자 알림 조회"""
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        if notification_type:
            query = query.filter_by(notification_type=notification_type)
        
        # 만료되지 않은 알림만
        now = datetime.utcnow()
        query = query.filter(
            db.or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > now
            )
        )
        
        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_unread_count(user_id):
        """읽지 않은 알림 개수"""
        now = datetime.utcnow()
        return Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).filter(
            db.or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > now
            )
        ).count()
    
    @staticmethod
    def mark_all_as_read(user_id):
        """모든 알림을 읽음으로 표시"""
        notifications = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).all()
        
        now = datetime.utcnow()
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now
        
        db.session.commit()
        return len(notifications)
    
    @staticmethod
    def create_review_notification(user_id, business_name, review_id):
        """리뷰 관련 알림 생성"""
        return Notification.create_notification(
            user_id=user_id,
            title="새로운 리뷰가 작성되었습니다",
            message=f"{business_name}에 새로운 리뷰가 작성되었습니다.",
            notification_type='review',
            related_entity_type='review',
            related_entity_id=review_id,
            action_url=f"/reviews/{review_id}",
            action_text="리뷰 보기"
        )
    
    @staticmethod
    def create_business_approval_notification(user_id, business_name, business_id, is_approved):
        """사업체 승인 관련 알림 생성"""
        if is_approved:
            title = "사업체가 승인되었습니다"
            message = f"{business_name}이(가) 승인되어 공개되었습니다."
            action_text = "사업체 보기"
        else:
            title = "사업체 승인이 거부되었습니다"
            message = f"{business_name}의 승인이 거부되었습니다. 자세한 내용을 확인해 주세요."
            action_text = "상세 보기"
        
        return Notification.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type='business',
            priority='high',
            related_entity_type='business',
            related_entity_id=business_id,
            action_url=f"/businesses/{business_id}",
            action_text=action_text
        )
    
    @staticmethod
    def create_affiliate_commission_notification(user_id, amount, product_name):
        """제휴 수수료 발생 알림 생성"""
        return Notification.create_notification(
            user_id=user_id,
            title="제휴 수수료가 발생했습니다",
            message=f"{product_name}에서 {amount:,}원의 수수료가 발생했습니다.",
            notification_type='affiliate',
            priority='normal',
            action_url="/dashboard/affiliate",
            action_text="수익 확인",
            extra_data={'amount': amount, 'product_name': product_name}
        )
    
    @staticmethod
    def cleanup_expired_notifications():
        """만료된 알림 정리"""
        now = datetime.utcnow()
        expired_count = Notification.query.filter(
            Notification.expires_at < now
        ).delete()
        
        db.session.commit()
        return expired_count