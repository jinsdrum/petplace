import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { businessAPI, Business } from '../services/api';
import AdUnit from '../components/Ads/AdUnit';
import SponsoredContent from '../components/Ads/SponsoredContent';

const Businesses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedPetType, setSelectedPetType] = useState(searchParams.get('pet_type') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('rating');

  const categories = [
    { code: '', name: '전체', icon: '🏪' },
    { code: 'restaurant', name: '식당/카페', icon: '🍽️' },
    { code: 'accommodation', name: '숙박시설', icon: '🏨' },
    { code: 'veterinary', name: '동물병원', icon: '🏥' },
    { code: 'grooming', name: '미용실', icon: '✂️' },
    { code: 'park', name: '공원/놀이터', icon: '🌳' },
    { code: 'shopping', name: '쇼핑몰/매장', icon: '🛍️' },
  ];

  const petTypes = [
    { code: '', name: '전체', icon: '🐾' },
    { code: 'dog', name: '강아지', icon: '🐕' },
    { code: 'cat', name: '고양이', icon: '🐱' },
    { code: 'rabbit', name: '토끼', icon: '🐰' },
    { code: 'bird', name: '새', icon: '🐦' },
    { code: 'fish', name: '물고기', icon: '🐠' },
    { code: 'hamster', name: '햄스터', icon: '🐹' },
    { code: 'other', name: '기타', icon: '🐾' },
  ];

  const sortOptions = [
    { value: 'rating', label: '평점순' },
    { value: 'reviews', label: '리뷰순' },
    { value: 'distance', label: '거리순' },
    { value: 'newest', label: '최신순' },
  ];

  useEffect(() => {
    loadBusinesses();
  }, [searchQuery, selectedCategory, selectedPetType, currentPage, sortBy]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const response = await businessAPI.getBusinesses({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        pet_type: selectedPetType || undefined,
        page: currentPage,
        per_page: 12,
      });
      
      setBusinesses(response.data.data.businesses);
      setTotalPages(Math.ceil(response.data.data.pagination.total / 12));
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedPetType) params.set('pet_type', selectedPetType);
    setSearchParams(params);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePetTypeChange = (petType: string) => {
    setSelectedPetType(petType);
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`btn ${currentPage === i ? 'btn-primary' : 'btn-secondary'}`}
          style={{padding: '0.5rem 0.75rem', fontSize: '0.875rem'}}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center gap-2">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="btn btn-secondary btn-sm"
          style={{opacity: currentPage === 1 ? '0.5' : '1'}}
        >
          이전
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="btn btn-secondary btn-sm"
          style={{opacity: currentPage === totalPages ? '0.5' : '1'}}
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <div style={{minHeight: '100vh', background: 'var(--gray-50)'}}>
      {/* Search Header */}
      <section style={{background: 'white', borderBottom: '1px solid var(--gray-200)'}}>
        <div className="container" style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
          <h1 style={{fontSize: '1.875rem', fontWeight: '800', color: 'var(--gray-900)', marginBottom: '1.5rem'}}>
            🔍 시설 찾기
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} style={{marginBottom: '2rem'}}>
            <div className="search-form" style={{maxWidth: '600px'}}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="시설명, 지역명으로 검색..."
                className="search-input"
              />
              <button type="submit" className="search-button">
                🔍 검색
              </button>
            </div>
          </form>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Category Filter */}
            <div>
              <label className="form-label" style={{marginBottom: '0.5rem'}}>
                카테고리
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="form-select"
              >
                {categories.map((category) => (
                  <option key={category.code} value={category.code}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pet Type Filter */}
            <div>
              <label className="form-label" style={{marginBottom: '0.5rem'}}>
                반려동물 종류
              </label>
              <select
                value={selectedPetType}
                onChange={(e) => handlePetTypeChange(e.target.value)}
                className="form-select"
              >
                {petTypes.map((petType) => (
                  <option key={petType.code} value={petType.code}>
                    {petType.icon} {petType.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="form-label" style={{marginBottom: '0.5rem'}}>
                정렬
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section">
        <div className="container">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner">🐾</div>
              <div>시설을 검색하는 중...</div>
            </div>
          ) : businesses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">😔</div>
              <div style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem'}}>
                검색 결과가 없습니다
              </div>
              <div style={{color: 'var(--gray-500)'}}>
                다른 검색어나 필터를 시도해보세요
              </div>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{color: 'var(--gray-600)'}}>
                  총 <span style={{fontWeight: '600', color: 'var(--primary-600)'}}>{businesses.length}</span>개의 시설을 찾았습니다
                </div>
                <Link to="/register-business" className="btn btn-primary">
                  + 사업체 등록
                </Link>
              </div>

              {/* Business Grid */}
              <div className="card-grid">
                {businesses.map((business) => (
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
                          {categories.find(c => c.code === business.category)?.name || business.category}
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
                          {business.pet_allowed_types.slice(0, 3).map((type) => {
                            const petType = petTypes.find(p => p.code === type);
                            return (
                              <span key={type} className="pet-tag">
                                {petType?.icon} {petType?.name}
                              </span>
                            );
                          })}
                          {business.pet_allowed_types.length > 3 && (
                            <span className="pet-tag">
                              +{business.pet_allowed_types.length - 3}
                            </span>
                          )}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{marginTop: '3rem'}}>
                  {renderPagination()}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Businesses;