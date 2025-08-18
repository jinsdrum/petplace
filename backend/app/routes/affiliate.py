from flask import Blueprint, request, jsonify, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc, and_
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
import requests
import json
from app import db
from app.models.affiliate_link import AffiliateLink
from app.models.blog_post import BlogPost
from app.models.user import User

bp = Blueprint('affiliate', __name__)

@bp.route('/links', methods=['GET'])
@jwt_required()
def get_affiliate_links():
    """사용자의 제휴 링크 목록 조회"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 50)
        platform = request.args.get('platform', '')
        
        query = AffiliateLink.query.options(
            joinedload(AffiliateLink.blog_post)
        ).join(BlogPost).filter(BlogPost.author_id == user_id)
        
        if platform:
            query = query.filter(AffiliateLink.platform == platform)
        
        query = query.order_by(desc(AffiliateLink.created_at))
        
        paginated = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        links = []
        for link in paginated.items:
            link_data = {
                'id': link.id,
                'product_name': link.product_name,
                'product_url': link.product_url,
                'affiliate_url': link.affiliate_url,
                'platform': link.platform,
                'commission_rate': link.commission_rate,
                'click_count': link.click_count,
                'conversion_count': link.conversion_count,
                'total_earnings': link.total_earnings,
                'created_at': link.created_at.isoformat(),
                'blog_post': {
                    'id': link.blog_post.id,
                    'title': link.blog_post.title,
                    'slug': link.blog_post.slug
                } if link.blog_post else None
            }
            links.append(link_data)
        
        return {
            'success': True,
            'data': {
                'links': links,
                'pagination': {
                    'page': paginated.page,
                    'pages': paginated.pages,
                    'per_page': paginated.per_page,
                    'total': paginated.total,
                    'has_next': paginated.has_next,
                    'has_prev': paginated.has_prev
                }
            }
        }, 200
        
    except Exception as e:
        return {'message': f'제휴 링크 조회 실패: {str(e)}'}, 500

@bp.route('/links', methods=['POST'])
@jwt_required()
def create_affiliate_link():
    """제휴 링크 생성"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['product_name', 'product_url', 'affiliate_url', 'platform']
        for field in required_fields:
            if not data.get(field):
                return {'message': f'{field} 필드는 필수입니다.'}, 400
        
        affiliate_link = AffiliateLink(
            product_name=data['product_name'],
            product_url=data['product_url'],
            affiliate_url=data['affiliate_url'],
            platform=data['platform'],
            commission_rate=data.get('commission_rate', 0.0),
            blog_post_id=data.get('blog_post_id')
        )
        
        db.session.add(affiliate_link)
        db.session.commit()
        
        return {
            'success': True,
            'data': {
                'affiliate_link': {
                    'id': affiliate_link.id,
                    'product_name': affiliate_link.product_name,
                    'platform': affiliate_link.platform
                }
            },
            'message': '제휴 링크가 성공적으로 생성되었습니다.'
        }, 201
        
    except Exception as e:
        db.session.rollback()
        return {'message': f'제휴 링크 생성 실패: {str(e)}'}, 500

@bp.route('/links/<int:link_id>/click', methods=['POST'])
def track_affiliate_click(link_id):
    """제휴 링크 클릭 추적 및 리다이렉트"""
    try:
        link = AffiliateLink.query.filter_by(id=link_id).first()
        if not link:
            return {'message': '제휴 링크를 찾을 수 없습니다.'}, 404
        
        # Increment click count
        link.click_count += 1
        link.last_clicked_at = datetime.utcnow()
        db.session.commit()
        
        # Get client information for tracking
        user_agent = request.headers.get('User-Agent', '')
        referrer = request.headers.get('Referer', '')
        ip_address = request.remote_addr
        
        # Track click event (could be logged to analytics service)
        click_data = {
            'link_id': link.id,
            'timestamp': datetime.utcnow().isoformat(),
            'user_agent': user_agent,
            'referrer': referrer,
            'ip_address': ip_address
        }
        
        # Redirect to affiliate URL
        return redirect(link.affiliate_url, code=302)
        
    except Exception as e:
        return {'message': f'링크 추적 실패: {str(e)}'}, 500

