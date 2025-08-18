import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, RegisterData } from '../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    nickname: '',
    phone: '',
    pet_types: [],
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const petTypes = [
    { value: 'dog', label: '강아지', icon: '🐕' },
    { value: 'cat', label: '고양이', icon: '🐱' },
    { value: 'rabbit', label: '토끼', icon: '🐰' },
    { value: 'bird', label: '새', icon: '🐦' },
    { value: 'fish', label: '물고기', icon: '🐠' },
    { value: 'hamster', label: '햄스터', icon: '🐹' },
    { value: 'other', label: '기타', icon: '🐾' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePetTypeChange = (petType: string) => {
    const currentPetTypes = formData.pet_types || [];
    const updatedPetTypes = currentPetTypes.includes(petType)
      ? currentPetTypes.filter(type => type !== petType)
      : [...currentPetTypes, petType];

    setFormData({
      ...formData,
      pet_types: updatedPetTypes,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!agreedToTerms) {
      setError('서비스 이용약관에 동의해주세요.');
      return;
    }

    if (!formData.pet_types || formData.pet_types.length === 0) {
      setError('반려동물 종류를 하나 이상 선택해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      const { tokens, user } = response.data.data;

      // Store tokens
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gray-50)',
      padding: '2rem 1rem'
    }}>
      <div className="container" style={{maxWidth: '32rem'}}>
        <div className="text-center mb-8">
          <div style={{fontSize: '4rem', marginBottom: '1.5rem'}}>🐾</div>
          <h2 style={{fontSize: '1.875rem', fontWeight: '800', color: 'var(--gray-900)', marginBottom: '0.5rem'}}>
            회원가입
          </h2>
          <p style={{color: 'var(--gray-600)'}}>
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              style={{
                color: 'var(--primary-600)',
                textDecoration: 'none',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary-600)'}
            >
              로그인하기
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

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label htmlFor="name" className="form-label">
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="실명을 입력하세요"
                />
              </div>

              <div className="form-group" style={{marginBottom: 0}}>
                <label htmlFor="nickname" className="form-label">
                  닉네임
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  required
                  value={formData.nickname}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="닉네임을 입력하세요"
                />
              </div>
            </div>

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
              <label htmlFor="phone" className="form-label">
                전화번호
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="010-1234-5678"
              />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label htmlFor="password" className="form-label">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="비밀번호"
                />
              </div>

              <div className="form-group" style={{marginBottom: 0}}>
                <label htmlFor="confirmPassword" className="form-label">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="비밀번호 확인"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                반려동물 종류 (여러 개 선택 가능)
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.75rem'
              }}>
                {petTypes.map((petType) => (
                  <button
                    key={petType.value}
                    type="button"
                    onClick={() => handlePetTypeChange(petType.value)}
                    style={{
                      padding: '0.75rem',
                      border: `2px solid ${(formData.pet_types || []).includes(petType.value) ? 'var(--primary-500)' : 'var(--gray-300)'}`,
                      borderRadius: 'var(--border-radius-md)',
                      background: (formData.pet_types || []).includes(petType.value) ? 'var(--primary-50)' : 'white',
                      color: (formData.pet_types || []).includes(petType.value) ? 'var(--primary-700)' : 'var(--gray-700)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      if (!(formData.pet_types || []).includes(petType.value)) {
                        e.currentTarget.style.borderColor = 'var(--primary-400)';
                        e.currentTarget.style.background = 'var(--primary-25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(formData.pet_types || []).includes(petType.value)) {
                        e.currentTarget.style.borderColor = 'var(--gray-300)';
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <div style={{fontSize: '1.5rem', marginBottom: '0.25rem'}}>
                      {petType.icon}
                    </div>
                    {petType.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{marginRight: '0.5rem'}}
                />
                <span style={{fontSize: '0.875rem', color: 'var(--gray-700)'}}>
                  <Link 
                    to="/terms" 
                    style={{color: 'var(--primary-600)', textDecoration: 'none'}}
                  >
                    서비스 이용약관
                  </Link>
                  {' '}및{' '}
                  <Link 
                    to="/privacy" 
                    style={{color: 'var(--primary-600)', textDecoration: 'none'}}
                  >
                    개인정보 처리방침
                  </Link>
                  에 동의합니다
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{width: '100%', marginBottom: '1.5rem'}}
            >
              {loading ? '가입 중...' : '회원가입'}
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

export default Register;