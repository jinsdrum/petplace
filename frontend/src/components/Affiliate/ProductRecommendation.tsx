import React, { useState, useEffect } from 'react';
import { affiliateAPI, AffiliateProduct } from '../../services/api';

interface ProductRecommendationProps {
  category?: string;
  limit?: number;
  title?: string;
  showTitle?: boolean;
}

const ProductRecommendation: React.FC<ProductRecommendationProps> = ({
  category = 'pet',
  limit = 4,
  title = '🛒 추천 상품',
  showTitle = true
}) => {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendedProducts();
  }, [category, limit]);

  const loadRecommendedProducts = async () => {
    setLoading(true);
    try {
      const response = await affiliateAPI.getRecommendedProducts({
        category,
        limit
      });
      setProducts(response.data.data.products);
    } catch (error) {
      console.error('Failed to load recommended products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product: AffiliateProduct, linkId?: string) => {
    // Track click if linkId is provided
    if (linkId) {
      try {
        await affiliateAPI.trackClick(linkId);
      } catch (error) {
        console.error('Failed to track click:', error);
      }
    }
    
    // Open affiliate link in new tab
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
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

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="loading">
          <div className="loading-spinner">🐾</div>
          <div>추천 상품을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div>
      {showTitle && (
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '1.5rem',
          color: 'var(--gray-900)'
        }}>
          {title}
        </h2>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}>
        {products.map((product) => (
          <div
            key={product.id}
            className="card"
            style={{
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => handleProductClick(product)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            {/* Platform Badge */}
            <div style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              background: product.platform === 'coupang' ? '#ff6b35' : '#00c851',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {product.platform}
            </div>

            {/* Commission Badge */}
            <div style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              background: 'var(--success-600)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {product.commission_rate}% 적립
            </div>

            {/* Product Image */}
            <div style={{
              position: 'relative',
              marginBottom: '1rem'
            }}>
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>

            {/* Product Info */}
            <div>
              <h3 style={{
                fontSize: '1rem',
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
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderStars(product.rating)}
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  {product.rating.toFixed(1)} ({product.review_count.toLocaleString()}리뷰)
                </span>
              </div>

              {/* Price */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'var(--primary-600)'
                }}>
                  {formatPrice(product.price)}원
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--success-600)',
                  fontWeight: '500'
                }}>
                  최대 {Math.floor(product.price * product.commission_rate / 100).toLocaleString()}원 적립
                </div>
              </div>

              {/* Action Button */}
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProductClick(product);
                }}
              >
                🛒 상품 보기
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'var(--amber-50)',
        border: '1px solid var(--amber-200)',
        borderRadius: 'var(--border-radius-md)',
        fontSize: '0.75rem',
        color: 'var(--amber-800)',
        textAlign: 'center'
      }}>
        <span>💡 위 링크를 통해 구매 시 소정의 수수료가 발생할 수 있습니다. 이는 펫플레이스 운영에 도움이 됩니다.</span>
      </div>
    </div>
  );
};

export default ProductRecommendation;