import api from './api';

export interface User {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
}

export interface UpdateUserRequest {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissions?: ModulePermissionDto[];
  createdAt?: string;
  createdBy?: string;
}

export interface ModulePermissionDto {
  moduleName: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
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

const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/api/User');
  return response.data;
};

const getUser = async (id: string): Promise<User> => {
  const response = await api.get(`/api/User/${id}`);
  return response.data;
};

const createUser = async (request: CreateUserRequest): Promise<User> => {
  const response = await api.post('/api/User', request);
  return response.data;
};

const updateUser = async (id: string, request: UpdateUserRequest): Promise<User> => {
  const response = await api.put(`/api/User/${id}`, request);
  return response.data;
};

const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/api/User/${id}`);
};

const getUserGroups = async (): Promise<UserGroup[]> => {
  try {
    console.log('Kullanıcı grupları getiriliyor - ilk endpoint deneniyor: /api/UserGroup');
    const response = await api.get('/api/UserGroup');
    console.log('Kullanıcı grupları başarıyla getirildi:', response.data);
    
    // API yanıtının doğrudan kendisi bir dizi olabilir veya data özelliğinde olabilir
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
      // Backend'in döndürdüğü yanıt bir obje içinde olabilir
      // Örneğin: { userGroups: [...] } veya { items: [...] }
      for (const key in response.data) {
        if (Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }
    }
    
    // Eğer veri boşsa veya beklenen formatta değilse boş dizi döndür
    console.warn('Kullanıcı grupları için API yanıtı boş veya beklenen formatta değil:', response.data);
    return [];
  } catch (error) {
    console.error('İlk endpoint başarısız, alternatif endpoint deneniyor', error);
    try {
      // Alternatif endpoint dene
      const altResponse = await api.get('/api/v1/UserGroup');
      console.log('Kullanıcı grupları alternatif endpointten getirildi:', altResponse.data);
      
      if (Array.isArray(altResponse.data)) {
        return altResponse.data;
      } else if (altResponse.data && Array.isArray(altResponse.data.data)) {
        return altResponse.data.data;
      } else if (altResponse.data && typeof altResponse.data === 'object' && Object.keys(altResponse.data).length > 0) {
        for (const key in altResponse.data) {
          if (Array.isArray(altResponse.data[key])) {
            return altResponse.data[key];
          }
        }
      }
      
      console.warn('Kullanıcı grupları için alternatif API yanıtı boş veya beklenen formatta değil:', altResponse.data);
      return [];
    } catch (altError) {
      console.error('Kullanıcı grupları getirilemedi, tüm endpointler başarısız oldu', altError);
      return [];
    }
  }
};

const getUserGroup = async (id: string): Promise<UserGroup> => {
  const response = await api.get(`/api/UserGroup/${id}`);
  return response.data;
};

const createUserGroup = async (request: CreateUserGroupRequest): Promise<UserGroup> => {
  const response = await api.post('/api/UserGroup', request);
  return response.data;
};

const updateUserGroup = async (id: string, request: UpdateUserGroupRequest): Promise<UserGroup> => {
  const response = await api.put(`/api/UserGroup/${id}`, request);
  return response.data;
};

const deleteUserGroup = async (id: string): Promise<void> => {
  await api.delete(`/api/UserGroup/${id}`);
};

export const userApi = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserGroups,
  getUserGroup,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup
};
