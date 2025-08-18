import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { businessAPI, Business } from '../services/api';
import ProductRecommendation from '../components/Affiliate/ProductRecommendation';
import SponsoredContent from '../components/Ads/SponsoredContent';
import AdUnit from '../components/Ads/AdUnit';

const Home: React.FC = () => {
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedBusinesses();
  }, []);

  const loadFeaturedBusinesses = async () => {
    try {
      const response = await businessAPI.getFeatured();
      setFeaturedBusinesses(response.data.data);
    } catch (error) {
      console.error('Featured businesses loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/businesses?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const categories = [
    { code: 'restaurant', name: '식당/카페', icon: '🍽️' },
    { code: 'accommodation', name: '숙박시설', icon: '🏨' },
    { code: 'veterinary', name: '동물병원', icon: '🏥' },
    { code: 'grooming', name: '미용실', icon: '✂️' },
    { code: 'park', name: '공원/놀이터', icon: '🌳' },
    { code: 'shopping', name: '쇼핑몰/매장', icon: '🛍️' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="container">
            <h1>
              🐾 반려동물과 함께하는
              <br />
              <span className="hero-accent">모든 순간</span>
            </h1>
            <p>
              반려동물과 함께 갈 수 있는 모든 장소를 찾아보세요.
              <br />
              카페, 식당, 숙박시설, 병원까지 한 곳에서!
            </p>

            {/* Search Bar */}
            <div className="search-container">
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="어디로 가고 싶으신가요? (예: 강남구 애견카페)"
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  🔍 검색
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">카테고리별 찾기</h2>
            <p className="section-subtitle">
              원하는 시설 유형을 선택해보세요
            </p>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <Link
                key={category.code}
                to={`/businesses?category=${category.code}`}
                className="category-card"
              >
                <div className="category-icon">
                  {category.icon}
                </div>
                <h3 className="category-name">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      {loading ? (
        <section className="section">
          <div className="container">
            <div className="loading">
              <div className="loading-spinner">🐾</div>
              <div>추천 시설을 불러오는 중...</div>
            </div>
          </div>
        </section>
      ) : featuredBusinesses.length > 0 ? (
        <section className="section" style={{backgroundColor: 'white'}}>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">⭐ 추천 시설</h2>
              <p className="section-subtitle">
                반려동물과 함께 가기 좋은 인기 시설들
              </p>
            </div>

            <div className="card-grid">
              {featuredBusinesses.map((business) => (
                <Link
                  key={business.id}
                  to={`/businesses/${business.id}`}
                  className="business-card"
                >
                  <div className="business-image">
                    {business.main_image ? (
                      <img
                        src={business.main_image}
                        alt={business.name}
                      />
                    ) : (
                      <span>🏪</span>
                    )}
                  </div>
                  <div className="business-content">
                    <div className="flex justify-between items-center mb-2">
                      <span className="business-category">
                        {business.category}
                      </span>
                      <div className="business-rating">
                        <span>⭐</span>
                        <span style={{color: 'var(--gray-600)', fontSize: '0.875rem', marginLeft: '0.25rem'}}>
                          {business.average_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <h3 className="business-name">
                      {business.name}
                    </h3>
                    <p className="business-description">
                      {business.description}
                    </p>
                    <div className="business-address">
                      <span>📍</span>
                      <span>{business.address}</span>
                    </div>
                    {business.pet_allowed_types && business.pet_allowed_types.length > 0 && (
                      <div className="pet-tags">
                        {business.pet_allowed_types.map((type) => (
                          <span key={type} className="pet-tag">
                            {type === 'dog' ? '🐕' : type === 'cat' ? '🐱' : '🐾'} {type}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="business-stats">
                      <div className="business-stat">
                        <span>👁️</span>
                        <span>{business.view_count}</span>
                      </div>
                      <div className="business-stat">
                        <span>💬</span>
                        <span>{business.review_count}</span>
                      </div>
                      <div className="business-stat">
                        <span>❤️</span>
                        <span>{business.favorite_count}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to="/businesses" className="btn btn-primary btn-lg">
                모든 시설 보기 →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Sponsored Content Section */}
      <section className="section" style={{backgroundColor: 'white'}}>
        <div className="container">
          <SponsoredContent 
            title="🎯 추천 파트너"
            maxItems={4}
            horizontal={false}
          />
        </div>
      </section>

      {/* Ad Unit */}
      <section className="section" style={{backgroundColor: 'var(--gray-50)', padding: '1rem 0'}}>
        <div className="container">
          <AdUnit 
            adSlot="1234567890"
            adFormat="horizontal"
            responsive={true}
          />
        </div>
      </section>

      {/* Product Recommendation Section */}
      <section className="section" style={{backgroundColor: 'var(--gray-50)'}}>
        <div className="container">
          <ProductRecommendation 
            category="pet"
            limit={8}
            title="🛒 반려동물 필수 용품 추천"
            showTitle={true}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="section" style={{backgroundColor: 'var(--primary-50)'}}>
        <div className="container">
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center'}}>
            <div>
              <div style={{fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.5rem'}}>1,000+</div>
              <div style={{color: 'var(--gray-600)'}}>등록된 시설</div>
            </div>
            <div>
              <div style={{fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.5rem'}}>10,000+</div>
              <div style={{color: 'var(--gray-600)'}}>사용자 리뷰</div>
            </div>
            <div>
              <div style={{fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.5rem'}}>500+</div>
              <div style={{color: 'var(--gray-600)'}}>파트너 업체</div>
            </div>
            <div>
              <div style={{fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.5rem'}}>24/7</div>
              <div style={{color: 'var(--gray-600)'}}>고객 지원</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', color: 'white'}}>
        <div className="container text-center">
          <h2 style={{fontSize: '2rem', fontWeight: '800', marginBottom: '1rem'}}>
            사업체를 운영하시나요?
          </h2>
          <p style={{fontSize: '1.125rem', marginBottom: '2rem', opacity: '0.95'}}>
            우리 플랫폼에 등록하고 더 많은 반려동물 가족들과 만나보세요
          </p>
          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link to="/register-business" className="btn btn-secondary btn-lg">
              사업체 등록하기
            </Link>
            <Link 
              to="/contact" 
              className="btn btn-lg"
              style={{
                background: 'transparent',
                color: 'white',
                border: '2px solid white'
              }}
            >
              문의하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;