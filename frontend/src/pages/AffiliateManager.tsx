import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { affiliateAPI, AffiliateLink } from '../services/api';
import AffiliateStats from '../components/Affiliate/AffiliateStats';
import ProductSearch from '../components/Affiliate/ProductSearch';

const AffiliateManager: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'products' | 'analytics'>('overview');
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [platformFilter, setPlatformFilter] = useState('');

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('access_token');
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (activeTab === 'links') {
      loadAffiliateLinks();
    }
  }, [navigate, activeTab, currentPage, platformFilter]);

  const loadAffiliateLinks = async () => {
    setLoading(true);
    try {
      const response = await affiliateAPI.getLinks({
        page: currentPage,
        per_page: 10,
        platform: platformFilter || undefined
      });
      
      const { links, pagination } = response.data.data;
      setLinks(links);
      setTotalPages(pagination.pages);
    } catch (error) {
      console.error('Failed to load affiliate links:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      await affiliateAPI.trackClick(linkId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to track click:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 개요', icon: '📊' },
    { id: 'links', label: '🔗 링크 관리', icon: '🔗' },
    { id: 'products', label: '🛒 상품 검색', icon: '🛒' },
    { id: 'analytics', label: '📈 상세 분석', icon: '📈' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--gray-900)',
            marginBottom: '0.5rem'
          }}>
            💰 제휴 마케팅 관리
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '1.125rem'
          }}>
            제휴 링크를 관리하고 수익을 확인하세요
          </p>
        </div>

        {/* Tabs */}
        <div className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--gray-200)'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: activeTab === tab.id ? 'var(--primary-50)' : 'white',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary-500)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--gray-600)',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.875rem'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'var(--gray-50)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <AffiliateStats period="month" showControls={true} />
              
              <div style={{ marginTop: '2rem' }}>
                <div className="card">
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    marginBottom: '1rem',
                    color: 'var(--gray-900)'
                  }}>
                    🚀 빠른 시작
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div style={{
                      padding: '1.5rem',
                      background: 'var(--primary-50)',
                      border: '1px solid var(--primary-200)',
                      borderRadius: 'var(--border-radius-md)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✍️</div>
                      <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>블로그 포스트 작성</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                        제휴 상품을 포함한 블로그 포스트를 작성하세요
                      </p>
                      <button
                        onClick={() => navigate('/blog/write')}
                        className="btn btn-primary btn-sm"
                      >
                        블로그 작성하기
                      </button>
                    </div>

                    <div style={{
                      padding: '1.5rem',
                      background: 'var(--success-50)',
                      border: '1px solid var(--success-200)',
                      borderRadius: 'var(--border-radius-md)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                      <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>상품 검색</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                        쿠팡, 네이버에서 제휴 상품을 검색하세요
                      </p>
                      <button
                        onClick={() => setActiveTab('products')}
                        className="btn btn-success btn-sm"
                      >
                        상품 검색하기
                      </button>
                    </div>

                    <div style={{
                      padding: '1.5rem',
                      background: 'var(--amber-50)',
                      border: '1px solid var(--amber-200)',
                      borderRadius: 'var(--border-radius-md)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                      <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>성과 분석</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                        클릭 수, 전환율, 수익을 분석하세요
                      </p>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="btn btn-warning btn-sm"
                      >
                        분석 보기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Links Management Tab */}
          {activeTab === 'links' && (
            <div>
              <div className="card">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--gray-900)'
                  }}>
                    🔗 제휴 링크 관리
                  </h3>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      className="form-select"
                      style={{ minWidth: '120px' }}
                    >
                      <option value="">모든 플랫폼</option>
                      <option value="coupang">쿠팡</option>
                      <option value="naver">네이버</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="loading" style={{ padding: '3rem' }}>
                    <div className="loading-spinner">🔗</div>
                    <div>링크를 불러오는 중...</div>
                  </div>
                ) : links.length === 0 ? (
                  <div className="empty-state" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      아직 제휴 링크가 없습니다
                    </div>
                    <div style={{ color: 'var(--gray-500)', marginBottom: '1rem' }}>
                      블로그 포스트에 제휴 상품을 추가해보세요
                    </div>
                    <button
                      onClick={() => navigate('/blog/write')}
                      className="btn btn-primary"
                    >
                      블로그 작성하기
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      {links.map(link => (
                        <div
                          key={link.id}
                          style={{
                            padding: '1.5rem',
                            border: '1px solid var(--gray-200)',
                            borderRadius: 'var(--border-radius-md)',
                            background: 'white'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '1rem'
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                color: 'var(--gray-900)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {link.product_name}
                              </h4>
                              
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '0.5rem',
                                fontSize: '0.875rem',
                                color: 'var(--gray-600)'
                              }}>
                                <span style={{
                                  background: link.platform === 'coupang' ? '#ff6b35' : '#00c851',
                                  color: 'white',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: 'var(--border-radius-sm)',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>
                                  {link.platform}
                                </span>
                                <span>수수료율: {link.commission_rate}%</span>
                                <span>등록일: {formatDate(link.created_at)}</span>
                              </div>

                              {link.blog_post && (
                                <div style={{
                                  fontSize: '0.875rem',
                                  color: 'var(--primary-600)'
                                }}>
                                  📝 블로그: {link.blog_post.title}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleLinkClick(link.id, link.affiliate_url)}
                              className="btn btn-primary btn-sm"
                            >
                              링크 방문
                            </button>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '1rem',
                            padding: '1rem',
                            background: 'var(--gray-50)',
                            borderRadius: 'var(--border-radius-sm)'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-600)' }}>
                                {link.click_count.toLocaleString()}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>클릭</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success-600)' }}>
                                {link.conversion_count.toLocaleString()}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>전환</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--emerald-600)' }}>
                                ₩{formatCurrency(link.total_earnings)}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>수익</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--purple-600)' }}>
                                {link.click_count > 0 ? ((link.conversion_count / link.click_count) * 100).toFixed(1) : '0.0'}%
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>전환율</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

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
                )}
              </div>
            </div>
          )}

          {/* Product Search Tab */}
          {activeTab === 'products' && (
            <div className="card">
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                marginBottom: '1.5rem',
                color: 'var(--gray-900)'
              }}>
                🛒 제휴 상품 검색
              </h3>
              
              <ProductSearch
                showResults={true}
                placeholder="추천하고 싶은 상품을 검색해보세요..."
              />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <AffiliateStats period="month" showControls={true} />
              
              <div style={{ marginTop: '2rem' }}>
                <div className="card">
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    marginBottom: '1rem',
                    color: 'var(--gray-900)'
                  }}>
                    📈 상세 분석 (준비 중)
                  </h3>
                  
                  <div className="empty-state" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      상세 분석 기능 준비 중
                    </div>
                    <div style={{ color: 'var(--gray-500)' }}>
                      일별/월별 수익 차트, 상품별 성과 분석 등의 기능이 곧 추가됩니다
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateManager;