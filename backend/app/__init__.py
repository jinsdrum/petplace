from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
# import sentry_sdk
# from sentry_sdk.integrations.flask import FlaskIntegration
import redis
import os

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
cors = CORS()
limiter = Limiter(key_func=get_remote_address)
cache = Cache()

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    from config import config
    app.config.from_object(config[config_name])
    
    # Initialize Sentry for error tracking (disabled for development)
    # if app.config.get('SENTRY_DSN'):
    #     sentry_sdk.init(
    #         dsn=app.config['SENTRY_DSN'],
    #         integrations=[FlaskIntegration()],
    #         traces_sample_rate=1.0
    #     )
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'])
    limiter.init_app(app)
    cache.init_app(app, config={'CACHE_TYPE': 'redis',
                                'CACHE_REDIS_URL': app.config['REDIS_URL']})
    
    # Register blueprints
    from app.routes import auth, users, businesses, reviews, blog, admin, affiliate
    
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(businesses.bp, url_prefix='/api/businesses')
    app.register_blueprint(reviews.bp, url_prefix='/api/reviews')
    app.register_blueprint(blog.bp, url_prefix='/api/blog')
    app.register_blueprint(affiliate.bp, url_prefix='/api/affiliate')
    app.register_blueprint(admin.bp, url_prefix='/api/admin')
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has expired'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'message': 'Invalid token'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'message': 'Authorization token is required'}, 401
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'message': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'message': 'Internal server error'}, 500
    
    @app.errorhandler(413)
    def too_large(error):
        return {'message': 'File too large'}, 413
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'animal-platform-api'}
    
    # Initialize database tables
    with app.app_context():
        db.create_all()
    
    return app