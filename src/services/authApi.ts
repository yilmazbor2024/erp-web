import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Auth API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('Auth API base URL:', API_BASE_URL);

// Login request interface
interface LoginRequest {
  email: string;
  password: string;
}

// Login response interface
interface LoginResponse {
  token: string;
  expiration: string;
}

// Auth API methods
export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log('Attempting login with credentials:', { email: credentials.email, passwordLength: credentials.password?.length || 0 });
      const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
      
      console.log('Login response:', { 
        status: response.status, 
        hasToken: !!response.data.token,
        tokenLength: response.data.token?.length || 0,
        expiration: response.data.expiration
      });
      
      // Store token in localStorage for persistent auth
      if (response.data.token) {
        console.log('Storing access token in localStorage');
        localStorage.setItem('accessToken', response.data.token);
        // Ayrıca eski token anahtarında da saklayalım (geriye dönük uyumluluk)
        localStorage.setItem('token', response.data.token);
      } else {
        console.error('No token received from login API');
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    console.log('Logging out and removing tokens');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const isTokenExists = !!token;
    console.log('Authentication check:', isTokenExists ? 'Token exists' : 'No token found');
    return isTokenExists;
  }
}; 