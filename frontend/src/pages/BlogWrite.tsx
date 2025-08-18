import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogAPI, BlogPostFormData, affiliateAPI, AffiliateProduct } from '../services/api';

const BlogWrite: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    content: '',
    excerpt: '',
    category: '일반',
    featured_image: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    tags: [],
    affiliate_links: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([]);
  const [newTag, setNewTag] = useState('');
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProduct[]>([]);
  const [affiliateSearch, setAffiliateSearch] = useState('');

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('access_token');
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    loadCategories();
    loadTags();
  }, [navigate]);

  const loadCategories = async () => {
    try {
      const response = await blogAPI.getCategories();
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const response = await blogAPI.getTags();
      setAvailableTags(response.data.data.tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await blogAPI.createPost(formData);
      const { blog_post } = response.data.data;
      
      navigate(`/blog/${blog_post.slug}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '블로그 포스트 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const searchAffiliateProducts = async () => {
    if (!affiliateSearch.trim()) return;

    try {
      const response = await affiliateAPI.searchProducts({
        query: affiliateSearch,
        platform: 'coupang',
        limit: 10
      });
      setAffiliateProducts(response.data.data.products);
    } catch (error) {
      console.error('Failed to search affiliate products:', error);
    }
  };

  const addAffiliateLink = (product: AffiliateProduct) => {
    const newLink = {
      product_name: product.name,
      product_url: product.product_url,
      affiliate_url: product.affiliate_url,
      platform: product.platform,
      commission_rate: product.commission_rate
    };

    setFormData(prev => ({
      ...prev,
      affiliate_links: [...(prev.affiliate_links || []), newLink]
    }));

    setShowAffiliateModal(false);
    setAffiliateProducts([]);
    setAffiliateSearch('');
  };

  const removeAffiliateLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      affiliate_links: prev.affiliate_links?.filter((_, i) => i !== index) || []
    }));
  };

  const generateExcerpt = () => {
    if (formData.content) {
      const excerpt = formData.content.slice(0, 200) + (formData.content.length > 200 ? '...' : '');
      setFormData(prev => ({ ...prev, excerpt }));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card">
            <form onSubmit={handleSubmit}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '800',
                marginBottom: '2rem',
                color: 'var(--gray-900)'
              }}>
                ✍️ 새 블로그 포스트 작성
              </h1>

              {error && (
                <div className="error" style={{ marginBottom: '1.5rem' }}>
                  {error}
                </div>
              )}

              {/* Title */}
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  제목 *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input"
                  placeholder="블로그 포스트의 제목을 입력해주세요"
                  required
                />
              </div>

              {/* Category and Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    카테고리
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="form-select"
                  >
                    <option value="일반">일반</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    상태
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                    className="form-select"
                  >
                    <option value="draft">임시저장</option>
                    <option value="published">발행</option>
                  </select>
                </div>
              </div>

              {/* Featured Image */}
              <div className="form-group">
                <label htmlFor="featured_image" className="form-label">
                  대표 이미지 URL
                </label>
                <input
                  id="featured_image"
                  type="url"
                  value={formData.featured_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label htmlFor="content" className="form-label">
                  내용 *
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="form-textarea"
                  rows={15}
                  placeholder="블로그 포스트의 내용을 작성해주세요. Markdown 문법을 지원합니다."
                  required
                />
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-500)',
                  marginTop: '0.25rem'
                }}>
                  **굵게**, *기울임*, [링크](URL) 등의 마크다운 문법을 사용할 수 있습니다.
                </div>
              </div>

              {/* Excerpt */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="excerpt" className="form-label">
                    요약 (미리보기)
                  </label>
                  <button
                    type="button"
                    onClick={generateExcerpt}
                    className="btn btn-secondary btn-sm"
                  >
                    자동 생성
                  </button>
                </div>
                <textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="form-textarea"
                  rows={3}
                  placeholder="블로그 포스트의 간단한 요약을 작성해주세요"
                />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">
                  태그
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="form-input"
                    placeholder="태그 입력 후 Enter"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="btn btn-secondary"
                  >
                    추가
                  </button>
                </div>
                
                {formData.tags && formData.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          background: 'var(--primary-100)',
                          color: 'var(--primary-700)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--border-radius-lg)',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-700)',
                            cursor: 'pointer',
                            padding: 0,
                            marginLeft: '0.25rem'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Affiliate Links */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">
                    제휴 상품 링크
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAffiliateModal(true)}
                    className="btn btn-secondary"
                  >
                    🛒 상품 추가
                  </button>
                </div>

                {formData.affiliate_links && formData.affiliate_links.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    {formData.affiliate_links.map((link, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          background: 'var(--amber-50)',
                          border: '1px solid var(--amber-200)',
                          borderRadius: 'var(--border-radius-md)',
                          marginBottom: '0.5rem'
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
                        <button
                          type="button"
                          onClick={() => removeAffiliateLink(index)}
                          className="btn btn-danger btn-sm"
                        >
                          제거
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SEO Settings */}
              <details style={{ marginBottom: '1.5rem' }}>
                <summary style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}>
                  🔍 SEO 설정 (선택사항)
                </summary>

                <div className="form-group">
                  <label htmlFor="meta_title" className="form-label">
                    메타 제목
                  </label>
                  <input
                    id="meta_title"
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    className="form-input"
                    placeholder="검색 결과에 표시될 제목"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="meta_description" className="form-label">
                    메타 설명
                  </label>
                  <textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    className="form-textarea"
                    rows={3}
                    placeholder="검색 결과에 표시될 설명"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="meta_keywords" className="form-label">
                    메타 키워드
                  </label>
                  <input
                    id="meta_keywords"
                    type="text"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                    className="form-input"
                    placeholder="키워드1, 키워드2, 키워드3"
                  />
                </div>
              </details>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--gray-200)'
              }}>
                <button
                  type="button"
                  onClick={() => navigate('/blog')}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    setFormData(prev => ({ ...prev, status: 'draft' }));
                    await handleSubmit(new Event('submit') as any);
                  }}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  임시저장
                </button>

                <button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="btn btn-primary"
                  style={{
                    opacity: loading || !formData.title.trim() || !formData.content.trim() ? '0.5' : '1'
                  }}
                >
                  {loading ? '발행 중...' : formData.status === 'published' ? '발행하기' : '저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Affiliate Product Search Modal */}
      {showAffiliateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
              🛒 제휴 상품 검색
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={affiliateSearch}
                onChange={(e) => setAffiliateSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchAffiliateProducts()}
                className="form-input"
                placeholder="상품명을 검색해주세요"
                style={{ flex: 1 }}
              />
              <button
                onClick={searchAffiliateProducts}
                className="btn btn-primary"
              >
                검색
              </button>
            </div>

            {affiliateProducts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                {affiliateProducts.map(product => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--border-radius-md)'
                    }}
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: 'var(--border-radius-sm)'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                        {product.price.toLocaleString()}원 • ⭐ {product.rating} ({product.review_count}리뷰)
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {product.platform} • 수수료율 {product.commission_rate}%
                      </div>
                    </div>
                    <button
                      onClick={() => addAffiliateLink(product)}
                      className="btn btn-primary btn-sm"
                    >
                      추가
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAffiliateModal(false);
                  setAffiliateProducts([]);
                  setAffiliateSearch('');
                }}
                className="btn btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogWrite;