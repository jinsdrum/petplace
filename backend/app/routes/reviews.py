from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc, and_
from sqlalchemy.orm import joinedload
from app import db
from app.models import Review, Business, User
from datetime import datetime
import uuid

bp = Blueprint('reviews', __name__)

@bp.route('/reviews', methods=['POST'])
@jwt_required()
def create_review():
    """Create a new review"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['business_id', 'rating', 'content']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate rating
        rating = data.get('rating')
        if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            return jsonify({
                'success': False,
                'message': 'Rating must be between 1 and 5'
            }), 400
        
        # Check if business exists
        business = Business.query.get(data['business_id'])
        if not business:
            return jsonify({
                'success': False,
                'message': 'Business not found'
            }), 404
        
        # Check if user already reviewed this business
        existing_review = Review.query.filter_by(
            user_id=user_id,
            business_id=data['business_id']
        ).first()
        
        if existing_review:
            return jsonify({
                'success': False,
                'message': 'You have already reviewed this business'
            }), 400
        
        # Create review
        review = Review(
            id=str(uuid.uuid4()),
            user_id=user_id,
            business_id=data['business_id'],
            rating=float(rating),
            content=data['content'],
            pet_type=data.get('pet_type'),
            visit_date=datetime.fromisoformat(data['visit_date']) if data.get('visit_date') else None,
            recommendation=data.get('recommendation'),
            images=data.get('images', []),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(review)
        
        # Update business average rating
        business.update_rating()
        
        db.session.commit()
        
        # Load review with user data for response
        review = Review.query.options(
            joinedload(Review.user),
            joinedload(Review.business)
        ).get(review.id)
        
        return jsonify({
            'success': True,
            'message': 'Review created successfully',
            'data': {
                'review': review.to_dict()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating review: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@bp.route('/reviews/<review_id>', methods=['PUT'])
@jwt_required()
def update_review(review_id):
    """Update an existing review"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Find review
        review = Review.query.filter_by(
            id=review_id,
            user_id=user_id
        ).first()
        
        if not review:
            return jsonify({
                'success': False,
                'message': 'Review not found or you do not have permission to edit it'
            }), 404
        
        # Update fields
        if 'rating' in data:
            rating = data['rating']
            if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
                return jsonify({
                    'success': False,
                    'message': 'Rating must be between 1 and 5'
                }), 400
            review.rating = float(rating)
        
        if 'content' in data:
            review.content = data['content']
        
        if 'pet_type' in data:
            review.pet_type = data['pet_type']
        
        if 'visit_date' in data:
            review.visit_date = datetime.fromisoformat(data['visit_date']) if data['visit_date'] else None
        
        if 'recommendation' in data:
            review.recommendation = data['recommendation']
        
        if 'images' in data:
            review.images = data['images']
        
        review.updated_at = datetime.utcnow()
        
        # Update business average rating
        business = Business.query.get(review.business_id)
        business.update_rating()
        
        db.session.commit()
        
        # Load review with user data for response
        review = Review.query.options(
            joinedload(Review.user),
            joinedload(Review.business)
        ).get(review.id)
        
        return jsonify({
            'success': True,
            'message': 'Review updated successfully',
            'data': {
                'review': review.to_dict()
            }
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating review: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@bp.route('/reviews/<review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    """Delete a review"""
    try:
        user_id = get_jwt_identity()
        
        # Find review
        review = Review.query.filter_by(
            id=review_id,
            user_id=user_id
        ).first()
        
        if not review:
            return jsonify({
                'success': False,
                'message': 'Review not found or you do not have permission to delete it'
            }), 404
        
        business_id = review.business_id
        
        # Delete review
        db.session.delete(review)
        
        # Update business average rating
        business = Business.query.get(business_id)
        business.update_rating()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Review deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting review: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@bp.route('/businesses/<business_id>/reviews', methods=['GET'])
def get_business_reviews(business_id):
    """Get reviews for a specific business"""
    try:
        # Check if business exists
        business = Business.query.get(business_id)
        if not business:
            return jsonify({
                'success': False,
                'message': 'Business not found'
            }), 404
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        
        # Sorting
        sort_by = request.args.get('sort_by', 'newest')  # newest, oldest, rating_high, rating_low
        
        # Build query
        query = Review.query.filter_by(business_id=business_id).options(
            joinedload(Review.user)
        )
        
        # Apply sorting
        if sort_by == 'newest':
            query = query.order_by(desc(Review.created_at))
        elif sort_by == 'oldest':
            query = query.order_by(Review.created_at)
        elif sort_by == 'rating_high':
            query = query.order_by(desc(Review.rating), desc(Review.created_at))
        elif sort_by == 'rating_low':
            query = query.order_by(Review.rating, desc(Review.created_at))
        
        # Pagination
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        reviews = [review.to_dict() for review in pagination.items]
        
        # Calculate rating distribution
        rating_distribution = {
            '5': Review.query.filter_by(business_id=business_id, rating=5).count(),
            '4': Review.query.filter_by(business_id=business_id, rating=4).count(),
            '3': Review.query.filter_by(business_id=business_id, rating=3).count(),
            '2': Review.query.filter_by(business_id=business_id, rating=2).count(),
            '1': Review.query.filter_by(business_id=business_id, rating=1).count(),
        }
        
        return jsonify({
            'success': True,
            'data': {
                'reviews': reviews,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                },
                'rating_distribution': rating_distribution,
                'average_rating': business.average_rating,
                'total_reviews': business.review_count
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting business reviews: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@bp.route('/users/<user_id>/reviews', methods=['GET'])
def get_user_reviews(user_id):
    """Get reviews by a specific user"""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        
        # Build query
        query = Review.query.filter_by(user_id=user_id).options(
            joinedload(Review.business)
        ).order_by(desc(Review.created_at))
        
        # Pagination
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        reviews = [review.to_dict() for review in pagination.items]
        
        return jsonify({
            'success': True,
            'data': {
                'reviews': reviews,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting user reviews: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@bp.route('/reviews/<review_id>', methods=['GET'])
def get_review(review_id):
    """Get a specific review"""
    try:
        review = Review.query.options(
            joinedload(Review.user),
            joinedload(Review.business)
        ).get(review_id)
        
        if not review:
            return jsonify({
                'success': False,
                'message': 'Review not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'review': review.to_dict()
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting review: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@bp.route('/reviews', methods=['GET'])
def get_all_reviews():
    """Get all reviews (for admin or general listing)"""
    try:
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Filters
        business_id = request.args.get('business_id')
        user_id = request.args.get('user_id')
        min_rating = request.args.get('min_rating', type=float)
        max_rating = request.args.get('max_rating', type=float)
        
        # Build query
        query = Review.query.options(
            joinedload(Review.user),
            joinedload(Review.business)
        )
        
        # Apply filters
        if business_id:
            query = query.filter(Review.business_id == business_id)
        
        if user_id:
            query = query.filter(Review.user_id == user_id)
        
        if min_rating is not None:
            query = query.filter(Review.rating >= min_rating)
        
        if max_rating is not None:
            query = query.filter(Review.rating <= max_rating)
        
        # Order by newest first
        query = query.order_by(desc(Review.created_at))
        
        # Pagination
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        reviews = [review.to_dict() for review in pagination.items]
        
        return jsonify({
            'success': True,
            'data': {
                'reviews': reviews,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting reviews: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500