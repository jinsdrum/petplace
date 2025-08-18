from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc, and_, or_
from sqlalchemy.orm import joinedload
from datetime import datetime
import json
from app import db
from app.models.blog_post import BlogPost
from app.models.tag import Tag
from app.models.affiliate_link import AffiliateLink
from app.models.user import User

bp = Blueprint('blog', __name__)

@bp.route('/posts', methods=['GET'])
def get_blog_posts():
    """블로그 포스트 목록 조회"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        tag = request.args.get('tag', '')
        sort_by = request.args.get('sort_by', 'newest')
        status = request.args.get('status', 'published')
        
        query = BlogPost.query.options(
            joinedload(BlogPost.author),
            joinedload(BlogPost.tags)
        )
        
        # Filter by status
        if status == 'published':
            query = query.filter(BlogPost.status == 'published')
        elif status == 'draft':
            query = query.filter(BlogPost.status == 'draft')
        
        # Search filter
        if search:
            query = query.filter(
                or_(
                    BlogPost.title.ilike(f'%{search}%'),
                    BlogPost.content.ilike(f'%{search}%'),
                    BlogPost.excerpt.ilike(f'%{search}%')
                )
            )
        
        # Category filter
        if category:
            query = query.filter(BlogPost.category == category)
        
        # Tag filter
        if tag:
            query = query.join(BlogPost.tags).filter(Tag.name == tag)
        
        # Sorting
        if sort_by == 'newest':
            query = query.order_by(desc(BlogPost.created_at))
        elif sort_by == 'oldest':
            query = query.order_by(BlogPost.created_at)
        elif sort_by == 'popular':
            query = query.order_by(desc(BlogPost.view_count))
        elif sort_by == 'title':
            query = query.order_by(BlogPost.title)
        
        paginated = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        posts = []
        for post in paginated.items:
            post_data = {
                'id': post.id,
                'title': post.title,
                'slug': post.slug,
                'excerpt': post.excerpt,
                'category': post.category,
                'featured_image': post.featured_image,
                'status': post.status,
                'view_count': post.view_count,
                'like_count': post.like_count,
                'created_at': post.created_at.isoformat(),
                'updated_at': post.updated_at.isoformat(),
                'author': {
                    'id': post.author.id,
                    'name': post.author.name,
                    'email': post.author.email
                } if post.author else None,
                'tags': [{'id': tag.id, 'name': tag.name} for tag in post.tags],
                'estimated_read_time': post.estimated_read_time
            }
            posts.append(post_data)
        
        return {
            'success': True,
            'data': {
                'posts': posts,
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
        return {'message': f'블로그 포스트 조회 실패: {str(e)}'}, 500

@bp.route('/posts', methods=['POST'])
@jwt_required()
def create_blog_post():
    """블로그 포스트 작성"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'content']
        for field in required_fields:
            if not data.get(field):
                return {'message': f'{field} 필드는 필수입니다.'}, 400
        
        # Generate slug from title
        import re
        slug = re.sub(r'[^\w\s-]', '', data['title'].lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        
        # Check if slug exists
        existing_post = BlogPost.query.filter_by(slug=slug).first()
        if existing_post:
            slug = f"{slug}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create new blog post
        blog_post = BlogPost(
            title=data['title'],
            slug=slug,
            content=data['content'],
            excerpt=data.get('excerpt', data['content'][:200] + '...' if len(data['content']) > 200 else data['content']),
            category=data.get('category', '일반'),
            featured_image=data.get('featured_image'),
            status=data.get('status', 'draft'),
            author_id=user_id,
            meta_title=data.get('meta_title', data['title']),
            meta_description=data.get('meta_description'),
            meta_keywords=data.get('meta_keywords')
        )
        
        # Calculate estimated read time (assuming 200 words per minute)
        word_count = len(data['content'].split())
        blog_post.estimated_read_time = max(1, round(word_count / 200))
        
        db.session.add(blog_post)
        db.session.flush()
        
        # Handle tags
        if data.get('tags'):
            for tag_name in data['tags']:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                blog_post.tags.append(tag)
        
        # Handle affiliate links
        if data.get('affiliate_links'):
            for link_data in data['affiliate_links']:
                affiliate_link = AffiliateLink(
                    product_name=link_data['product_name'],
                    product_url=link_data['product_url'],
                    affiliate_url=link_data['affiliate_url'],
                    platform=link_data.get('platform', 'coupang'),
                    commission_rate=link_data.get('commission_rate', 0.0),
                    blog_post_id=blog_post.id
                )
                db.session.add(affiliate_link)
        
        db.session.commit()
        
        return {
            'success': True,
            'data': {
                'blog_post': {
                    'id': blog_post.id,
                    'title': blog_post.title,
                    'slug': blog_post.slug,
                    'status': blog_post.status
                }
            },
            'message': '블로그 포스트가 성공적으로 작성되었습니다.'
        }, 201
        
    except Exception as e:
        db.session.rollback()
        return {'message': f'블로그 포스트 작성 실패: {str(e)}'}, 500

@bp.route('/posts/<slug>', methods=['GET'])
def get_blog_post(slug):
    """개별 블로그 포스트 조회"""
    try:
        post = BlogPost.query.options(
            joinedload(BlogPost.author),
            joinedload(BlogPost.tags),
            joinedload(BlogPost.affiliate_links)
        ).filter_by(slug=slug).first()
        
        if not post:
            return {'message': '블로그 포스트를 찾을 수 없습니다.'}, 404
        
        # Increment view count
        post.view_count += 1
        db.session.commit()
        
        post_data = {
            'id': post.id,
            'title': post.title,
            'slug': post.slug,
            'content': post.content,
            'excerpt': post.excerpt,
            'category': post.category,
            'featured_image': post.featured_image,
            'status': post.status,
            'view_count': post.view_count,
            'like_count': post.like_count,
            'estimated_read_time': post.estimated_read_time,
            'created_at': post.created_at.isoformat(),
            'updated_at': post.updated_at.isoformat(),
            'meta_title': post.meta_title,
            'meta_description': post.meta_description,
            'meta_keywords': post.meta_keywords,
            'author': {
                'id': post.author.id,
                'name': post.author.name,
                'email': post.author.email
            } if post.author else None,
            'tags': [{'id': tag.id, 'name': tag.name} for tag in post.tags],
            'affiliate_links': [{
                'id': link.id,
                'product_name': link.product_name,
                'product_url': link.product_url,
                'affiliate_url': link.affiliate_url,
                'platform': link.platform,
                'click_count': link.click_count
            } for link in post.affiliate_links]
        }
        
        return {
            'success': True,
            'data': {'post': post_data}
        }, 200
        
    except Exception as e:
        return {'message': f'블로그 포스트 조회 실패: {str(e)}'}, 500

@bp.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_blog_post(post_id):
    """블로그 포스트 수정"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        post = BlogPost.query.filter_by(id=post_id).first()
        if not post:
            return {'message': '블로그 포스트를 찾을 수 없습니다.'}, 404
        
        # Check if user is the author
        if post.author_id != user_id:
            return {'message': '수정 권한이 없습니다.'}, 403
        
        # Update fields
        if 'title' in data:
            post.title = data['title']
        if 'content' in data:
            post.content = data['content']
            # Recalculate estimated read time
            word_count = len(data['content'].split())
            post.estimated_read_time = max(1, round(word_count / 200))
        if 'excerpt' in data:
            post.excerpt = data['excerpt']
        if 'category' in data:
            post.category = data['category']
        if 'featured_image' in data:
            post.featured_image = data['featured_image']
        if 'status' in data:
            post.status = data['status']
        if 'meta_title' in data:
            post.meta_title = data['meta_title']
        if 'meta_description' in data:
            post.meta_description = data['meta_description']
        if 'meta_keywords' in data:
            post.meta_keywords = data['meta_keywords']
        
        post.updated_at = datetime.utcnow()
        
        # Update tags
        if 'tags' in data:
            post.tags.clear()
            for tag_name in data['tags']:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                post.tags.append(tag)
        
        db.session.commit()
        
        return {
            'success': True,
            'message': '블로그 포스트가 성공적으로 수정되었습니다.'
        }, 200
        
    except Exception as e:
        db.session.rollback()
        return {'message': f'블로그 포스트 수정 실패: {str(e)}'}, 500

@bp.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_blog_post(post_id):
    """블로그 포스트 삭제"""
    try:
        user_id = get_jwt_identity()
        
        post = BlogPost.query.filter_by(id=post_id).first()
        if not post:
            return {'message': '블로그 포스트를 찾을 수 없습니다.'}, 404
        
        # Check if user is the author
        if post.author_id != user_id:
            return {'message': '삭제 권한이 없습니다.'}, 403
        
        db.session.delete(post)
        db.session.commit()
        
        return {
            'success': True,
            'message': '블로그 포스트가 성공적으로 삭제되었습니다.'
        }, 200
        
    except Exception as e:
        db.session.rollback()
        return {'message': f'블로그 포스트 삭제 실패: {str(e)}'}, 500

@bp.route('/categories', methods=['GET'])
def get_blog_categories():
    """블로그 카테고리 목록 조회"""
    try:
        categories = db.session.query(BlogPost.category).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return {
            'success': True,
            'data': {'categories': category_list}
        }, 200
        
    except Exception as e:
        return {'message': f'카테고리 조회 실패: {str(e)}'}, 500

@bp.route('/tags', methods=['GET'])
def get_blog_tags():
    """블로그 태그 목록 조회"""
    try:
        tags = Tag.query.all()
        tag_list = [{'id': tag.id, 'name': tag.name} for tag in tags]
        
        return {
            'success': True,
            'data': {'tags': tag_list}
        }, 200
        
    except Exception as e:
        return {'message': f'태그 조회 실패: {str(e)}'}, 500

@bp.route('/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_blog_post(post_id):
    """블로그 포스트 좋아요"""
    try:
        post = BlogPost.query.filter_by(id=post_id).first()
        if not post:
            return {'message': '블로그 포스트를 찾을 수 없습니다.'}, 404
        
        post.like_count += 1
        db.session.commit()
        
        return {
            'success': True,
            'data': {'like_count': post.like_count},
            'message': '좋아요가 추가되었습니다.'
        }, 200
        
    except Exception as e:
        db.session.rollback()
        return {'message': f'좋아요 처리 실패: {str(e)}'}, 500