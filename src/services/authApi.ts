import api from './api';

export interface LoginRequest {
  username: string;
  password: string;
  deviceInfo: string;
}

export interface LoginResponse {
  id: string;
  accessToken: string;
  refreshToken: string;
  username: string;
  email: string;
  roles: string[];
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
}

const login = async (request: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post('/api/Auth/login', request);
  return response.data;
};

const register = async (request: RegisterRequest): Promise<RegisterResponse> => {
  const response = await api.post('/api/Auth/register', request);
  return response.data;
};

const logout = async (): Promise<void> => {
  await api.post('/api/Auth/logout');
};

export const authApi = {
  login,
  register,
  logout
}; 