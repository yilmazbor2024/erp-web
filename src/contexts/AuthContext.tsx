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

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading) {
        // Token varsa kullanıcı bilgilerini getir
        const token = localStorage.getItem('accessToken');
        if (token && !user) {
          try {
            await fetchUserData();
          } catch (error) {
            console.error('AuthContext: Failed to fetch user data during initial check:', error);
            // Hata durumunda sessizce devam et, kullanıcıyı login sayfasına yönlendirme
          }
        }
      }
    };
    
    checkAuth();
  }, [isLoading]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Fetching user data...');
      
      // Token kontrolü
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('AuthContext: No token found, skipping user data fetch');
        setIsAuthenticated(false);
        setUser(null);
        setError('Oturum açmanız gerekiyor');
        return;
      }
      
      // API'den kullanıcı bilgilerini al
      console.log('AuthContext: Token found, attempting to fetch user data');
      const userData = await authApi.getCurrentUser();
      
      if (!userData || !userData.id) {
        console.error('AuthContext: Failed to fetch user data: Invalid or empty user data');
        setError('Kullanıcı bilgileri alınamadı');
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      
      console.log('AuthContext: User data fetched successfully:', userData);
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
    } catch (error: any) {
      console.error('AuthContext: Error fetching user data:', error);
      
      // isAuthError özelliği varsa bu bir 401 hatası demektir (api.ts'de tanımladık)
      if (error.isAuthError) {
        console.log('AuthContext: Auth error detected, clearing user data but not redirecting');
        setError('Oturum süresi doldu veya geçersiz. Lütfen tekrar giriş yapın.');
        setUser(null);
        setIsAuthenticated(false);
        // Token'ları temizle ama yönlendirme yapma
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      } else {
        // Diğer API hataları
        setError(error.message || 'Kullanıcı bilgileri alınamadı');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      if (!email || !password) {
        throw new Error('Email ve şifre zorunludur');
      }
      
      console.log('AuthContext: Attempting login for:', email);
      const response = await authApi.login({ email, password });
      
      if (!response || !response.token) {
        throw new Error('Kimlik doğrulama başarısız: Token alınamadı');
      }
      
      console.log('AuthContext: Login successful, setting tokens');
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('token', response.token);
      sessionStorage.setItem('token', response.token);
      
      console.log('AuthContext: Fetching user data after successful login');
      try {
        await fetchUserData();
        console.log('AuthContext: User data fetched successfully after login');
      } catch (userDataError: any) {
        // Kullanıcı bilgisi alınamazsa bile login başarılı sayılır
        // Sadece hata mesajı gösterilir ama token'lar korunur
        console.error('AuthContext: Failed to fetch user data after login:', userDataError);
        setError('Giriş başarılı ancak kullanıcı bilgileri alınamadı. Lütfen sayfayı yenileyin.');
      }
      
      setIsAuthenticated(true);
      setError(null);
      console.log('AuthContext: Login and user data fetch completed successfully');
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error);
      
      // Token ve kullanıcı bilgilerini temizle
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      
      // Hata mesajını ayarla
      setError(error instanceof Error ? error.message : 'Giriş başarısız');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Logging out user');
      
      // API çağrısını dene, hata olsa bile devam et
      try {
        await authApi.logout();
        console.log('AuthContext: Logout API call successful');
      } catch (error) {
        console.warn('AuthContext: Logout API call failed, proceeding with local logout');
      }
      
      // Her durumda local storage ve state'i temizle
      console.log('AuthContext: Clearing tokens and user data');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('AuthContext: Logout completed successfully');
    } catch (error) {
      console.error('AuthContext: Error during logout:', error);
      // Hata olsa bile storage ve state'i temizlemeyi dene
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
