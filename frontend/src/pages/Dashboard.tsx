import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, User } from '../services/api';
import AffiliateStats from '../components/Affiliate/AffiliateStats';

interface DashboardData {
  user: User;
  stats: {
    favorite_count: number;
    review_count: number;
    business_count: number;
    recent_activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      created_at: string;
    }>;
  };
  recent_businesses: Array<{
    id: string;
    name: string;
    category: string;
    average_rating: number;
    main_image?: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    is_read: boolean;
  }>;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get user info from localStorage for now
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // For now, use mock data since dashboard API isn't implemented
      setDashboardData({
        user: user,
        stats: {
          favorite_count: 8,
          review_count: 12,
          business_count: 2,
          recent_activities: []
        },
        recent_businesses: [],
        notifications: [
          {
            id: '1',
            title: '펫플레이스에 오신 것을 환영합니다!',
            message: '프로필을 완성하고 첫 번째 리뷰를 작성해보세요',
            type: 'welcome',
            created_at: new Date().toISOString(),
            is_read: false
          },
          {
            id: '2',
            title: '새로운 시설이 추가되었습니다',
            message: '근처에 새로운 애견카페가 등록되었어요',
            type: 'new_business',
            created_at: new Date().toISOString(),
            is_read: false
          }
        ]
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('대시보드 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div className="loading">
          <div className="loading-spinner">🐾</div>
          <div>대시보드를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div className="empty-state">
          <div className="empty-state-icon">😔</div>
          <div style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem'}}>
            {error}
          </div>
          <button onClick={loadDashboardData} className="btn btn-primary mt-4">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: 'var(--gray-50)'}}>
      {/* Hero Section */}
      <section style={{background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', color: 'white', padding: '3rem 0'}}>
        <div className="container">
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '4rem', marginBottom: '1rem'}}>👋</div>
            <h1 style={{fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.5rem'}}>
              안녕하세요, {user?.name || user?.username || '사용자'}님!
            </h1>
            <p style={{fontSize: '1.125rem', opacity: '0.9'}}>
              오늘도 반려동물과 함께 즐거운 하루 보내세요
            </p>
          </div>
        </div>
      </section>

      <div className="container" style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{textAlign: 'center'}}>
            <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>📝</div>
            <div style={{fontSize: '2rem', fontWeight: '800', color: 'var(--primary-600)', marginBottom: '0.25rem'}}>
              {dashboardData?.stats.review_count || 0}
            </div>
            <div style={{color: 'var(--gray-600)'}}>작성한 리뷰</div>
          </div>

          <div className="card" style={{textAlign: 'center'}}>
            <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>❤️</div>
            <div style={{fontSize: '2rem', fontWeight: '800', color: 'var(--error-500)', marginBottom: '0.25rem'}}>
              {dashboardData?.stats.favorite_count || 0}
            </div>
            <div style={{color: 'var(--gray-600)'}}>찜한 시설</div>
          </div>

          <div className="card" style={{textAlign: 'center'}}>
            <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>🏪</div>
            <div style={{fontSize: '2rem', fontWeight: '800', color: 'var(--success-500)', marginBottom: '0.25rem'}}>
              {dashboardData?.stats.business_count || 0}
            </div>
            <div style={{color: 'var(--gray-600)'}}>등록한 사업체</div>
          </div>

          <div className="card" style={{textAlign: 'center'}}>
            <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>🏆</div>
            <div style={{fontSize: '2rem', fontWeight: '800', color: 'var(--warning-500)', marginBottom: '0.25rem'}}>
              레벨 3
            </div>
            <div style={{color: 'var(--gray-600)'}}>펫플레이스 등급</div>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem'}}>
          {/* Main Content */}
          <div>
            {/* Quick Actions */}
            <div className="card" style={{marginBottom: '2rem'}}>
              <h2 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem'}}>
                🚀 빠른 실행
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <Link to="/businesses" className="btn btn-primary" style={{justifyContent: 'center', padding: '1rem'}}>
                  🔍 시설 찾기
                </Link>
                <Link to="/register-business" className="btn btn-secondary" style={{justifyContent: 'center', padding: '1rem'}}>
                  🏪 사업체 등록
                </Link>
                <button className="btn btn-secondary" style={{justifyContent: 'center', padding: '1rem'}}>
                  📝 리뷰 작성
                </button>
                <button className="btn btn-secondary" style={{justifyContent: 'center', padding: '1rem'}}>
                  📊 통계 보기
                </button>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="card" style={{marginBottom: '2rem'}}>
              <h2 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem'}}>
                📋 최근 활동
              </h2>
              
              {dashboardData?.stats.recent_activities.length === 0 ? (
                <div className="empty-state" style={{padding: '2rem'}}>
                  <div style={{fontSize: '2rem', marginBottom: '1rem'}}>🎯</div>
                  <div style={{marginBottom: '0.5rem'}}>아직 활동 내역이 없습니다</div>
                  <div style={{color: 'var(--gray-500)', fontSize: '0.875rem'}}>
                    시설을 방문하고 리뷰를 작성해보세요!
                  </div>
                  <Link to="/businesses" className="btn btn-primary mt-4">
                    시설 찾아보기
                  </Link>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {dashboardData?.stats.recent_activities.map((activity) => (
                    <div key={activity.id} style={{
                      padding: '1rem',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--border-radius-md)',
                      background: 'white'
                    }}>
                      <div style={{fontWeight: '600', marginBottom: '0.25rem'}}>{activity.title}</div>
                      <div style={{color: 'var(--gray-600)', fontSize: '0.875rem'}}>{activity.description}</div>
                      <div style={{color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: '0.5rem'}}>
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Businesses */}
            <div className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: '700'}}>
                  🏪 최근 본 시설
                </h2>
                <Link to="/businesses" style={{color: 'var(--primary-600)', textDecoration: 'none', fontSize: '0.875rem'}}>
                  전체 보기
                </Link>
              </div>
              
              {dashboardData?.recent_businesses.length === 0 ? (
                <div className="empty-state" style={{padding: '2rem'}}>
                  <div style={{fontSize: '2rem', marginBottom: '1rem'}}>📍</div>
                  <div style={{marginBottom: '0.5rem'}}>아직 본 시설이 없습니다</div>
                  <div style={{color: 'var(--gray-500)', fontSize: '0.875rem'}}>
                    다양한 시설을 탐색해보세요!
                  </div>
                </div>
              ) : (
                <div className="card-grid">
                  {dashboardData?.recent_businesses.map((business) => (
                    <Link
                      key={business.id}
                      to={`/businesses/${business.id}`}
                      className="business-card"
                      style={{transform: 'none'}}
                    >
                      <div className="business-image">
                        {business.main_image ? (
                          <img src={business.main_image} alt={business.name} />
                        ) : (
                          <span>🏪</span>
                        )}
                      </div>
                      <div className="business-content">
                        <span className="business-category">{business.category}</span>
                        <h3 className="business-name">{business.name}</h3>
                        <div className="business-rating">
                          <span>⭐</span>
                          <span>{business.average_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Profile Card */}
            <div className="card" style={{marginBottom: '1.5rem'}}>
              <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'var(--primary-100)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '1.5rem',
                  color: 'var(--primary-600)',
                  fontWeight: '700'
                }}>
                  {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || '👤'}
                </div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.25rem'}}>
                  {user?.name || user?.username || '사용자'}
                </h3>
                <div style={{color: 'var(--gray-600)', fontSize: '0.875rem'}}>
                  {user?.email}
                </div>
              </div>

              {/* Pet Types */}
              {user?.pet_types && user.pet_types.length > 0 && (
                <div style={{marginBottom: '1.5rem'}}>
                  <h4 style={{fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-700)'}}>
                    반려동물
                  </h4>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                    {user.pet_types.map((type: string, index: number) => (
                      <span key={index} className="pet-tag">
                        🐾 {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link to="/profile" className="btn btn-secondary" style={{width: '100%', justifyContent: 'center'}}>
                ⚙️ 프로필 편집
              </Link>
            </div>

            {/* Notifications */}
            <div className="card">
              <h3 style={{fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem'}}>
                🔔 알림
              </h3>
              
              {dashboardData?.notifications && dashboardData.notifications.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  {dashboardData.notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      style={{
                        padding: '0.75rem',
                        background: notification.type === 'welcome' ? 'var(--primary-50)' : 'var(--success-50)',
                        borderRadius: 'var(--border-radius-sm)',
                        borderLeft: `3px solid ${notification.type === 'welcome' ? 'var(--primary-500)' : 'var(--success-500)'}`
                      }}
                    >
                      <div style={{fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem'}}>
                        {notification.title} {notification.type === 'welcome' ? '🎉' : '✨'}
                      </div>
                      <div style={{fontSize: '0.75rem', color: 'var(--gray-600)'}}>
                        {notification.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{padding: '1.5rem'}}>
                  <div style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>🔕</div>
                  <div style={{fontSize: '0.875rem', color: 'var(--gray-500)'}}>
                    새로운 알림이 없습니다
                  </div>
                </div>
              )}
              
              <Link 
                to="/notifications" 
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '1rem',
                  color: 'var(--primary-600)',
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                모든 알림 보기
              </Link>
            </div>
          </div>
        </div>

        {/* Affiliate Marketing Stats Section */}
        <div style={{ marginTop: '2rem' }}>
          <AffiliateStats period="month" showControls={true} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;