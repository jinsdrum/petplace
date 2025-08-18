from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.user import User
from app.models.business import Business
from app.models.notification import Notification
from app.models.category import Category
from sqlalchemy import and_, or_, func
from datetime import datetime
import json

# Blueprint 생성
bp = Blueprint('businesses', __name__)

def is_admin_or_moderator():
    """관리자 또는 운영자 권한 확인"""
    claims = get_jwt()
    return claims.get('role') in ['admin', 'moderator']

def is_business_owner(business_id):
    """사업체 소유자 확인"""
    current_user_id = get_jwt_identity()
    business = Business.query.get(business_id)
    return business and business.owner_id == current_user_id

@bp.route('', methods=['GET'])
def get_businesses():
    """사업체 목록 조회"""
    try:
        # 쿼리 파라미터
        category = request.args.get('category')
        pet_type = request.args.get('pet_type')
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 10, type=int)  # km
        search = request.args.get('search', '').strip()
        status = request.args.get('status', 'approved')
        featured_only = request.args.get('featured', 'false').lower() == 'true'
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)
        
        # 기본 쿼리 (승인된 사업체만)
        query = Business.query.filter_by(status=status)
        
        # 카테고리 필터
        if category:
            query = query.filter_by(category=category)
        
        # 반려동물 타입 필터
        if pet_type:
            query = query.filter(Business.pet_allowed_types.contains([pet_type]))
        
        # 추천 사업체 필터
        if featured_only:
            query = query.filter_by(is_featured=True)
        
        # 위치 기반 검색
        if lat and lng:
            # 간단한 박스 검색 (실제로는 PostGIS 사용 권장)
            from math import cos, radians
            lat_range = radius / 111.0  # 위도 1도 ≈ 111km
            lng_range = radius / (111.0 * cos(radians(lat)))
            
            query = query.filter(
                Business.latitude.between(lat - lat_range, lat + lat_range),
                Business.longitude.between(lng - lng_range, lng + lng_range)
            )
        
        # 검색어 필터
        if search:
            search_filter = or_(
                Business.name.contains(search),
                Business.description.contains(search),
                Business.address.contains(search)
            )
            query = query.filter(search_filter)
        
        # 정렬 (평점 높은 순)
        query = query.order_by(Business.average_rating.desc(), Business.created_at.desc())
        
        # 페이지네이션
        businesses = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # 거리 계산 (위치가 제공된 경우)
        business_list = []
        for business in businesses.items:
            business_data = business.to_dict()
            if lat and lng:
                business_data['distance'] = business.get_distance_from(lat, lng)
            business_list.append(business_data)
        
        return jsonify({
            'success': True,
            'data': {
                'businesses': business_list,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': businesses.total,
                    'pages': businesses.pages,
                    'has_next': businesses.has_next,
                    'has_prev': businesses.has_prev
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"사업체 목록 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '사업체 목록 조회 중 오류가 발생했습니다.'
        }), 500

@bp.route('/<business_id>', methods=['GET'])
def get_business(business_id):
    """사업체 상세 조회"""
    try:
        business = Business.query.get(business_id)
        
        if not business:
            return jsonify({
                'success': False,
                'message': '사업체를 찾을 수 없습니다.'
            }), 404
        
        # 공개되지 않은 사업체는 소유자나 관리자만 조회 가능
        if business.status != 'approved':
            try:
                # JWT 토큰이 있는 경우에만 권한 확인
                from flask_jwt_extended import verify_jwt_in_request
                verify_jwt_in_request(optional=True)
                current_user_id = get_jwt_identity()
                
                if not current_user_id or (business.owner_id != current_user_id and not is_admin_or_moderator()):
                    return jsonify({
                        'success': False,
                        'message': '접근 권한이 없습니다.'
                    }), 403
            except:
                return jsonify({
                    'success': False,
                    'message': '접근 권한이 없습니다.'
                }), 403
        
        # 조회수 증가 (승인된 사업체만)
        if business.status == 'approved':
            business.increment_view()
        
        # 상세 정보 반환
        business_data = business.to_dict(include_sensitive=True)
        
        # 소유자 정보 추가
        if business.owner:
            business_data['owner'] = {
                'id': business.owner.id,
                'name': business.owner.name,
                'nickname': business.owner.nickname,
                'profile_image': business.owner.profile_image
            }
        
        return jsonify({
            'success': True,
            'data': business_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"사업체 상세 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '사업체 조회 중 오류가 발생했습니다.'
        }), 500

@bp.route('', methods=['POST'])
@jwt_required()
def create_business():
    """사업체 등록"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # 필수 필드 검증
        required_fields = ['name', 'category', 'address', 'latitude', 'longitude']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field}는 필수 항목입니다.'
                }), 400
        
        # 카테고리 유효성 검증
        from config import Config
        if data['category'] not in Config.BUSINESS_CATEGORIES:
            return jsonify({
                'success': False,
                'message': '유효하지 않은 카테고리입니다.'
            }), 400
        
        # 반려동물 타입 검증
        pet_allowed_types = data.get('pet_allowed_types', [])
        if pet_allowed_types:
            for pet_type in pet_allowed_types:
                if pet_type not in Config.PET_TYPES:
                    return jsonify({
                        'success': False,
                        'message': f'유효하지 않은 반려동물 타입입니다: {pet_type}'
                    }), 400
        
        # 새 사업체 생성
        business = Business(
            owner_id=current_user_id,
            name=data['name'],
            description=data.get('description'),
            category=data['category'],
            phone=data.get('phone'),
            email=data.get('email'),
            website=data.get('website'),
            address=data['address'],
            address_detail=data.get('address_detail'),
            postal_code=data.get('postal_code'),
            latitude=data['latitude'],
            longitude=data['longitude'],
            business_hours=data.get('business_hours'),
            holiday_info=data.get('holiday_info'),
            parking_available=data.get('parking_available', False),
            wifi_available=data.get('wifi_available', False),
            outdoor_seating=data.get('outdoor_seating', False),
            pet_allowed_types=pet_allowed_types,
            pet_size_limit=data.get('pet_size_limit'),
            pet_fee=data.get('pet_fee'),
            pet_facilities=data.get('pet_facilities'),
            pet_rules=data.get('pet_rules'),
            search_keywords=data.get('search_keywords', []),
            meta_title=data.get('meta_title'),
            meta_description=data.get('meta_description')
        )
        
        db.session.add(business)
        db.session.commit()
        
        # 관리자에게 승인 요청 알림 (추후 구현)
        # create_business_approval_request_notification(business.id)
        
        return jsonify({
            'success': True,
            'message': '사업체가 등록되었습니다. 승인 후 공개됩니다.',
            'data': business.to_dict(include_sensitive=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"사업체 등록 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '사업체 등록 중 오류가 발생했습니다.'
        }), 500

@bp.route('/<business_id>', methods=['PUT'])
@jwt_required()
def update_business(business_id):
    """사업체 정보 수정"""
    try:
        current_user_id = get_jwt_identity()
        business = Business.query.get(business_id)
        
        if not business:
            return jsonify({
                'success': False,
                'message': '사업체를 찾을 수 없습니다.'
            }), 404
        
        # 권한 확인 (소유자 또는 관리자)
        if business.owner_id != current_user_id and not is_admin_or_moderator():
            return jsonify({
                'success': False,
                'message': '수정 권한이 없습니다.'
            }), 403
        
        data = request.get_json()
        
        # 업데이트 가능한 필드들
        updatable_fields = [
            'name', 'description', 'phone', 'email', 'website',
            'address', 'address_detail', 'postal_code',
            'latitude', 'longitude', 'business_hours', 'holiday_info',
            'parking_available', 'wifi_available', 'outdoor_seating',
            'pet_allowed_types', 'pet_size_limit', 'pet_fee',
            'pet_facilities', 'pet_rules', 'search_keywords',
            'meta_title', 'meta_description'
        ]
        
        # 카테고리 변경 (관리자만)
        if 'category' in data and is_admin_or_moderator():
            from config import Config
            if data['category'] in Config.BUSINESS_CATEGORIES:
                business.category = data['category']
        
        # 필드 업데이트
        for field in updatable_fields:
            if field in data:
                setattr(business, field, data[field])
        
        business.updated_at = datetime.utcnow()
        
        # 승인된 사업체를 수정한 경우 재검토 상태로 변경 (중요한 정보 변경 시)
        important_fields = ['name', 'address', 'category', 'latitude', 'longitude']
        if any(field in data for field in important_fields) and business.status == 'approved':
            business.status = 'pending'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '사업체 정보가 수정되었습니다.',
            'data': business.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"사업체 수정 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '사업체 수정 중 오류가 발생했습니다.'
        }), 500

@bp.route('/<business_id>', methods=['DELETE'])
@jwt_required()
def delete_business(business_id):
    """사업체 삭제"""
    try:
        current_user_id = get_jwt_identity()
        business = Business.query.get(business_id)
        
        if not business:
            return jsonify({
                'success': False,
                'message': '사업체를 찾을 수 없습니다.'
            }), 404
        
        # 권한 확인 (소유자 또는 관리자)
        if business.owner_id != current_user_id and not is_admin_or_moderator():
            return jsonify({
                'success': False,
                'message': '삭제 권한이 없습니다.'
            }), 403
        
        # 소프트 삭제 (실제로는 상태만 변경)
        business.status = 'suspended'
        business.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '사업체가 삭제되었습니다.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"사업체 삭제 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '사업체 삭제 중 오류가 발생했습니다.'
        }), 500

@bp.route('/categories', methods=['GET'])
def get_business_categories():
    """사업체 카테고리 목록"""
    try:
        from config import Config
        
        categories = []
        for category_code in Config.BUSINESS_CATEGORIES:
            # 카테고리별 사업체 수 계산
            count = Business.query.filter_by(
                category=category_code,
                status='approved'
            ).count()
            
            categories.append({
                'code': category_code,
                'name': category_code,  # 실제로는 번역된 이름 사용
                'count': count
            })
        
        return jsonify({
            'success': True,
            'data': categories
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"카테고리 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '카테고리 조회 중 오류가 발생했습니다.'
        }), 500

@bp.route('/featured', methods=['GET'])
def get_featured_businesses():
    """추천 사업체 목록"""
    try:
        limit = min(int(request.args.get('limit', 10)), 20)
        
        businesses = Business.get_featured()[:limit]
        
        return jsonify({
            'success': True,
            'data': [business.to_dict() for business in businesses]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"추천 사업체 조회 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '추천 사업체 조회 중 오류가 발생했습니다.'
        }), 500

@bp.route('/nearby', methods=['POST'])
def get_nearby_businesses():
    """근처 사업체 검색"""
    try:
        data = request.get_json()
        lat = data.get('latitude')
        lng = data.get('longitude')
        radius = data.get('radius', 10)  # km
        category = data.get('category')
        pet_type = data.get('pet_type')
        limit = min(data.get('limit', 20), 50)
        
        if not lat or not lng:
            return jsonify({
                'success': False,
                'message': '위치 정보가 필요합니다.'
            }), 400
        
        businesses = Business.search_nearby(
            lat=lat,
            lng=lng,
            radius_km=radius,
            category=category,
            pet_type=pet_type,
            limit=limit
        )
        
        # 거리 정보 포함
        business_list = []
        for business in businesses:
            business_data = business.to_dict()
            business_data['distance'] = business.get_distance_from(lat, lng)
            business_list.append(business_data)
        
        # 거리순 정렬
        business_list.sort(key=lambda x: x['distance'])
        
        return jsonify({
            'success': True,
            'data': business_list
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"근처 사업체 검색 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '근처 사업체 검색 중 오류가 발생했습니다.'
        }), 500

@bp.route('/search', methods=['GET'])
def search_businesses():
    """사업체 검색"""
    try:
        query = request.args.get('q', '').strip()
        category = request.args.get('category')
        pet_type = request.args.get('pet_type')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)
        
        if not query or len(query) < 2:
            return jsonify({
                'success': False,
                'message': '검색어는 2자 이상 입력해야 합니다.'
            }), 400
        
        # 검색 쿼리 구성
        search_query = Business.query.filter_by(status='approved')
        
        # 텍스트 검색
        search_filter = or_(
            Business.name.contains(query),
            Business.description.contains(query),
            Business.address.contains(query)
        )
        search_query = search_query.filter(search_filter)
        
        # 추가 필터
        if category:
            search_query = search_query.filter_by(category=category)
        
        if pet_type:
            search_query = search_query.filter(Business.pet_allowed_types.contains([pet_type]))
        
        # 정렬 및 페이지네이션
        results = search_query.order_by(
            Business.average_rating.desc(),
            Business.view_count.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'businesses': [business.to_dict() for business in results.items],
                'query': query,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': results.total,
                    'pages': results.pages,
                    'has_next': results.has_next,
                    'has_prev': results.has_prev
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"사업체 검색 오류: {str(e)}")
        return jsonify({
            'success': False,
            'message': '사업체 검색 중 오류가 발생했습니다.'
        }), 500