from flask import Blueprint
from flask_jwt_extended import jwt_required
import json

# Blueprint 생성 - 기본 구조만
bp = Blueprint('admin', __name__)

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    """관리자 대시보드 - 추후 구현"""
    return {'message': 'Admin Dashboard API - 추후 구현'}, 200

@bp.route('/businesses/approve/<business_id>', methods=['PUT'])
@jwt_required()
def approve_business(business_id):
    """사업체 승인 - 추후 구현"""
    return {'message': f'Business {business_id} Approval API - 추후 구현'}, 200