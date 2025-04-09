import { create } from 'zustand';
import { authApi, User } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const userData = await authApi.getCurrentUser();
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('Login attempt with:', { email });
      const response = await authApi.login({
        email,
        password
      });
      console.log('Login successful:', response);
      
      // Token'ı kaydet
      localStorage.setItem('accessToken', response.token);
      
      // Kullanıcı bilgilerini al
      const userData = await authApi.getCurrentUser();
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Login failed:', error);
      set({ error: 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      await authApi.logout();
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Logout failed:', error);
      set({ error: 'Çıkış yapılırken bir hata oluştu.', isLoading: false });
      throw error;
    }
  },
}));

export default useAuthStore;
