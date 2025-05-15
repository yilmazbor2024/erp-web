import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  sessionTimeoutMinutes: number;
  setSessionTimeoutMinutes: (minutes: number) => void;
  remainingSessionTime: number | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Varsayılan oturum süresi (dakika)
const DEFAULT_SESSION_TIMEOUT = 60;

// localStorage'dan oturum süresini al veya varsayılan değeri kullan
const getStoredSessionTimeout = (): number => {
  const stored = localStorage.getItem('sessionTimeoutMinutes');
  return stored ? parseInt(stored, 10) : DEFAULT_SESSION_TIMEOUT;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutesState] = useState<number>(getStoredSessionTimeout());
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [remainingSessionTime, setRemainingSessionTime] = useState<number | null>(null);
  const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Oturum süresini güncelleme fonksiyonu
  const setSessionTimeoutMinutes = useCallback((minutes: number) => {
    localStorage.setItem('sessionTimeoutMinutes', minutes.toString());
    setSessionTimeoutMinutesState(minutes);
    
    // Eğer aktif bir oturum varsa, süreyi güncelle
    if (isAuthenticated && sessionExpiry) {
      const now = new Date();
      const newExpiry = new Date(now.getTime() + minutes * 60 * 1000);
      setSessionExpiry(newExpiry);
    }
  }, [isAuthenticated, sessionExpiry]);

  // Oturum süresini kontrol eden ve güncelleyen fonksiyon
  const checkSessionTime = useCallback(() => {
    if (!sessionExpiry) return;
    
    const now = new Date();
    const remainingMs = sessionExpiry.getTime() - now.getTime();
    const remainingMinutes = Math.max(0, Math.floor(remainingMs / (1000 * 60)));
    const remainingSeconds = Math.max(0, Math.floor((remainingMs % (1000 * 60)) / 1000));
    
    // Kalan süreyi saniye cinsinden ayarla
    setRemainingSessionTime(remainingMinutes * 60 + remainingSeconds);
    
    // Oturum süresi dolduysa otomatik logout
    if (remainingMs <= 0) {
      console.log('AuthContext: Session expired, logging out automatically');
      logout();
    }
    
    // Oturum süresi 30 saniyeden az kaldıysa ve hala aktifse, uyarı göster
    if (remainingMs > 0 && remainingMs <= 30000 && isAuthenticated) {
      console.warn(`AuthContext: Session expiring in ${remainingSeconds} seconds`);
      // Burada uyarı gösterme işlemi yapılabilir (toast, modal vb.)
    }
  }, [sessionExpiry, isAuthenticated]);

  // Sayfa yüklendiğinde oturum kontrolü
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
    
    // Component unmount olduğunda interval'i temizle
    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, []);

  // Oturum süresi kontrolü için interval ayarla
  useEffect(() => {
    if (isAuthenticated) {
      // Mevcut interval'i temizle
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
      
      // Yeni interval oluştur (her saniye kontrol et)
      const interval = setInterval(checkSessionTime, 1000);
      setSessionCheckInterval(interval);
      
      // İlk kontrolü hemen yap
      checkSessionTime();
    } else {
      // Oturum yoksa interval'i temizle
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        setSessionCheckInterval(null);
      }
      
      setRemainingSessionTime(null);
      setSessionExpiry(null);
    }
    
    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [isAuthenticated, sessionExpiry, checkSessionTime]);

  // Kullanıcı bilgilerini getir
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
      
      // Oturum süresini ayarla
      const now = new Date();
      const expiry = new Date(now.getTime() + sessionTimeoutMinutes * 60 * 1000);
      setSessionExpiry(expiry);
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

  // Oturumu yenile
  const refreshSession = async () => {
    try {
      console.log('AuthContext: Refreshing session...');
      
      // Kullanıcı bilgilerini yeniden getir
      await fetchUserData();
      
      // Oturum süresini yenile
      const now = new Date();
      const expiry = new Date(now.getTime() + sessionTimeoutMinutes * 60 * 1000);
      setSessionExpiry(expiry);
      
      console.log(`AuthContext: Session refreshed, new expiry: ${expiry.toLocaleTimeString()}`);
    } catch (error) {
      console.error('AuthContext: Failed to refresh session:', error);
      throw error;
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
      
      // Oturum süresini ayarla
      const now = new Date();
      const expiry = new Date(now.getTime() + sessionTimeoutMinutes * 60 * 1000);
      setSessionExpiry(expiry);
      
      console.log(`AuthContext: Login completed successfully, session expires at: ${expiry.toLocaleTimeString()}`);
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
      setSessionExpiry(null);
      setRemainingSessionTime(null);
      
      console.log('AuthContext: Logout completed successfully');
    } catch (error) {
      console.error('AuthContext: Error during logout:', error);
      // Hata olsa bile storage ve state'i temizlemeyi dene
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setSessionExpiry(null);
      setRemainingSessionTime(null);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    loading,
    sessionTimeoutMinutes,
    setSessionTimeoutMinutes,
    remainingSessionTime,
    login,
    logout,
    refreshSession
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
