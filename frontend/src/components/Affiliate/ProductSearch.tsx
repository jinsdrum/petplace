import React, { useState } from 'react';
import { affiliateAPI, AffiliateProduct } from '../../services/api';

interface ProductSearchProps {
  onProductSelect?: (product: AffiliateProduct) => void;
  showResults?: boolean;
  placeholder?: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  onProductSelect,
  showResults = true,
  placeholder = "상품을 검색해보세요..."
}) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<'coupang' | 'naver'>('coupang');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await affiliateAPI.searchProducts({
        query: query.trim(),
        platform,
        limit: 12
      });
      setProducts(response.data.data.products);
    } catch (error) {
      console.error('Failed to search products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product: AffiliateProduct) => {
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      // Open product link in new tab
      window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{
          color: i < Math.floor(rating) ? '#fbbf24' : '#e5e7eb',
          fontSize: '0.875rem'
        }}
      >
        ⭐
      </span>
    ));
  };

  return (
    <div>
      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as 'coupang' | 'naver')}
            className="form-select"
            style={{ minWidth: '120px' }}
          >
            <option value="coupang">쿠팡</option>
            <option value="naver">네이버</option>
          </select>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="form-input"
            style={{ flex: 1 }}
          />
          
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn btn-primary"
            style={{
              opacity: loading || !query.trim() ? '0.5' : '1'
            }}
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {showResults && (
        <div>
          {loading && (
            <div className="loading" style={{ padding: '2rem' }}>
              <div className="loading-spinner">🔍</div>
              <div>상품을 검색하는 중...</div>
            </div>
          )}

          {!loading && products.length === 0 && query && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                검색 결과가 없습니다
              </div>
              <div style={{ color: 'var(--gray-500)' }}>
                다른 키워드로 다시 검색해보세요
              </div>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                marginBottom: '1rem'
              }}>
                "{query}" 검색 결과 {products.length}개
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="card"
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleProductClick(product)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {/* Product Image */}
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: 'var(--border-radius-md)',
                          flexShrink: 0
                        }}
                      />

                      {/* Product Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                          color: 'var(--gray-900)',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {product.name}
                        </h3>

                        {/* Rating */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {renderStars(product.rating)}
                          </div>
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--gray-600)'
                          }}>
                            {product.rating.toFixed(1)} ({product.review_count})
                          </span>
                        </div>

                        {/* Price and Platform */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: 'var(--primary-600)'
                          }}>
                            {formatPrice(product.price)}원
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span style={{
                              background: product.platform === 'coupang' ? '#ff6b35' : '#00c851',
                              color: 'white',
                              padding: '0.125rem 0.375rem',
                              borderRadius: 'var(--border-radius-sm)',
                              fontSize: '0.625rem',
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {product.platform}
                            </span>
                            
                            <span style={{
                              fontSize: '0.75rem',
                              color: 'var(--success-600)',
                              fontWeight: '500'
                            }}>
                              {product.commission_rate}% 적립
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ 
                        width: '100%', 
                        marginTop: '0.75rem' 
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                    >
                      {onProductSelect ? '선택' : '상품 보기'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;