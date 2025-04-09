import api from './api';

export interface Role {
  id: string;
  name: string;
  description: string;
  code: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  code: string;
  order: number;
  isActive: boolean;
}

export interface UpdateRoleRequest {
  name: string;
  description: string;
  code: string;
  order: number;
  isActive: boolean;
}

const getRoles = async (): Promise<Role[]> => {
  const response = await api.get('/api/v1/roles');
  return response.data;
};

const getRole = async (id: string): Promise<Role> => {
  const response = await api.get(`/api/v1/roles/${id}`);
  return response.data;
};

const createRole = async (request: CreateRoleRequest): Promise<Role> => {
  const response = await api.post('/api/v1/roles', request);
  return response.data;
};

const updateRole = async (id: string, request: UpdateRoleRequest): Promise<Role> => {
  const response = await api.put(`/api/v1/roles/${id}`, request);
  return response.data;
};

const deleteRole = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/roles/${id}`);
};

export const roleApi = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
};
