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
  createdAt: string;
  createdBy: string;
}

export interface CreateUserGroupRequest {
  name: string;
  description: string;
  isActive: boolean;
}

export interface UpdateUserGroupRequest {
  name: string;
  description: string;
  isActive: boolean;
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
  const response = await api.get('/api/UserGroup');
  return response.data;
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
