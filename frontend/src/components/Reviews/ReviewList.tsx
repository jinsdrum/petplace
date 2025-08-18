import React, { useState, useEffect } from 'react';
import { reviewAPI, Review } from '../../services/api';

interface ReviewListProps {
  businessId: string;
  onReviewAdded?: () => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ businessId, onReviewAdded }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low'>('newest');
  const [ratingDistribution, setRatingDistribution] = useState<{ [key: string]: number }>({});
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [businessId, currentPage, sortBy]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await reviewAPI.getBusinessReviews(businessId, {
        page: currentPage,
        per_page: 10,
        sort_by: sortBy
      });

      const { reviews, pagination, rating_distribution, average_rating, total_reviews } = response.data.data;
      
      setReviews(reviews);
      setTotalPages(pagination.pages);
      setRatingDistribution(rating_distribution);
      setAverageRating(average_rating);
      setTotalReviews(total_reviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{
          color: i < rating ? '#fbbf24' : '#e5e7eb',
          fontSize: '1rem'
        }}
      >
        ⭐
      </span>
    ));
  };

  const renderRatingDistribution = () => {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary-600)' }}>
              {averageRating.toFixed(1)}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              {renderStars(Math.round(averageRating))}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              {totalReviews}개의 리뷰
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', width: '1rem' }}>{rating}</span>
                <span style={{ color: '#fbbf24' }}>⭐</span>
                <div style={{
                  flex: 1,
                  height: '0.5rem',
                  background: 'var(--gray-200)',
                  borderRadius: 'var(--border-radius-sm)',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'var(--warning-500)',
                      width: totalReviews > 0 ? `${(ratingDistribution[rating] || 0) / totalReviews * 100}%` : '0%'
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', width: '2rem', textAlign: 'right' }}>
                  {ratingDistribution[rating] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading" style={{ padding: '3rem' }}>
        <div className="loading-spinner">🐾</div>
        <div>리뷰를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Rating Summary */}
      {renderRatingDistribution()}

      {/* Sort Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
          💬 리뷰 ({totalReviews})
        </h3>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="form-select"
          style={{ width: 'auto', minWidth: '120px' }}
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="rating_high">높은 평점순</option>
          <option value="rating_low">낮은 평점순</option>
        </select>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            아직 리뷰가 없습니다
          </div>
          <div style={{ color: 'var(--gray-500)' }}>
            첫 번째 리뷰를 작성해보세요!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="card"
              style={{ padding: '1.5rem' }}
            >
              {/* Review Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: 'var(--primary-100)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--primary-600)'
                  }}>
                    {review.user?.name?.charAt(0)?.toUpperCase() || '👤'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {review.user?.name || '익명'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {renderStars(review.rating)}
                  <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                    {review.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Pet Type and Visit Date */}
              {(review.pet_type || review.visit_date) && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  {review.pet_type && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>🐾</span>
                      <span>{review.pet_type}</span>
                    </div>
                  )}
                  {review.visit_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>📅</span>
                      <span>방문일: {formatDate(review.visit_date)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Review Content */}
              <div style={{
                lineHeight: '1.6',
                color: 'var(--gray-800)',
                marginBottom: '1rem'
              }}>
                {review.content}
              </div>

              {/* Recommendation */}
              {review.recommendation && (
                <div style={{
                  background: 'var(--success-50)',
                  border: '1px solid var(--success-200)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--success-700)',
                    marginBottom: '0.25rem'
                  }}>
                    💡 추천 포인트
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--success-800)' }}>
                    {review.recommendation}
                  </div>
                </div>
              )}

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`리뷰 이미지 ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Review Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid var(--gray-200)'
              }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.25rem' }}
                >
                  👍 도움돼요 {review.helpful_count || 0}
                </button>
                
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--gray-500)' }}
                >
                  🚨 신고
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary btn-sm"
            style={{ opacity: currentPage === 1 ? '0.5' : '1' }}
          >
            이전
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + Math.max(1, currentPage - 2);
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary btn-sm"
            style={{ opacity: currentPage === totalPages ? '0.5' : '1' }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;