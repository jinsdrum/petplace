import React, { useState } from 'react';
import { Business } from '../../services/api';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

interface ReviewSectionProps {
  business: Business;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ business }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewKey, setReviewKey] = useState(0); // For triggering review list refresh

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setReviewKey(prev => prev + 1); // Trigger review list refresh
  };

  const isLoggedIn = !!localStorage.getItem('access_token');

  return (
    <div>
      {/* Header with Write Review Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          margin: 0,
          color: 'var(--gray-900)'
        }}>
          💬 리뷰
        </h2>

        {isLoggedIn && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="btn btn-primary"
          >
            ✍️ 리뷰 작성
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div style={{ marginBottom: '2rem' }}>
          <ReviewForm
            businessId={business.id}
            businessName={business.name}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Login Prompt */}
      {!isLoggedIn && (
        <div style={{
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--border-radius-md)',
          padding: '1rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--primary-700)',
            marginBottom: '0.5rem'
          }}>
            리뷰를 작성하시려면 로그인이 필요합니다
          </div>
          <a
            href="/login"
            className="btn btn-primary btn-sm"
          >
            로그인하기
          </a>
        </div>
      )}

      {/* Review List */}
      <ReviewList
        key={reviewKey}
        businessId={business.id}
        onReviewAdded={() => setReviewKey(prev => prev + 1)}
      />
    </div>
  );
};

export default ReviewSection;