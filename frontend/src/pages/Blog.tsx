import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { blogAPI, BlogPost } from '../services/api';

const Blog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, [currentPage, selectedCategory, searchQuery, sortBy]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await blogAPI.getPosts({
        page: currentPage,
        per_page: 12,
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
        status: 'published'
      });

      const { posts, pagination } = response.data.data;
      setPosts(posts);
      setTotalPages(pagination.pages);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await blogAPI.getCategories();
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPosts();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isLoggedIn = !!localStorage.getItem('access_token');

  if (loading && currentPage === 1) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading">
          <div className="loading-spinner">🐾</div>
          <div>블로그 포스트를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--gray-900)', marginBottom: '1rem' }}>
              🐾 펫플레이스 블로그
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', maxWidth: '600px', margin: '0 auto' }}>
              반려동물과 함께하는 일상, 유용한 정보, 그리고 추천 상품을 공유합니다
            </p>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '500px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="블로그 포스트 검색..."
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">
                검색
              </button>
            </form>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="form-select"
                style={{ minWidth: '150px' }}
              >
                <option value="">모든 카테고리</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="form-select"
                style={{ minWidth: '120px' }}
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="popular">인기순</option>
              </select>

              {isLoggedIn && (
                <Link to="/blog/write" className="btn btn-primary">
                  ✍️ 글쓰기
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {posts.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              게시된 블로그 포스트가 없습니다
            </div>
            <div style={{ color: 'var(--gray-500)' }}>
              {searchQuery || selectedCategory ? '다른 검색어나 카테고리를 시도해보세요' : '첫 번째 블로그 포스트를 작성해보세요!'}
            </div>
            {isLoggedIn && !searchQuery && !selectedCategory && (
              <Link to="/blog/write" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                블로그 시작하기
              </Link>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {posts.map((post) => (
              <article key={post.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {post.featured_image && (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      background: 'var(--primary-600)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--border-radius-lg)',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {post.category}
                    </div>
                  </div>
                )}

                <div style={{ padding: '1.5rem' }}>
                  {/* Meta Info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>👤</span>
                      <span>{post.author?.name || '익명'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>📅</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>📖</span>
                      <span>{post.estimated_read_time}분</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    marginBottom: '0.75rem',
                    lineHeight: '1.4'
                  }}>
                    <Link
                      to={`/blog/${post.slug}`}
                      style={{
                        color: 'var(--gray-900)',
                        textDecoration: 'none'
                      }}
                    >
                      {post.title}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  <p style={{
                    color: 'var(--gray-600)',
                    lineHeight: '1.6',
                    marginBottom: '1rem'
                  }}>
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      {post.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag.id}
                          style={{
                            background: 'var(--gray-100)',
                            color: 'var(--gray-700)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--border-radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--gray-200)',
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <span>👁️ {post.view_count}</span>
                      <span>❤️ {post.like_count}</span>
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="btn btn-secondary btn-sm"
                    >
                      더 읽기 →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '3rem'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
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
                  className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
              style={{ opacity: currentPage === totalPages ? '0.5' : '1' }}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;