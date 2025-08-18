from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.notification import Notification
from datetime import datetime

# Blueprint 생성
bp = Blueprint('users', __name__)

@bp.route('/profile/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    """사용자 프로필 조회 (공개 정보)"""
    try:
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'message': '사용자를 찾을 수 없습니다.'
            }), 404
        
        # 공개 정보만 반환
        profile_data = user.to_dict(include_sensitive=False)
        
        # 추가 통계 정보
        profile_data.update({
            'business_count': user.businesses.filter_by(status='approved').count(),
            'review_count': user.reviews.filter_by(status='approved').count(),
            'blog_post_count': user.blog_posts.filter_by(status='published').count()
        })
        
        return jsonify({
            'success': True,
            'data': profile_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"사용자 프로필 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '프로필 조회 중 오류가 발생했습니다.'
        }), 500

@bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """사용자 알림 목록 조회"""
    try:
        current_user_id = get_jwt_identity()
        
        # 쿼리 파라미터
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        notification_type = request.args.get('type')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)
        
        offset = (page - 1) * per_page
        
        # 알림 조회
        notifications = Notification.get_user_notifications(
            user_id=current_user_id,
            unread_only=unread_only,
            notification_type=notification_type,
            limit=per_page,
            offset=offset
        )
        
        # 읽지 않은 알림 개수
        unread_count = Notification.get_unread_count(current_user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'notifications': [notification.to_dict() for notification in notifications],
                'unread_count': unread_count,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'has_more': len(notifications) == per_page
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"알림 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '알림 조회 중 오류가 발생했습니다.'
        }), 500

@bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """알림을 읽음으로 표시"""
    try:
        current_user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({
                'success': False,
                'message': '알림을 찾을 수 없습니다.'
            }), 404
        
        notification.mark_as_read()
        
        return jsonify({
            'success': True,
            'message': '알림을 읽음으로 표시했습니다.'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"알림 읽음 처리 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '알림 처리 중 오류가 발생했습니다.'
        }), 500

@bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """모든 알림을 읽음으로 표시"""
    try:
        current_user_id = get_jwt_identity()
        
        updated_count = Notification.mark_all_as_read(current_user_id)
        
        return jsonify({
            'success': True,
            'message': f'{updated_count}개의 알림을 읽음으로 표시했습니다.',
            'data': {
                'updated_count': updated_count
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"전체 알림 읽음 처리 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '알림 처리 중 오류가 발생했습니다.'
        }), 500

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """사용자 대시보드 데이터"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': '사용자를 찾을 수 없습니다.'
            }), 404
        
        # 사용자 통계
        stats = {
            'businesses': {
                'total': user.businesses.count(),
                'approved': user.businesses.filter_by(status='approved').count(),
                'pending': user.businesses.filter_by(status='pending').count(),
                'rejected': user.businesses.filter_by(status='rejected').count()
            },
            'reviews': {
                'total': user.reviews.count(),
                'approved': user.reviews.filter_by(status='approved').count(),
                'pending': user.reviews.filter_by(status='pending').count()
            },
            'blog_posts': {
                'total': user.blog_posts.count(),
                'published': user.blog_posts.filter_by(status='published').count(),
                'draft': user.blog_posts.filter_by(status='draft').count()
            }
        }
        
        # 최근 활동
        recent_businesses = user.businesses.order_by(db.desc('created_at')).limit(5).all()
        recent_reviews = user.reviews.order_by(db.desc('created_at')).limit(5).all()
        recent_posts = user.blog_posts.order_by(db.desc('created_at')).limit(5).all()
        
        # 읽지 않은 알림 개수
        unread_notifications = Notification.get_unread_count(current_user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(include_sensitive=True),
                'stats': stats,
                'recent_activity': {
                    'businesses': [business.to_dict() for business in recent_businesses],
                    'reviews': [review.to_dict(include_business=True) for review in recent_reviews],
                    'blog_posts': [post.to_dict(include_content=False) for post in recent_posts]
                },
                'unread_notifications': unread_notifications
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"대시보드 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '대시보드 조회 중 오류가 발생했습니다.'
        }), 500

@bp.route('/settings', methods=['GET'])
@jwt_required()
def get_user_settings():
    """사용자 설정 조회"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': '사용자를 찾을 수 없습니다.'
            }), 404
        
        settings = {
            'email_notifications': user.email_notifications,
            'push_notifications': user.push_notifications,
            'marketing_consent': user.marketing_consent,
            'profile_visibility': 'public',  # 추후 구현
            'location_sharing': True  # 추후 구현
        }
        
        return jsonify({
            'success': True,
            'data': settings
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"설정 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '설정 조회 중 오류가 발생했습니다.'
        }), 500

@bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_user_settings():
    """사용자 설정 업데이트"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': '사용자를 찾을 수 없습니다.'
            }), 404
        
        data = request.get_json()
        
        # 업데이트 가능한 설정들
        if 'email_notifications' in data:
            user.email_notifications = data['email_notifications']
        
        if 'push_notifications' in data:
            user.push_notifications = data['push_notifications']
        
        if 'marketing_consent' in data:
            user.marketing_consent = data['marketing_consent']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '설정이 업데이트되었습니다.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"설정 업데이트 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '설정 업데이트 중 오류가 발생했습니다.'
        }), 500

@bp.route('/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_account():
    """계정 비활성화"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': '사용자를 찾을 수 없습니다.'
            }), 404
        
        data = request.get_json()
        password = data.get('password')
        reason = data.get('reason', '')
        
        # 비밀번호 확인
        if not password or not user.check_password(password):
            return jsonify({
                'success': False,
                'message': '비밀번호가 올바르지 않습니다.'
            }), 401
        
        # 계정 비활성화
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # 비활성화 로그 기록 (추후 구현)
        current_app.logger.info(f"계정 비활성화: {user.email}, 사유: {reason}")
        
        return jsonify({
            'success': True,
            'message': '계정이 비활성화되었습니다.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"계정 비활성화 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '계정 비활성화 중 오류가 발생했습니다.'
        }), 500

@bp.route('/search', methods=['GET'])
def search_users():
    """사용자 검색 (공개 프로필만)"""
    try:
        query = request.args.get('q', '').strip()
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)
        
        if not query or len(query) < 2:
            return jsonify({
                'success': False,
                'message': '검색어는 2자 이상 입력해야 합니다.'
            }), 400
        
        # 사용자 검색 (이름, 닉네임)
        users = User.query.filter(
            User.is_active == True,
            db.or_(
                User.name.contains(query),
                User.nickname.contains(query)
            )
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'users': [user.to_dict() for user in users.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': users.total,
                    'pages': users.pages,
                    'has_next': users.has_next,
                    'has_prev': users.has_prev
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"사용자 검색 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '사용자 검색 중 오류가 발생했습니다.'
        }), 500