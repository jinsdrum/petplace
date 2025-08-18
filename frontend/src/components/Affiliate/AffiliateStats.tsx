import React, { useState, useEffect } from 'react';
import { affiliateAPI } from '../../services/api';

interface AffiliateStatsProps {
  period?: 'day' | 'week' | 'month' | 'year';
  showControls?: boolean;
}

const AffiliateStats: React.FC<AffiliateStatsProps> = ({
  period: initialPeriod = 'month',
  showControls = true
}) => {
  const [period, setPeriod] = useState(initialPeriod);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await affiliateAPI.getStats({ period });
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load affiliate stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'day': return '오늘';
      case 'week': return '이번 주';
      case 'month': return '이번 달';
      case 'year': return '올해';
      default: return '이번 달';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading" style={{ padding: '2rem' }}>
          <div className="loading-spinner">📊</div>
          <div>통계를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <div className="empty-state" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <div>통계 데이터를 불러올 수 없습니다</div>
        </div>
      </div>
    );
  }

  const { total_stats, platform_stats, top_links } = stats;

  return (
    <div className="card">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: 'var(--gray-900)'
        }}>
          📊 제휴 마케팅 통계 ({getPeriodText(period)})
        </h3>

        {showControls && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="form-select"
            style={{ minWidth: '120px' }}
          >
            <option value="day">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
            <option value="year">올해</option>
          </select>
        )}
      </div>

      {/* Total Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--border-radius-md)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--primary-600)',
            marginBottom: '0.5rem'
          }}>
            {total_stats.total_links}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--primary-700)',
            fontWeight: '500'
          }}>
            총 제휴 링크
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'var(--success-50)',
          border: '1px solid var(--success-200)',
          borderRadius: 'var(--border-radius-md)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--success-600)',
            marginBottom: '0.5rem'
          }}>
            {total_stats.total_clicks.toLocaleString()}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--success-700)',
            fontWeight: '500'
          }}>
            총 클릭 수
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'var(--amber-50)',
          border: '1px solid var(--amber-200)',
          borderRadius: 'var(--border-radius-md)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--amber-600)',
            marginBottom: '0.5rem'
          }}>
            {total_stats.total_conversions.toLocaleString()}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--amber-700)',
            fontWeight: '500'
          }}>
            총 구매 전환
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'var(--emerald-50)',
          border: '1px solid var(--emerald-200)',
          borderRadius: 'var(--border-radius-md)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--emerald-600)',
            marginBottom: '0.5rem'
          }}>
            ₩{formatCurrency(total_stats.total_earnings)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--emerald-700)',
            fontWeight: '500'
          }}>
            총 수익
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'var(--purple-50)',
          border: '1px solid var(--purple-200)',
          borderRadius: 'var(--border-radius-md)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--purple-600)',
            marginBottom: '0.5rem'
          }}>
            {total_stats.conversion_rate}%
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--purple-700)',
            fontWeight: '500'
          }}>
            전환율
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      {Object.keys(platform_stats).length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--gray-900)'
          }}>
            플랫폼별 성과
          </h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {Object.entries(platform_stats).map(([platform, stats]: [string, any]) => (
              <div
                key={platform}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--border-radius-md)',
                  background: 'white'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    background: platform === 'coupang' ? '#ff6b35' : '#00c851',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {platform}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>링크:</span>
                    <span style={{ fontWeight: '600', marginLeft: '0.25rem' }}>
                      {stats.links}개
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>클릭:</span>
                    <span style={{ fontWeight: '600', marginLeft: '0.25rem' }}>
                      {stats.clicks.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>전환:</span>
                    <span style={{ fontWeight: '600', marginLeft: '0.25rem' }}>
                      {stats.conversions}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-600)' }}>수익:</span>
                    <span style={{ fontWeight: '600', marginLeft: '0.25rem', color: 'var(--success-600)' }}>
                      ₩{formatCurrency(stats.earnings)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Links */}
      {top_links && top_links.length > 0 && (
        <div>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'var(--gray-900)'
          }}>
            상위 성과 상품
          </h4>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {top_links.map((link: any, index: number) => (
              <div
                key={link.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--border-radius-md)',
                  background: 'white'
                }}
              >
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: index < 3 ? 'var(--amber-100)' : 'var(--gray-100)',
                  color: index < 3 ? 'var(--amber-700)' : 'var(--gray-600)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.875rem'
                }}>
                  {index + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    color: 'var(--gray-900)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {link.product_name}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                  }}>
                    {link.platform} • {link.clicks.toLocaleString()}클릭 • {link.conversions}전환
                  </div>
                </div>

                <div style={{
                  textAlign: 'right'
                }}>
                  <div style={{
                    fontWeight: '700',
                    color: 'var(--success-600)',
                    marginBottom: '0.25rem'
                  }}>
                    ₩{formatCurrency(link.earnings)}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                  }}>
                    수익
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateStats;