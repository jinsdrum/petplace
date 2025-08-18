import React, { useState } from 'react';
import { reviewAPI, ReviewFormData } from '../../services/api';

interface ReviewFormProps {
  businessId: string;
  businessName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  businessId,
  businessName,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    business_id: businessId,
    rating: 5,
    content: '',
    pet_type: '',
    visit_date: '',
    recommendation: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const petTypes = [
    { value: '', label: '선택안함' },
    { value: 'dog', label: '🐕 강아지' },
    { value: 'cat', label: '🐱 고양이' },
    { value: 'rabbit', label: '🐰 토끼' },
    { value: 'bird', label: '🐦 새' },
    { value: 'fish', label: '🐠 물고기' },
    { value: 'hamster', label: '🐹 햄스터' },
    { value: 'other', label: '🐾 기타' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.content.trim()) {
      setError('리뷰 내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      await reviewAPI.createReview(formData);
      
      // Success
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '리뷰 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const renderStarRating = () => {
    return (
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleRatingChange(i + 1)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: i < formData.rating ? '#fbbf24' : '#e5e7eb',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (i >= formData.rating) {
                e.currentTarget.style.color = '#fbbf24';
              }
            }}
            onMouseLeave={(e) => {
              if (i >= formData.rating) {
                e.currentTarget.style.color = '#e5e7eb';
              }
            }}
          >
            ⭐
          </button>
        ))}
        <span style={{ marginLeft: '0.5rem', fontWeight: '600', color: 'var(--gray-700)' }}>
          {formData.rating}.0
        </span>
      </div>
    );
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          marginBottom: '1.5rem',
          color: 'var(--gray-900)'
        }}>
          ✍️ {businessName} 리뷰 작성
        </h3>

        {error && (
          <div className="error" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* Rating */}
        <div className="form-group">
          <label className="form-label">
            평점 *
          </label>
          {renderStarRating()}
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--gray-500)',
            marginTop: '0.25rem'
          }}>
            별점을 클릭하여 평가해주세요
          </div>
        </div>

        {/* Pet Type */}
        <div className="form-group">
          <label htmlFor="pet_type" className="form-label">
            함께 방문한 반려동물
          </label>
          <select
            id="pet_type"
            value={formData.pet_type}
            onChange={(e) => setFormData(prev => ({ ...prev, pet_type: e.target.value }))}
            className="form-select"
          >
            {petTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Visit Date */}
        <div className="form-group">
          <label htmlFor="visit_date" className="form-label">
            방문일
          </label>
          <input
            id="visit_date"
            type="date"
            value={formData.visit_date}
            onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
            className="form-input"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Review Content */}
        <div className="form-group">
          <label htmlFor="content" className="form-label">
            리뷰 내용 *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            className="form-textarea"
            rows={5}
            placeholder="이 시설을 이용하신 경험을 상세히 알려주세요. 다른 반려동물 가족들에게 도움이 되는 정보를 공유해주시면 감사하겠습니다."
            required
          />
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--gray-500)',
            marginTop: '0.25rem'
          }}>
            최소 10자 이상 작성해주세요
          </div>
        </div>

        {/* Recommendation */}
        <div className="form-group">
          <label htmlFor="recommendation" className="form-label">
            추천 포인트
          </label>
          <textarea
            id="recommendation"
            value={formData.recommendation}
            onChange={(e) => setFormData(prev => ({ ...prev, recommendation: e.target.value }))}
            className="form-textarea"
            rows={3}
            placeholder="이 시설의 특별한 장점이나 추천하고 싶은 점이 있다면 알려주세요."
          />
        </div>

        {/* Image Upload Placeholder */}
        <div className="form-group">
          <label className="form-label">
            사진 첨부
          </label>
          <div style={{
            border: '2px dashed var(--gray-300)',
            borderRadius: 'var(--border-radius-md)',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--gray-500)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
            <div style={{ fontSize: '0.875rem' }}>
              사진 업로드 기능은 곧 추가됩니다
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--gray-200)'
        }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              취소
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading || !formData.content.trim()}
            className="btn btn-primary"
            style={{
              opacity: loading || !formData.content.trim() ? '0.5' : '1',
              cursor: loading || !formData.content.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '작성 중...' : '리뷰 등록'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;