import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { businessAPI, Business } from '../services/api';
import ReviewSection from '../components/Reviews/ReviewSection';

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const petTypes = [
    { code: 'dog', name: '강아지', icon: '🐕' },
    { code: 'cat', name: '고양이', icon: '🐱' },
    { code: 'rabbit', name: '토끼', icon: '🐰' },
    { code: 'bird', name: '새', icon: '🐦' },
    { code: 'fish', name: '물고기', icon: '🐠' },
    { code: 'hamster', name: '햄스터', icon: '🐹' },
    { code: 'other', name: '기타', icon: '🐾' },
  ];

  const categoryNames: { [key: string]: string } = {
    'restaurant': '식당/카페',
    'accommodation': '숙박시설',
    'veterinary': '동물병원',
    'grooming': '미용실',
    'park': '공원/놀이터',
    'shopping': '쇼핑몰/매장',
  };

  useEffect(() => {
    if (id) {
      loadBusiness(id);
    }
  }, [id]);

  const loadBusiness = async (businessId: string) => {
    setLoading(true);
    try {
      const response = await businessAPI.getBusiness(businessId);
      setBusiness(response.data.data);
    } catch (err: any) {
      setError('시설 정보를 불러올 수 없습니다.');
      console.error('Failed to load business:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    // TODO: API 호출
  };

  const formatBusinessHours = (hours: any) => {
    if (typeof hours === 'string') {
      return hours;
    }
    if (typeof hours === 'object' && hours !== null) {
      return Object.entries(hours).map(([day, time]) => `${day}: ${time}`).join(', ');
    }
    return '정보 없음';
  };

  if (loading) {
    return (
      <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div className="loading">
          <div className="loading-spinner">🐾</div>
          <div>시설 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div className="empty-state">
          <div className="empty-state-icon">😔</div>
          <div style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem'}}>
            {error || '시설을 찾을 수 없습니다'}
          </div>
          <Link to="/businesses" className="btn btn-primary mt-4">
            ← 시설 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const images = business.gallery_images || [];
  if (business.main_image) {
    images.unshift(business.main_image);
  }

  return (
    <div style={{minHeight: '100vh', background: 'var(--gray-50)'}}>
      {/* Breadcrumb */}
      <div style={{background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '1rem 0'}}>
        <div className="container">
          <nav style={{fontSize: '0.875rem', color: 'var(--gray-500)'}}>
            <Link to="/" style={{color: 'var(--primary-600)', textDecoration: 'none'}}>홈</Link>
            {' > '}
            <Link to="/businesses" style={{color: 'var(--primary-600)', textDecoration: 'none'}}>시설 찾기</Link>
            {' > '}
            <span>{business.name}</span>
          </nav>
        </div>
      </div>

      <div className="container" style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem'}}>
          {/* Main Content */}
          <div>
            {/* Images */}
            {images.length > 0 && (
              <div className="card" style={{marginBottom: '2rem', padding: 0, overflow: 'hidden'}}>
                <div style={{position: 'relative'}}>
                  <img
                    src={images[selectedImageIndex]}
                    alt={business.name}
                    style={{
                      width: '100%',
                      height: '400px',
                      objectFit: 'cover'
                    }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                        disabled={selectedImageIndex === 0}
                        style={{
                          position: 'absolute',
                          left: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '3rem',
                          height: '3rem',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          opacity: selectedImageIndex === 0 ? '0.5' : '1'
                        }}
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
                        disabled={selectedImageIndex === images.length - 1}
                        style={{
                          position: 'absolute',
                          right: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '3rem',
                          height: '3rem',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          opacity: selectedImageIndex === images.length - 1 ? '0.5' : '1'
                        }}
                      >
                        →
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '1rem',
                    overflowX: 'auto'
                  }}>
                    {images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${business.name} ${index + 1}`}
                        onClick={() => setSelectedImageIndex(index)}
                        style={{
                          width: '80px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: 'var(--border-radius-sm)',
                          cursor: 'pointer',
                          border: selectedImageIndex === index ? '2px solid var(--primary-500)' : '2px solid transparent',
                          opacity: selectedImageIndex === index ? '1' : '0.7'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Business Info */}
            <div className="card" style={{marginBottom: '2rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <span className="business-category">
                      {categoryNames[business.category] || business.category}
                    </span>
                    <div className="business-rating">
                      <span>⭐</span>
                      <span style={{color: 'var(--gray-600)', fontSize: '0.875rem', marginLeft: '0.25rem'}}>
                        {business.average_rating.toFixed(1)} ({business.review_count}개 리뷰)
                      </span>
                    </div>
                  </div>
                  <h1 style={{fontSize: '2rem', fontWeight: '800', color: 'var(--gray-900)', marginBottom: '0.5rem'}}>
                    {business.name}
                  </h1>
                  <p style={{color: 'var(--gray-600)', fontSize: '1.125rem', lineHeight: '1.6'}}>
                    {business.description}
                  </p>
                </div>
                <button
                  onClick={handleFavoriteToggle}
                  className="btn btn-secondary"
                  style={{minWidth: 'auto', padding: '0.75rem'}}
                >
                  {isFavorite ? '❤️' : '🤍'}
                </button>
              </div>

              {/* Pet Types */}
              {business.pet_allowed_types && business.pet_allowed_types.length > 0 && (
                <div style={{marginBottom: '1.5rem'}}>
                  <h3 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-900)'}}>
                    입장 가능한 반려동물
                  </h3>
                  <div className="pet-tags">
                    {business.pet_allowed_types.map((type) => {
                      const petType = petTypes.find(p => p.code === type);
                      return (
                        <span key={type} className="pet-tag">
                          {petType?.icon} {petType?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Facilities */}
              {business.pet_facilities && business.pet_facilities.length > 0 && (
                <div style={{marginBottom: '1.5rem'}}>
                  <h3 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-900)'}}>
                    반려동물 시설
                  </h3>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                    {business.pet_facilities.map((facility, index) => (
                      <span
                        key={index}
                        style={{
                          background: 'var(--success-100)',
                          color: 'var(--success-700)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--border-radius-lg)',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        ✓ {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {business.pet_rules && (
                <div style={{marginBottom: '1.5rem'}}>
                  <h3 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-900)'}}>
                    이용 규칙
                  </h3>
                  <div style={{
                    background: 'var(--warning-50)',
                    border: '1px solid var(--warning-200)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '1rem',
                    color: 'var(--warning-800)'
                  }}>
                    {business.pet_rules}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="business-stats" style={{borderTop: '1px solid var(--gray-200)', paddingTop: '1rem'}}>
                <div className="business-stat">
                  <span>👁️</span>
                  <span>조회 {business.view_count}</span>
                </div>
                <div className="business-stat">
                  <span>💬</span>
                  <span>리뷰 {business.review_count}</span>
                </div>
                <div className="business-stat">
                  <span>❤️</span>
                  <span>찜 {business.favorite_count}</span>
                </div>
              </div>
            </div>

            {/* Review Section */}
            <div className="card">
              <ReviewSection business={business} />
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Contact Info */}
            <div className="card" style={{marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem'}}>
                📞 연락처 정보
              </h3>
              
              <div style={{marginBottom: '1rem'}}>
                <div style={{fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem'}}>주소</div>
                <div style={{fontWeight: '500'}}>{business.address}</div>
                {business.address_detail && (
                  <div style={{color: 'var(--gray-600)', fontSize: '0.875rem'}}>{business.address_detail}</div>
                )}
              </div>

              {business.phone && (
                <div style={{marginBottom: '1rem'}}>
                  <div style={{fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem'}}>전화번호</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    {showPhoneNumber ? (
                      <span style={{fontWeight: '500'}}>{business.phone}</span>
                    ) : (
                      <button
                        onClick={() => setShowPhoneNumber(true)}
                        className="btn btn-secondary btn-sm"
                      >
                        전화번호 보기
                      </button>
                    )}
                  </div>
                </div>
              )}

              {business.website && (
                <div style={{marginBottom: '1rem'}}>
                  <div style={{fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem'}}>웹사이트</div>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{color: 'var(--primary-600)', textDecoration: 'none'}}
                  >
                    🔗 홈페이지 방문
                  </a>
                </div>
              )}

              <div style={{marginTop: '1.5rem', display: 'flex', gap: '0.5rem'}}>
                <button className="btn btn-primary" style={{flex: '1'}}>
                  📍 길찾기
                </button>
                <button className="btn btn-secondary" style={{flex: '1'}}>
                  📤 공유
                </button>
              </div>
            </div>

            {/* Business Hours */}
            <div className="card" style={{marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem'}}>
                🕒 운영시간
              </h3>
              <div style={{fontSize: '0.875rem', lineHeight: '1.5'}}>
                {formatBusinessHours(business.business_hours)}
              </div>
              {business.holiday_info && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--gray-100)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.875rem',
                  color: 'var(--gray-700)'
                }}>
                  <strong>휴무일:</strong> {business.holiday_info}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="card">
              <h3 style={{fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem'}}>
                🏪 편의시설
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span>{business.parking_available ? '✅' : '❌'}</span>
                  <span>주차 가능</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span>{business.wifi_available ? '✅' : '❌'}</span>
                  <span>Wi-Fi</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span>{business.outdoor_seating ? '✅' : '❌'}</span>
                  <span>야외 좌석</span>
                </div>
                {business.pet_fee && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'var(--primary-50)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--primary-700)'
                  }}>
                    💰 반려동물 추가 요금: {business.pet_fee}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;