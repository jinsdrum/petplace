import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, LoginData } from '../services/api';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      const { tokens, user } = response.data.data;

      // Store tokens
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard or home
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-50)',
      padding: '3rem 1rem'
    }}>
      <div style={{maxWidth: '28rem', width: '100%'}}>
        <div className="text-center mb-8">
          <div style={{fontSize: '4rem', marginBottom: '1.5rem'}}>🐾</div>
          <h2 style={{fontSize: '1.875rem', fontWeight: '800', color: 'var(--gray-900)', marginBottom: '0.5rem'}}>
            로그인
          </h2>
          <p style={{color: 'var(--gray-600)'}}>
            계정이 없으신가요?{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--primary-600)',
                textDecoration: 'none',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary-600)'}
            >
              회원가입하기
            </Link>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error mb-4">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                이메일 주소
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="이메일 주소를 입력하세요"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  style={{marginRight: '0.5rem'}}
                />
                <label htmlFor="remember-me" style={{fontSize: '0.875rem', color: 'var(--gray-700)'}}>
                  로그인 상태 유지
                </label>
              </div>

              <Link
                to="/forgot-password"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--primary-600)',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-700)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary-600)'}
              >
                비밀번호 찾기
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{width: '100%', marginBottom: '1.5rem'}}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <div style={{position: 'relative', marginBottom: '1.5rem'}}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                background: 'var(--gray-300)'
              }} />
              <div style={{
                position: 'relative',
                textAlign: 'center',
                background: 'white',
                padding: '0 1rem',
                color: 'var(--gray-500)',
                fontSize: '0.875rem'
              }}>
                또는
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{justifyContent: 'center'}}
              >
                <span style={{marginRight: '0.5rem'}}>📱</span>
                카카오
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{justifyContent: 'center'}}
              >
                <span style={{marginRight: '0.5rem'}}>🅖</span>
                구글
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;