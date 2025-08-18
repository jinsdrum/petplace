import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { businessAPI, blogAPI, affiliateAPI } from '../services/api';
import AdUnit from '../components/Ads/AdUnit';
import SponsoredContent from '../components/Ads/SponsoredContent';

interface AdminStats {
  businesses: number;
  users: number;
  posts: number;
  reviews: number;
  affiliateClicks: number;
  affiliateRevenue: number;
}

interface SponsoredItem {
  id: string;
  title: string;
  description: string;
  sponsor: string;
  url: string;
  status: 'active' | 'paused' | 'draft';
  clicks: number;
  revenue: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    businesses: 0,
    users: 0,
    posts: 0,
    reviews: 0,
    affiliateClicks: 0,
    affiliateRevenue: 0
  });
  const [sponsoredItems, setSponsoredItems] = useState<SponsoredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'ads' | 'analytics'>('overview');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load mock admin stats
      setStats({
        businesses: 1247,
        users: 8934,
        posts: 456,
        reviews: 3421,
        affiliateClicks: 15678,
        affiliateRevenue: 234567
      });

      // Load mock sponsored items
      setSponsoredItems([
        {
          id: '1',
          title: '프리미엄 강아지 사료 50% 할인',
          description: '반려견의 건강을 위한 최고급 천연 사료',
          sponsor: '펫푸드마켓',
          url: '/businesses/premium-pet-food',
          status: 'active',
          clicks: 1234,
          revenue: 45600
        },
        {
          id: '2',
          title: '24시간 응급 동물병원',
          description: '우리 동네 응급 동물병원 무료 건강검진',
          sponsor: '우리동물병원',
          url: '/businesses/emergency-vet-clinic',
          status: 'active',
          clicks: 867,
          revenue: 23400
        },
        {
          id: '3',
          title: '펫호텔 예약 30% 할인',
          description: '휴가철 반려동물 돌봄 서비스',
          sponsor: '럭셔리펫호텔',
          url: '/businesses/luxury-pet-hotel',
          status: 'paused',
          clicks: 543,
          revenue: 18900
        }
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'var(--green-600)';
      case 'paused': return 'var(--amber-600)';
      case 'draft': return 'var(--gray-600)';
      default: return 'var(--gray-600)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'paused': return '일시정지';
      case 'draft': return '초안';
      default: return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading">
          <div className="loading-spinner">🐾</div>
          <div>관리자 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '1rem 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--gray-900)' }}>
            🛠️ 관리자 대시보드
          </h1>
          <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem' }}>
            플랫폼 운영 현황 및 콘텐츠 관리
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Tabs */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            borderBottom: '1px solid var(--gray-200)',
            paddingBottom: '0'
          }}>
            {[
              { key: 'overview', label: '📊 개요', icon: '📊' },
              { key: 'content', label: '📝 콘텐츠', icon: '📝' },
              { key: 'ads', label: '🎯 광고', icon: '🎯' },
              { key: 'analytics', label: '📈 분석', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === tab.key ? 'var(--primary-50)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--primary-600)' : 'var(--gray-600)',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid var(--primary-600)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  fontSize: '0.875rem'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏪</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.25rem' }}>
                  {formatCurrency(stats.businesses)}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>등록된 사업체</div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.25rem' }}>
                  {formatCurrency(stats.users)}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>가입 사용자</div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.25rem' }}>
                  {formatCurrency(stats.posts)}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>블로그 포스트</div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⭐</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.25rem' }}>
                  {formatCurrency(stats.reviews)}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>사용자 리뷰</div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👆</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.25rem' }}>
                  {formatCurrency(stats.affiliateClicks)}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>제휴 클릭</div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.25rem' }}>
                  ₩{formatCurrency(stats.affiliateRevenue)}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>제휴 수익</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                🚀 빠른 작업
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <Link to="/businesses" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                  🏪 사업체 관리
                </Link>
                <Link to="/blog" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                  📝 블로그 관리
                </Link>
                <Link to="/affiliate" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                  💼 제휴 관리
                </Link>
                <button className="btn btn-secondary">
                  👥 사용자 관리
                </button>
                <button className="btn btn-secondary">
                  📊 리포트 생성
                </button>
                <button className="btn btn-secondary">
                  ⚙️ 시스템 설정
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div>
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                📝 콘텐츠 관리
              </h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                블로그 포스트, 사업체 정보, 사용자 리뷰 등의 콘텐츠를 관리할 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <div>
            {/* Sponsored Content Management */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                  🎯 스폰서 콘텐츠 관리
                </h3>
                <button className="btn btn-primary">
                  + 새 스폰서 콘텐츠 추가
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>제목</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>스폰서</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>상태</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>클릭수</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>수익</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600' }}>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsoredItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '500' }}>{item.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                            {item.description}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{item.sponsor}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--border-radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            background: `${getStatusColor(item.status)}20`,
                            color: getStatusColor(item.status)
                          }}>
                            {getStatusText(item.status)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>
                          {formatCurrency(item.clicks)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>
                          ₩{formatCurrency(item.revenue)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary btn-sm">수정</button>
                            <button className="btn btn-danger btn-sm">삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ad Settings */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                ⚙️ 광고 설정
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Google AdSense 클라이언트 ID
                  </label>
                  <input
                    type="text"
                    placeholder="ca-pub-xxxxxxxxxxxxxxxxx"
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    광고 표시 빈도 (%)
                  </label>
                  <input
                    type="number"
                    placeholder="80"
                    className="form-input"
                    style={{ width: '200px' }}
                  />
                </div>
                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  설정 저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                📈 상세 분석
              </h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                트래픽, 수익, 사용자 행동 등의 상세한 분석 데이터를 확인할 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
            🔍 광고 미리보기
          </h3>
          
          {/* AdSense Preview */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Google AdSense 광고</h4>
            <AdUnit 
              adSlot="1234567890"
              adFormat="horizontal"
              responsive={true}
            />
          </div>

          {/* Sponsored Content Preview */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>스폰서 콘텐츠</h4>
            <SponsoredContent 
              title="🎯 관리자 미리보기"
              maxItems={3}
              horizontal={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;