@bp.route('/links/<int:link_id>/conversion', methods=['POST'])
def track_affiliate_conversion(link_id):
    """제휴 링크 구매 전환 추적"""
    try:
        data = request.get_json()
        
        link = AffiliateLink.query.filter_by(id=link_id).first()
        if not link:
            return {'message': '제휴 링크를 찾을 수 없습니다.'}, 404
        
        # Update conversion data
        link.conversion_count += 1
        link.total_earnings += data.get('commission_amount', 0.0)
        link.last_conversion_at = datetime.utcnow()
        
        db.session.commit()
        
        return {
            'success': True,
            'message': '전환이 성공적으로 추적되었습니다.'
        }, 200
        
    except Exception as e:
        db.session.rollback()
        return {'message': f'전환 추적 실패: {str(e)}'}, 500

@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_affiliate_stats():
    """제휴 마케팅 통계 조회"""
    try:
        user_id = get_jwt_identity()
        period = request.args.get('period', 'month')  # day, week, month, year
        
        # Calculate date range
        now = datetime.utcnow()
        if period == 'day':
            start_date = now - timedelta(days=1)
        elif period == 'week':
            start_date = now - timedelta(weeks=1)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)
        
        # Get affiliate links for user's blog posts
        links = db.session.query(AffiliateLink).join(BlogPost).filter(
            BlogPost.author_id == user_id,
            AffiliateLink.created_at >= start_date
        ).all()
        
        # Calculate statistics
        total_links = len(links)
        total_clicks = sum(link.click_count for link in links)
        total_conversions = sum(link.conversion_count for link in links)
        total_earnings = sum(link.total_earnings for link in links)
        conversion_rate = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
        
        # Platform breakdown
        platform_stats = {}
        for link in links:
            platform = link.platform
            if platform not in platform_stats:
                platform_stats[platform] = {
                    'links': 0,
                    'clicks': 0,
                    'conversions': 0,
                    'earnings': 0.0
                }
            platform_stats[platform]['links'] += 1
            platform_stats[platform]['clicks'] += link.click_count
            platform_stats[platform]['conversions'] += link.conversion_count
            platform_stats[platform]['earnings'] += link.total_earnings
        
        # Top performing links
        top_links = sorted(links, key=lambda x: x.click_count, reverse=True)[:5]
        top_links_data = []
        for link in top_links:
            top_links_data.append({
                'id': link.id,
                'product_name': link.product_name,
                'platform': link.platform,
                'clicks': link.click_count,
                'conversions': link.conversion_count,
                'earnings': link.total_earnings
            })
        
        return {
            'success': True,
            'data': {
                'period': period,
                'total_stats': {
                    'total_links': total_links,
                    'total_clicks': total_clicks,
                    'total_conversions': total_conversions,
                    'total_earnings': round(total_earnings, 2),
                    'conversion_rate': round(conversion_rate, 2)
                },
                'platform_stats': platform_stats,
                'top_links': top_links_data
            }
        }, 200
        
    except Exception as e:
        return {'message': f'통계 조회 실패: {str(e)}'}, 500

