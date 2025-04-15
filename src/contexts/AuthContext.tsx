import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  userGroupId?: string;
  userGroupName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Geliştirme için mock kullanıcı verisi
const mockUser = {
  id: 'mock-user-id',
  userName: 'mockuser',
  email: 'admin@erp.com',
  firstName: 'Demo',
  lastName: 'Kullanıcı',
  isActive: true,
  roles: ['Admin'],
  userGroupId: 'mock-group-id',
  userGroupName: 'Yöneticiler'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Clear token if unauthorized
      if ((error as any).response?.status === 401) {
        localStorage.removeItem('accessToken');
      } else {
        // Geçici çözüm: API çalışmadığında mock kullanıcı kullan
        console.warn('API çalışmıyor, mock kullanıcı ile devam ediliyor');
        setUser(mockUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('accessToken', response.token);
      await fetchUserData();
    } catch (error) {
      console.error('Login error:', error);
      
      // Geliştirme modunda API çalışmıyorsa erişime izin ver
      if (process.env.NODE_ENV === 'development' && 
          ((error as any).code === 'ERR_NETWORK' || (error as any).response?.status === 500)) {
        console.warn('API bağlantısı başarısız, geliştirme için mock kullanıcı kullanılıyor');
        localStorage.setItem('accessToken', 'mock-token-for-development');
        setUser(mockUser);
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
