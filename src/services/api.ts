import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5180',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response interceptor error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Models
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiration: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
  clientUrl: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User Models
export interface User {
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

export interface CreateUserRequest {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  userGroupId?: string;
  roles: string[];
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  userGroupId?: string;
  roles: string[];
  isActive: boolean;
}

// Order Models
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  status: string;
  totalAmount: number;
}

// Product Models
export interface Product {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  stockQuantity: number;
  status: string;
}

// Role Models
export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface UserInRoleDto {
  id: string;
  userName: string;
  email: string;
  userCode: string;
  firstName: string;
  lastName: string;
}

// UserGroup Models
export interface ModulePermissionDto {
  moduleName: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface UserGroupDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissions: ModulePermissionDto[];
}

export interface CreateUserGroupRequest {
  name: string;
  description: string;
  permissions: ModulePermissionDto[];
}

export interface UpdateUserGroupRequest {
  name: string;
  description: string;
  permissions: ModulePermissionDto[];
}

// Auth API
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/api/Auth/login', data).then(response => response.data),
  register: (data: RegisterRequest) => api.post('/api/Auth/register', data).then(response => response.data),
  logout: () => api.post('/api/Auth/logout').then(response => response.data),
  forgotPassword: (data: ForgotPasswordRequest) => api.post('/api/Auth/forgot-password', data).then(response => response.data),
  resetPassword: (data: ResetPasswordRequest) => api.post('/api/Auth/reset-password', data).then(response => response.data),
  changePassword: (data: ChangePasswordRequest) => api.post('/api/Auth/change-password', data).then(response => response.data),
  getCurrentUser: () => api.get<User>('/api/User/current').then(response => response.data),
};

// User API
export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/User/current');
    return response.data;
  },

  list: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/api/User');
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/api/User/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/api/User', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>(`/api/User/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/User/${id}`);
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/api/User/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/api/User/change-password', { currentPassword, newPassword });
  }
};

// Order API
export const orderApi = {
  list: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/api/Order');
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/api/Order/${id}`);
    return response.data;
  },

  create: async (order: Partial<Order>): Promise<Order> => {
    const response = await api.post<Order>('/api/Order', order);
    return response.data;
  },

  update: async (id: string, order: Partial<Order>): Promise<Order> => {
    const response = await api.put<Order>(`/api/Order/${id}`, order);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/Order/${id}`);
  }
};

// Product API
export const productApi = {
  list: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/api/Product');
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/api/Product/${id}`);
    return response.data;
  },

  search: async (query: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/api/Product/search?q=${query}`);
    return response.data;
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    const response = await api.post<Product>('/api/Product', product);
    return response.data;
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await api.put<Product>(`/api/Product/${id}`, product);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/Product/${id}`);
  }
};

// Role API
export const roleApi = {
  getRoles: () => api.get<Role[]>('/api/Role').then(response => response.data),
  getRole: (id: string) => api.get<Role>(`/api/Role/${id}`).then(response => response.data),
  createRole: (data: CreateRoleRequest) => api.post<Role>('/api/Role', data).then(response => response.data),
  updateRole: (id: string, data: UpdateRoleRequest) => api.put<Role>(`/api/Role/${id}`, data).then(response => response.data),
  deleteRole: (id: string) => api.delete(`/api/Role/${id}`).then(response => response.data),
  getUsersInRole: (id: string) => api.get<UserInRoleDto[]>(`/api/Role/${id}/users`).then(response => response.data)
};

// UserGroup API
export const userGroupApi = {
  list: async (): Promise<UserGroupDto[]> => {
    const response = await api.get<UserGroupDto[]>('/api/UserGroup');
    return response.data;
  },

  getById: async (id: string): Promise<UserGroupDto> => {
    const response = await api.get<UserGroupDto>(`/api/UserGroup/${id}`);
    return response.data;
  },

  create: async (data: CreateUserGroupRequest): Promise<UserGroupDto> => {
    const response = await api.post<UserGroupDto>('/api/UserGroup', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserGroupRequest): Promise<void> => {
    await api.put(`/api/UserGroup/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/UserGroup/${id}`);
  }
};

export default api;