@bp.route('/products/search', methods=['GET'])
def search_affiliate_products():
    """제휴 상품 검색 (외부 API 연동)"""
    try:
        query = request.args.get('query', '')
        platform = request.args.get('platform', 'coupang')
        limit = min(request.args.get('limit', 20, type=int), 50)
        
        if not query:
            return {'message': '검색어를 입력해주세요.'}, 400
        
        products = []
        
        if platform == 'coupang':
            # Coupang Partners API integration (mock implementation)
            # In real implementation, use actual Coupang Partners API
            mock_products = [
                {
                    'id': f'coupang_{i}',
                    'name': f'{query} 관련 상품 {i+1}',
                    'price': 29900 + (i * 5000),
                    'image_url': 'https://via.placeholder.com/200x200',
                    'product_url': f'https://www.coupang.com/vp/products/{1234567+i}',
                    'affiliate_url': f'https://link.coupang.com/a/{1234567+i}',
                    'rating': 4.0 + (i % 2) * 0.5,
                    'review_count': 100 + (i * 50),
                    'commission_rate': 3.0 + (i % 3)
                }
                for i in range(min(limit, 10))
            ]
            products.extend(mock_products)
        
        elif platform == 'naver':
            # Naver Shopping API integration (mock implementation)
            mock_products = [
                {
                    'id': f'naver_{i}',
                    'name': f'{query} 네이버 상품 {i+1}',
                    'price': 25900 + (i * 3000),
                    'image_url': 'https://via.placeholder.com/200x200',
                    'product_url': f'https://shopping.naver.com/products/{7654321-i}',
                    'affiliate_url': f'https://naver.me/{7654321-i}',
                    'rating': 4.2 + (i % 2) * 0.3,
                    'review_count': 80 + (i * 30),
                    'commission_rate': 2.5 + (i % 2)
                }
                for i in range(min(limit, 8))
            ]
            products.extend(mock_products)
        
        return {
            'success': True,
            'data': {
                'query': query,
                'platform': platform,
                'products': products
            }
        }, 200
        
    except Exception as e:
        return {'message': f'상품 검색 실패: {str(e)}'}, 500

@bp.route('/products/recommend', methods=['GET'])
def get_recommended_products():
    """추천 제휴 상품 목록"""
    try:
        category = request.args.get('category', 'pet')
        limit = min(request.args.get('limit', 10, type=int), 20)
        
        # Mock recommended products based on category
        if category == 'pet':
            recommended_products = [
                {
                    'id': 'pet_food_1',
                    'name': '프리미엄 강아지 사료 15kg',
                    'price': 89000,
                    'image_url': 'https://via.placeholder.com/200x200',
                    'platform': 'coupang',
                    'commission_rate': 4.0,
                    'rating': 4.8,
                    'review_count': 1250
                },
                {
                    'id': 'pet_toy_1',
                    'name': '강아지 원목 장난감 세트',
                    'price': 24900,
                    'image_url': 'https://via.placeholder.com/200x200',
                    'platform': 'coupang',
                    'commission_rate': 5.5,
                    'rating': 4.6,
                    'review_count': 890
                },
                {
                    'id': 'pet_bed_1',
                    'name': '반려동물 온열 방석 대형',
                    'price': 35900,
                    'image_url': 'https://via.placeholder.com/200x200',
                    'platform': 'naver',
                    'commission_rate': 3.2,
                    'rating': 4.7,
                    'review_count': 567
                }
            ][:limit]
        else:
            recommended_products = []
        
        return {
            'success': True,
            'data': {
                'category': category,
                'products': recommended_products
            }
        }, 200
        
    except Exception as e:
        return {'message': f'추천 상품 조회 실패: {str(e)}'}, 500

@bp.route('/earnings/report', methods=['GET'])
@jwt_required()
def get_earnings_report():
    """수익 리포트 생성"""
    try:
        user_id = get_jwt_identity()
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = db.session.query(AffiliateLink).join(BlogPost).filter(
            BlogPost.author_id == user_id
        )
        
        if start_date:
            start_date = datetime.fromisoformat(start_date)
            query = query.filter(AffiliateLink.created_at >= start_date)
        
        if end_date:
            end_date = datetime.fromisoformat(end_date)
            query = query.filter(AffiliateLink.created_at <= end_date)
        
        links = query.all()
        
        # Generate daily earnings data
        daily_earnings = {}
        for link in links:
            if link.last_conversion_at:
                date_key = link.last_conversion_at.strftime('%Y-%m-%d')
                if date_key not in daily_earnings:
                    daily_earnings[date_key] = 0.0
                daily_earnings[date_key] += link.total_earnings
        
        # Sort by date
        sorted_earnings = sorted(daily_earnings.items())
        
        return {
            'success': True,
            'data': {
                'daily_earnings': sorted_earnings,
                'total_earnings': sum(link.total_earnings for link in links),
                'total_conversions': sum(link.conversion_count for link in links),
                'total_clicks': sum(link.click_count for link in links)
            }
        }, 200
        
    except Exception as e:
        return {'message': f'수익 리포트 생성 실패: {str(e)}'}, 500