#!/usr/bin/env python3
"""
Simple script to approve pending businesses for demo purposes
"""
import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.business import Business

def approve_businesses():
    """Approve all pending businesses"""
    app = create_app()
    
    with app.app_context():
        # Find all pending businesses
        pending_businesses = Business.query.filter_by(status='pending').all()
        
        print(f"Found {len(pending_businesses)} pending businesses")
        
        for business in pending_businesses:
            business.status = 'approved'
            business.approved_at = datetime.utcnow()
            business.is_featured = True  # Make them featured for demo
            business.average_rating = 4.5  # Add demo rating
            business.review_count = 12  # Add demo review count
            business.view_count = 156  # Add demo view count
            print(f"Approved: {business.name}")
        
        # Commit changes
        db.session.commit()
        print("All businesses approved successfully!")

if __name__ == '__main__':
    approve_businesses()