import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  user?: any;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <header>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            🐾 펫플레이스
          </Link>

          <nav className="nav-links">
            <Link to="/businesses">시설 찾기</Link>
            <Link to="/blog">블로그</Link>
            <Link to="/businesses?category=restaurant">카페・식당</Link>
            <Link to="/businesses?category=accommodation">숙박</Link>
            <Link to="/businesses?category=veterinary">병원</Link>
            
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      background: 'var(--primary-100)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-600)',
                      fontWeight: '600'
                    }}
                  >
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.username}
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span style={{ fontWeight: '500' }}>{user.username}</span>
                </button>
                
                {isMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      background: 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--border-radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      minWidth: '200px',
                      zIndex: 50
                    }}
                  >
                    <div style={{ padding: '0.5rem' }}>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          textDecoration: 'none',
                          color: 'var(--gray-700)',
                          borderRadius: 'var(--border-radius-sm)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                          e.currentTarget.style.color = 'var(--primary-600)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--gray-700)';
                        }}
                      >
                        📊 대시보드
                      </Link>
                      
                      <Link
                        to="/register-business"
                        onClick={() => setIsMenuOpen(false)}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          textDecoration: 'none',
                          color: 'var(--gray-700)',
                          borderRadius: 'var(--border-radius-sm)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                          e.currentTarget.style.color = 'var(--primary-600)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--gray-700)';
                        }}
                      >
                        🏪 사업체 등록
                      </Link>
                      
                      <Link
                        to="/affiliate"
                        onClick={() => setIsMenuOpen(false)}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          textDecoration: 'none',
                          color: 'var(--gray-700)',
                          borderRadius: 'var(--border-radius-sm)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                          e.currentTarget.style.color = 'var(--primary-600)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--gray-700)';
                        }}
                      >
                        💰 제휴 마케팅
                      </Link>
                      
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          textDecoration: 'none',
                          color: 'var(--gray-700)',
                          borderRadius: 'var(--border-radius-sm)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                          e.currentTarget.style.color = 'var(--primary-600)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--gray-700)';
                        }}
                      >
                        🛠️ 관리자
                      </Link>
                      
                      <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />
                      
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          color: 'var(--error-600)',
                          borderRadius: 'var(--border-radius-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--error-50)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        🚪 로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/login" className="btn btn-secondary">
                  로그인
                </Link>
                <Link to="/register" className="btn btn-primary">
                  회원가입
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 40
          }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;