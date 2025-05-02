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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Clear token if unauthorized
      if ((error as any).response?.status === 401) {
        localStorage.removeItem('accessToken');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Auth context: login attempt for email:', email);
      const response = await authApi.login({ email, password });
      
      console.log('Auth context: login successful, setting token');
      
      // Doğru token depolama - localStorage ve sessionStorage'da saklayalım
      if (response && response.token) {
        localStorage.setItem('accessToken', response.token);
        localStorage.setItem('token', response.token); // Geriye dönük uyumluluk
        sessionStorage.setItem('token', response.token); // Bazı bileşenler bunu kullanabilir
        
        console.log('Token stored in multiple locations for compatibility');
        
        // Kullanıcı bilgilerini çek
        try {
          await fetchUserData();
          setIsAuthenticated(true);
        } catch (userError) {
          console.error('Failed to fetch user data after login:', userError);
          // Geçici bir kullanıcı oluştur
          setUser({
            id: 'temp-id',
            email,
            firstName: '',
            lastName: '',
            userName: email,
            isActive: true, // Required field
            roles: []
          });
          setIsAuthenticated(true);
        }
      } else {
        console.error('No token received from login API');
        throw new Error('Kimlik doğrulama başarısız: Token alınamadı');
      }
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      setError(error instanceof Error ? error.message : 'Giriş başarısız');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API endpoint if available
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API call failed, proceeding with local logout');
    } finally {
      // Always clear local storage and state
    localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    loading,
    login,
    logout
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
