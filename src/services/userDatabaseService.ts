import axios from '../config/axios';
import { API_BASE_URL } from '../config/constants';

const API_URL = `/api/UserDatabase`;

export interface UserDatabaseDto {
  id: string;
  userId: string;
  userName: string;
  databaseId: string;
  databaseName: string;
  companyName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export interface CreateUserDatabaseRequest {
  userId: string;
  databaseId: string;
  role: string;
}

export interface UpdateUserDatabaseRequest {
  role: string;
  isActive: boolean;
}

export const getUserDatabases = async (): Promise<UserDatabaseDto[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getUserDatabasesByUser = async (userId: string): Promise<UserDatabaseDto[]> => {
  const response = await axios.get(`${API_URL}/user/${userId}`);
  return response.data;
};

export const getUserDatabasesByDatabase = async (databaseId: string): Promise<UserDatabaseDto[]> => {
  const response = await axios.get(`${API_URL}/database/${databaseId}`);
  return response.data;
};

export const getCurrentUserDatabases = async (): Promise<UserDatabaseDto[]> => {
  const response = await axios.get(`${API_URL}/current-user`);
  return response.data;
};

export const getUserDatabase = async (id: string): Promise<UserDatabaseDto> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createUserDatabase = async (userDatabase: CreateUserDatabaseRequest): Promise<UserDatabaseDto> => {
  const response = await axios.post(API_URL, userDatabase);
  return response.data;
};

export const updateUserDatabase = async (id: string, userDatabase: UpdateUserDatabaseRequest): Promise<void> => {
  await axios.put(`${API_URL}/${id}`, userDatabase);
};

export const deleteUserDatabase = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
