import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, getAuthToken, setAuthToken } from '../config/constants';

// Auth API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Mixed content sorununu çözmek için withCredentials ekledik
  withCredentials: false,
});

// Request interceptor - token eklemek için
apiClient.interceptors.request.use(
  (config) => {
    // Login isteği için token eklemeye gerek yok
    if (config.url === API_ENDPOINTS.AUTH.LOGIN) {
      return config;
    }
    
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error.message || 'Bilinmeyen hata');
    return Promise.reject(error);
  }
);

// console.log('Auth API base URL:', API_BASE_URL);

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
      console.log('Login attempt with:', credentials.email);
      // API'nin doğru endpoint'ini kullan (küçük harfle 'auth')
      const loginEndpoint = '/api/v1/auth/login'; // Başında / ile
      console.log('Using endpoint:', loginEndpoint);
      console.log('API base URL:', API_BASE_URL);
      
      // Göreceli yol kullanıyoruz
      // API_BASE_URL boş olduğunda doğrudan endpoint'i kullan
      const fullUrl = API_BASE_URL ? 
        (API_BASE_URL.endsWith('/') ? 
          `${API_BASE_URL}${loginEndpoint.substring(1)}` : 
          `${API_BASE_URL}${loginEndpoint}`) : 
        loginEndpoint;
        
      console.log('Full login URL:', fullUrl);
      
      try {
        const response = await axios.post<LoginResponse>(fullUrl, credentials, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
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
      } catch (axiosError: any) {
        console.error('Login request failed with error:', {
          message: axiosError.message,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            baseURL: axiosError.config?.baseURL,
            headers: axiosError.config?.headers
          }
        });
        throw axiosError;
      }
    } catch (error) {
      console.error('Login error (outer):', error);
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