from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.user import User
from app.models.notification import Notification
from datetime import datetime, timedelta
import re
from email_validator import validate_email, EmailNotValidError

# Blueprint 생성
bp = Blueprint('auth', __name__)

# 이메일 유효성 검사 정규식
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

# 비밀번호 강도 검사
def validate_password(password):
    """비밀번호 유효성 검사"""
    if len(password) < 8:
        return False, "비밀번호는 최소 8자 이상이어야 합니다."
    
    if not re.search(r'[A-Za-z]', password):
        return False, "비밀번호는 영문자를 포함해야 합니다."
    
    if not re.search(r'\d', password):
        return False, "비밀번호는 숫자를 포함해야 합니다."
    
    return True, "유효한 비밀번호입니다."

@bp.route('/register', methods=['POST'])
def register():
    """회원가입"""
    try:
        data = request.get_json()
        
        # 필수 필드 검증
        required_fields = ['email', 'password', 'name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field}는 필수 항목입니다.'
                }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data['name'].strip()
        
        # 이메일 유효성 검사
        try:
            validate_email(email)
        except EmailNotValidError:
            return jsonify({
                'success': False,
                'message': '유효한 이메일 주소를 입력해 주세요.'
            }), 400
        
        # 비밀번호 강도 검사
        is_valid_password, password_message = validate_password(password)
        if not is_valid_password:
            return jsonify({
                'success': False,
                'message': password_message
            }), 400
        
        # 중복 이메일 검사
        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({
                'success': False,
                'message': '이미 등록된 이메일입니다.'
            }), 409
        
        # 닉네임 중복 검사 (선택사항)
        nickname = data.get('nickname')
        if nickname:
            existing_nickname = User.query.filter_by(nickname=nickname.strip()).first()
            if existing_nickname:
                return jsonify({
                    'success': False,
                    'message': '이미 사용 중인 닉네임입니다.'
                }), 409
        
        # 새 사용자 생성
        user = User(
            email=email,
            name=name,
            nickname=nickname.strip() if nickname else None,
            phone=data.get('phone'),
            role=data.get('role', 'user'),
            pet_types=data.get('pet_types', []),
            address=data.get('address'),
            marketing_consent=data.get('marketing_consent', False)
        )
        
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # 환영 알림 생성
        Notification.create_notification(
            user_id=user.id,
            title="회원가입을 환영합니다!",
            message=f"{user.name}님, 반려동물 편의시설 플랫폼에 오신 것을 환영합니다.",
            notification_type='system',
            action_url="/dashboard",
            action_text="시작하기"
        )
        
        # JWT 토큰 생성
        tokens = user.generate_tokens()
        
        return jsonify({
            'success': True,
            'message': '회원가입이 완료되었습니다.',
            'data': {
                'user': user.to_dict(),
                'tokens': tokens
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"회원가입 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '회원가입 중 오류가 발생했습니다.'
        }), 500

@bp.route('/login', methods=['POST'])
def login():
    """로그인"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': '이메일과 비밀번호를 입력해 주세요.'
            }), 400
        
        # 사용자 조회
        user = User.find_by_email(email)
        if not user or not user.check_password(password):
            return jsonify({
                'success': False,
                'message': '이메일 또는 비밀번호가 올바르지 않습니다.'
            }), 401
        
        # 계정 상태 확인
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': '비활성화된 계정입니다. 고객센터에 문의해 주세요.'
            }), 403
        
        # 로그인 시간 업데이트
        user.last_login_at = datetime.utcnow()
        db.session.commit()
        
        # JWT 토큰 생성
        tokens = user.generate_tokens()
        
        return jsonify({
            'success': True,
            'message': '로그인이 완료되었습니다.',
            'data': {
                'user': user.to_dict(),
                'tokens': tokens
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"로그인 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '로그인 중 오류가 발생했습니다.'
        }), 500

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """토큰 갱신"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'message': '유효하지 않은 사용자입니다.'
            }), 401
        
        # 새 액세스 토큰 생성
        new_access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'email': user.email,
                'role': user.role,
                'name': user.name
            }
        )
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': new_access_token
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"토큰 갱신 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '토큰 갱신 중 오류가 발생했습니다.'
        }), 500

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """현재 사용자 정보 조회"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': '사용자를 찾을 수 없습니다.'
            }), 404
        
        return jsonify({
            'success': True,
            'data': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"사용자 정보 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '사용자 정보 조회 중 오류가 발생했습니다.'
        }), 500

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """로그아웃 (토큰 블랙리스트 처리)"""
    try:
        # JWT 토큰을 블랙리스트에 추가하는 로직은 실제 구현에서 Redis 등을 사용
        # 여기서는 단순히 성공 응답만 반환
        
        return jsonify({
            'success': True,
            'message': '로그아웃되었습니다.'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"로그아웃 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '로그아웃 중 오류가 발생했습니다.'
        }), 500

@bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """프로필 업데이트"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': '사용자를 찾을 수 없습니다.'
            }), 404
        
        data = request.get_json()
        
        # 업데이트 가능한 필드들
        updatable_fields = [
            'name', 'nickname', 'phone', 'bio', 'address', 
            'pet_types', 'email_notifications', 'push_notifications'
        ]
        
        # 닉네임 중복 검사
        if 'nickname' in data and data['nickname'] != user.nickname:
            existing_nickname = User.query.filter_by(nickname=data['nickname']).first()
            if existing_nickname:
                return jsonify({
                    'success': False,
                    'message': '이미 사용 중인 닉네임입니다.'
                }), 409
        
        # 필드 업데이트
        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '프로필이 업데이트되었습니다.',
            'data': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"프로필 업데이트 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '프로필 업데이트 중 오류가 발생했습니다.'
        }), 500

@bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """비밀번호 변경"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': '사용자를 찾을 수 없습니다.'
            }), 404
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({
                'success': False,
                'message': '현재 비밀번호와 새 비밀번호를 입력해 주세요.'
            }), 400
        
        # 현재 비밀번호 확인
        if not user.check_password(current_password):
            return jsonify({
                'success': False,
                'message': '현재 비밀번호가 올바르지 않습니다.'
            }), 401
        
        # 새 비밀번호 유효성 검사
        is_valid_password, password_message = validate_password(new_password)
        if not is_valid_password:
            return jsonify({
                'success': False,
                'message': password_message
            }), 400
        
        # 비밀번호 변경
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # 보안 알림 생성
        Notification.create_notification(
            user_id=user.id,
            title="비밀번호가 변경되었습니다",
            message="계정의 비밀번호가 성공적으로 변경되었습니다.",
            notification_type='security',
            priority='high'
        )
        
        return jsonify({
            'success': True,
            'message': '비밀번호가 변경되었습니다.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"비밀번호 변경 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '비밀번호 변경 중 오류가 발생했습니다.'
        }), 500

@bp.route('/check-email', methods=['POST'])
def check_email():
    """이메일 중복 확인"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        
        if not email:
            return jsonify({
                'success': False,
                'message': '이메일을 입력해 주세요.'
            }), 400
        
        # 이메일 유효성 검사
        try:
            validate_email(email)
        except EmailNotValidError:
            return jsonify({
                'success': False,
                'message': '유효한 이메일 주소를 입력해 주세요.'
            }), 400
        
        # 중복 확인
        existing_user = User.find_by_email(email)
        is_available = existing_user is None
        
        return jsonify({
            'success': True,
            'data': {
                'email': email,
                'is_available': is_available
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"이메일 중복 확인 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '이메일 확인 중 오류가 발생했습니다.'
        }), 500

@bp.route('/check-nickname', methods=['POST'])
def check_nickname():
    """닉네임 중복 확인"""
    try:
        data = request.get_json()
        nickname = data.get('nickname', '').strip()
        
        if not nickname:
            return jsonify({
                'success': False,
                'message': '닉네임을 입력해 주세요.'
            }), 400
        
        if len(nickname) < 2 or len(nickname) > 20:
            return jsonify({
                'success': False,
                'message': '닉네임은 2~20자 사이여야 합니다.'
            }), 400
        
        # 중복 확인
        existing_user = User.query.filter_by(nickname=nickname).first()
        is_available = existing_user is None
        
        return jsonify({
            'success': True,
            'data': {
                'nickname': nickname,
                'is_available': is_available
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"닉네임 중복 확인 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '닉네임 확인 중 오류가 발생했습니다.'
        }), 500