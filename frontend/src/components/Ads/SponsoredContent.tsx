import React from 'react';
import { Link } from 'react-router-dom';

interface SponsoredItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  url: string;
  sponsor: string;
  category?: string;
}

interface SponsoredContentProps {
  items?: SponsoredItem[];
  title?: string;
  maxItems?: number;
  horizontal?: boolean;
}

const SponsoredContent: React.FC<SponsoredContentProps> = ({
  items = [],
  title = '🎯 스폰서 콘텐츠',
  maxItems = 4,
  horizontal = false
}) => {
  // Mock sponsored content if no items provided
  const defaultItems: SponsoredItem[] = [
    {
      id: '1',
      title: '프리미엄 강아지 사료 50% 할인',
      description: '반려견의 건강을 위한 최고급 천연 사료를 특가로 만나보세요',
      image: 'https://via.placeholder.com/300x200',
      url: '/businesses/premium-pet-food',
      sponsor: '펫푸드마켓',
      category: '사료/간식'
    },
    {
      id: '2',
      title: '24시간 응급 동물병원 오픈',
      description: '우리 동네에 새로 오픈한 응급 동물병원에서 무료 건강검진 이벤트',
      image: 'https://via.placeholder.com/300x200',
      url: '/businesses/emergency-vet-clinic',
      sponsor: '우리동물병원',
      category: '의료'
    },
    {
      id: '3',
      title: '펫호텔 예약 시 30% 할인',
      description: '휴가철 반려동물 돌봄 서비스, 지금 예약하면 특별 할인 혜택',
      image: 'https://via.placeholder.com/300x200',
      url: '/businesses/luxury-pet-hotel',
      sponsor: '럭셔리펫호텔',
      category: '숙박'
    },
    {
      id: '4',
      title: '반려동물 전용 카페 신규 오픈',
      description: '반려동물과 함께 즐길 수 있는 특별한 카페 공간',
      image: 'https://via.placeholder.com/300x200',
      url: '/businesses/pet-friendly-cafe',
      sponsor: '펫카페',
      category: '카페'
    }
  ];

  const displayItems = (items.length > 0 ? items : defaultItems).slice(0, maxItems);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div style={{
      padding: '1.5rem',
      background: 'var(--amber-50)',
      border: '1px solid var(--amber-200)',
      borderRadius: 'var(--border-radius-md)',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: 'var(--amber-800)',
          margin: 0
        }}>
          {title}
        </h3>
        
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--amber-700)',
          background: 'var(--amber-100)',
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--border-radius-sm)',
          fontWeight: '500'
        }}>
          광고
        </div>
      </div>

      {/* Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: horizontal 
          ? `repeat(${Math.min(displayItems.length, 2)}, 1fr)`
          : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}>
        {displayItems.map(item => (
          <Link
            key={item.id}
            to={item.url}
            style={{
              display: 'block',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div style={{
              background: 'white',
              borderRadius: 'var(--border-radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--amber-300)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              {/* Image */}
              {item.image && (
                <div style={{
                  width: '100%',
                  height: horizontal ? '120px' : '150px',
                  background: `url(${item.image}) center/cover`,
                  position: 'relative'
                }}>
                  {item.category && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      left: '0.5rem',
                      background: 'var(--primary-600)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {item.category}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div style={{ padding: '1rem' }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--gray-900)',
                  lineHeight: '1.3',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.title}
                </h4>

                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--gray-600)',
                  lineHeight: '1.4',
                  marginBottom: '0.75rem',
                  display: '-webkit-box',
                  WebkitLineClamp: horizontal ? 2 : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.description}
                </p>

                {/* Sponsor */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--amber-700)',
                    fontWeight: '500'
                  }}>
                    {item.sponsor}
                  </div>
                  
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--primary-600)',
                    fontWeight: '500'
                  }}>
                    자세히 보기 →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: '1rem',
        fontSize: '0.625rem',
        color: 'var(--amber-700)',
        textAlign: 'center',
        opacity: 0.8
      }}>
        * 스폰서 콘텐츠는 파트너사에서 제공하며, 펫플레이스의 편집 방침과 독립적입니다
      </div>
    </div>
  );
};

export default SponsoredContent;