import api from './api';

export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  isActive?: boolean;
}

export interface UpdateRoleRequest {
  name: string;
  description: string;
  isActive?: boolean;
}

const getRoles = async (): Promise<Role[]> => {
  try {
    console.log('Roller getiriliyor - ilk endpoint deneniyor: /api/Role');
    const response = await api.get('/api/Role');
    console.log('Roller başarıyla getirildi:', response.data);
    
    // API yanıtının doğrudan kendisi bir dizi olabilir veya data özelliğinde olabilir
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
      // Backend'in döndürdüğü yanıt bir obje içinde olabilir
      // Örneğin: { roles: [...] } veya { items: [...] }
      for (const key in response.data) {
        if (Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }
    }
    
    // Eğer veri boşsa veya beklenen formatta değilse boş dizi döndür
    console.warn('Roller için API yanıtı boş veya beklenen formatta değil:', response.data);
    return [];
  } catch (error) {
    console.error('İlk endpoint başarısız, alternatif endpoint deneniyor', error);
    try {
      // Alternatif endpoint dene
      const altResponse = await api.get('/api/v1/roles');
      console.log('Roller alternatif endpointten getirildi:', altResponse.data);
      
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
      
      console.warn('Roller için alternatif API yanıtı boş veya beklenen formatta değil:', altResponse.data);
      return [];
    } catch (altError) {
      console.error('Roller getirilemedi, tüm endpointler başarısız oldu', altError);
      return [];
    }
  }
};

const getRole = async (id: string): Promise<Role> => {
  const response = await api.get(`/api/v1/roles/${id}`);
  return response.data;
};

const createRole = async (request: CreateRoleRequest): Promise<Role> => {
  try {
    console.log('Rol oluşturuluyor - ilk endpoint deneniyor: /api/Role');
    const response = await api.post('/api/Role', request);
    console.log('Rol başarıyla oluşturuldu:', response.data);
    return response.data;
  } catch (error) {
    console.error('İlk endpoint başarısız, alternatif endpoint deneniyor', error);
    try {
      console.log('Rol oluşturuluyor - alternatif endpoint deneniyor: /api/v1/roles');
      const altResponse = await api.post('/api/v1/roles', request);
      console.log('Rol alternatif endpointten başarıyla oluşturuldu:', altResponse.data);
      return altResponse.data;
    } catch (altError) {
      console.error('Rol oluşturulamadı, her iki endpoint de başarısız oldu', altError);
      throw altError;
    }
  }
};

const updateRole = async (id: string, request: UpdateRoleRequest): Promise<Role> => {
  try {
    console.log(`Rol güncelleniyor (${id}) - ilk endpoint deneniyor: /api/Role/${id}`);
    const response = await api.put(`/api/Role/${id}`, request);
    console.log('Rol başarıyla güncellendi:', response.data);
    return response.data;
  } catch (error) {
    console.error('İlk endpoint başarısız, alternatif endpoint deneniyor', error);
    try {
      console.log(`Rol güncelleniyor (${id}) - alternatif endpoint deneniyor: /api/v1/roles/${id}`);
      const altResponse = await api.put(`/api/v1/roles/${id}`, request);
      console.log('Rol alternatif endpointten başarıyla güncellendi:', altResponse.data);
      return altResponse.data;
    } catch (altError) {
      console.error('Rol güncellenemedi, her iki endpoint de başarısız oldu', altError);
      throw altError;
    }
  }
};

const deleteRole = async (id: string): Promise<void> => {
  try {
    console.log(`Rol siliniyor (${id}) - ilk endpoint deneniyor: /api/Role/${id}`);
    await api.delete(`/api/Role/${id}`);
    console.log('Rol başarıyla silindi');
  } catch (error) {
    console.error('İlk endpoint başarısız, alternatif endpoint deneniyor', error);
    try {
      console.log(`Rol siliniyor (${id}) - alternatif endpoint deneniyor: /api/v1/roles/${id}`);
      await api.delete(`/api/v1/roles/${id}`);
      console.log('Rol alternatif endpointten başarıyla silindi');
    } catch (altError) {
      console.error('Rol silinemedi, her iki endpoint de başarısız oldu', altError);
      throw altError;
    }
  }
};

export const roleApi = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
};
