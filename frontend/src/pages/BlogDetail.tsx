import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogAPI, BlogPost, affiliateAPI } from '../services/api';
import AdUnit from '../components/Ads/AdUnit';
import SponsoredContent from '../components/Ads/SponsoredContent';

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug]);

  const loadPost = async (postSlug: string) => {
    setLoading(true);
    try {
      const response = await blogAPI.getPost(postSlug);
      setPost(response.data.data.post);
    } catch (err: any) {
      setError('블로그 포스트를 불러올 수 없습니다.');
      console.error('Failed to load blog post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const response = await blogAPI.likePost(post.id);
      setPost(prev => prev ? {
        ...prev,
        like_count: response.data.data.like_count
      } : null);
      setLiked(true);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleAffiliateClick = async (linkId: string) => {
    try {
      await affiliateAPI.trackClick(linkId);
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content: string) => {
    // Simple HTML formatting (in production, use a proper HTML sanitizer)
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading">
          <div className="loading-spinner">🐾</div>
          <div>블로그 포스트를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon">😔</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            {error || '블로그 포스트를 찾을 수 없습니다'}
          </div>
          <Link to="/blog" className="btn btn-primary">
            ← 블로그로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = localStorage.getItem('user_id') === post.author?.id;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Breadcrumb */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '1rem 0' }}>
        <div className="container">
          <nav style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            <Link to="/" style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>홈</Link>
            {' > '}
            <Link to="/blog" style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>블로그</Link>
            {' > '}
            <span>{post.title}</span>
          </nav>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          {/* Main Content */}
          <article>
            {/* Featured Image */}
            {post.featured_image && (
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
                <img
                  src={post.featured_image}
                  alt={post.title}
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            {/* Post Header */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  background: 'var(--primary-100)',
                  color: 'var(--primary-700)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--border-radius-lg)',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {post.category}
                </span>
              </div>

              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: 'var(--gray-900)',
                marginBottom: '1rem',
                lineHeight: '1.2'
              }}>
                {post.title}
              </h1>

              <p style={{
                fontSize: '1.125rem',
                color: 'var(--gray-600)',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>
                {post.excerpt}
              </p>

              {/* Post Meta */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--gray-200)',
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'var(--primary-100)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    color: 'var(--primary-600)'
                  }}>
                    {post.author?.name?.charAt(0)?.toUpperCase() || '👤'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      {post.author?.name || '익명'}
                    </div>
                    <div>{formatDate(post.created_at)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span>📖 {post.estimated_read_time}분</span>
                  <span>👁️ {post.view_count}</span>
                  <span>❤️ {post.like_count}</span>
                </div>

                {isAuthor && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/blog/${post.slug}/edit`}
                      className="btn btn-secondary btn-sm"
                    >
                      수정
                    </Link>
                    <button className="btn btn-danger btn-sm">
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.8',
                  color: 'var(--gray-800)'
                }}
                dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
              />

              {/* Affiliate Links */}
              {post.affiliate_links && post.affiliate_links.length > 0 && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'var(--amber-50)',
                  border: '1px solid var(--amber-200)',
                  borderRadius: 'var(--border-radius-md)'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    marginBottom: '1rem',
                    color: 'var(--amber-800)'
                  }}>
                    🛒 추천 상품
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {post.affiliate_links.map(link => (
                      <div
                        key={link.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          background: 'white',
                          borderRadius: 'var(--border-radius-md)',
                          border: '1px solid var(--amber-300)'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            {link.product_name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                            {link.platform} • 수수료율 {link.commission_rate}%
                          </div>
                        </div>
                        <a
                          href={link.affiliate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleAffiliateClick(link.id)}
                          className="btn btn-primary btn-sm"
                        >
                          상품 보기
                        </a>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--amber-700)',
                    marginTop: '0.5rem'
                  }}>
                    * 위 링크를 통해 구매 시 소정의 수수료가 발생할 수 있습니다.
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--gray-200)',
                  flexWrap: 'wrap'
                }}>
                  {post.tags.map(tag => (
                    <Link
                      key={tag.id}
                      to={`/blog?tag=${tag.name}`}
                      style={{
                        background: 'var(--primary-100)',
                        color: 'var(--primary-700)',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--border-radius-lg)',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        textDecoration: 'none'
                      }}
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="card">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  onClick={handleLike}
                  disabled={liked}
                  className="btn btn-primary"
                  style={{
                    opacity: liked ? '0.5' : '1',
                    cursor: liked ? 'not-allowed' : 'pointer'
                  }}
                >
                  {liked ? '❤️ 좋아요 완료' : '❤️ 좋아요'} ({post.like_count})
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary">
                    📤 공유하기
                  </button>
                  <button className="btn btn-secondary">
                    🚨 신고하기
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside>
            {/* Author Info */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>
                👤 작성자
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'var(--primary-100)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'var(--primary-600)'
                }}>
                  {post.author?.name?.charAt(0)?.toUpperCase() || '👤'}
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {post.author?.name || '익명'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    반려동물 전문가
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
                팔로우
              </button>
            </div>

            {/* Sidebar Ad */}
            <div style={{ marginBottom: '1.5rem' }}>
              <AdUnit 
                adSlot="9876543210"
                adFormat="vertical"
                responsive={true}
              />
            </div>

            {/* Table of Contents */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>
                📋 목차
              </h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                자동 생성된 목차가 여기에 표시됩니다
              </div>
            </div>

            {/* Sponsored Content in Sidebar */}
            <SponsoredContent 
              title="🎯 추천 상품"
              maxItems={2}
              horizontal={false}
            />

            {/* Related Posts */}
            <div className="card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>
                📚 관련 글
              </h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                관련된 다른 글들이 여기에 표시됩니다
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;