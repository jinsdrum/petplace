import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  phone?: string;
  address?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 로컬 스토리지에서 인증 정보 확인
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedToken = localStorage.getItem('petplace_token');
        const savedUser = localStorage.getItem('petplace_user');

        if (savedToken && savedUser) {
          const userData = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(userData);
          
          // 토큰 유효성 확인 (선택적)
          validateToken(savedToken);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // 잘못된 데이터가 있으면 제거
        localStorage.removeItem('petplace_token');
        localStorage.removeItem('petplace_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 토큰 유효성 검증
  const validateToken = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // 토큰이 유효하지 않으면 로그아웃
        logout();
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // 네트워크 오류 등의 경우 토큰은 유지
    }
  };

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('petplace_token', authToken);
    localStorage.setItem('petplace_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // 로컬 스토리지에서 제거
    localStorage.removeItem('petplace_token');
    localStorage.removeItem('petplace_user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('petplace_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.isAdmin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, AuthContext, useAuth };
export type { User, AuthContextType };