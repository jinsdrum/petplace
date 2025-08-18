import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Businesses from './pages/Businesses';
import BusinessDetail from './pages/BusinessDetail';
import Dashboard from './pages/Dashboard';
import BusinessRegister from './pages/BusinessRegister';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import BlogWrite from './pages/BlogWrite';
import AffiliateManager from './pages/AffiliateManager';
import AdminDashboard from './pages/AdminDashboard';
import AdScript from './components/Ads/AdScript';
import { authAPI, User } from './services/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // Verify token by getting current user info
        const response = await authAPI.getCurrentUser();
        setUser(response.data.data);
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div className="text-center">
          <div className="loading-spinner">🐾</div>
          <div style={{fontSize: '1.25rem', color: 'var(--gray-600)'}}>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <AdScript />
        <Header user={user} onLogout={handleLogout} />
        
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/businesses/:id" element={<BusinessDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register-business" element={<BusinessRegister />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/blog/write" element={<BlogWrite />} />
            <Route path="/affiliate" element={<AffiliateManager />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* 추가 라우트들은 여기에 */}
          </Routes>
        </main>

        {/* Footer */}
        <footer>
          <div className="container">
            <div className="footer-content">
              <div className="footer-logo">🐾 펫플레이스</div>
              <p className="footer-text">
                반려동물과 함께하는 모든 순간을 더 특별하게
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '2rem',
                marginTop: '2rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <h3 style={{fontWeight: '600', marginBottom: '1rem', color: 'white'}}>서비스</h3>
                  <ul style={{listStyle: 'none', color: 'var(--gray-300)'}}>
                    <li style={{marginBottom: '0.5rem'}}>
                      <a href="/businesses" style={{textDecoration: 'none', color: 'inherit'}} 
                         onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                         onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-300)'}>
                        시설 찾기
                      </a>
                    </li>
                    <li style={{marginBottom: '0.5rem'}}>
                      <a href="/register-business" style={{textDecoration: 'none', color: 'inherit'}}
                         onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                         onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-300)'}>
                        사업체 등록
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 style={{fontWeight: '600', marginBottom: '1rem', color: 'white'}}>지원</h3>
                  <ul style={{listStyle: 'none', color: 'var(--gray-300)'}}>
                    <li style={{marginBottom: '0.5rem'}}>
                      <a href="/help" style={{textDecoration: 'none', color: 'inherit'}}
                         onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                         onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-300)'}>
                        도움말
                      </a>
                    </li>
                    <li style={{marginBottom: '0.5rem'}}>
                      <a href="/contact" style={{textDecoration: 'none', color: 'inherit'}}
                         onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                         onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-300)'}>
                        문의하기
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div style={{
                borderTop: '1px solid var(--gray-600)',
                paddingTop: '2rem',
                color: 'var(--gray-300)'
              }}>
                <p>&copy; 2024 펫플레이스. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
