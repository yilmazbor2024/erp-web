import axios from '../config/axios';
import { API_BASE_URL } from '../config/constants';

const API_URL = `/api/Database`;

export interface DatabaseDto {
  id: string;
  databaseName: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxNumber?: string;
  companyTaxOffice?: string;
  serverName: string;
  serverPort?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export interface CreateDatabaseRequest {
  databaseName: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxNumber?: string;
  companyTaxOffice?: string;
  connectionString: string;
  serverName?: string;
  serverPort?: string;
}

export interface UpdateDatabaseRequest {
  databaseName: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxNumber?: string;
  companyTaxOffice?: string;
  connectionString: string;
  serverName?: string;
  serverPort?: string;
  isActive: boolean;
}

export const getDatabases = async (): Promise<DatabaseDto[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getDatabase = async (id: string): Promise<DatabaseDto> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createDatabase = async (database: CreateDatabaseRequest): Promise<DatabaseDto> => {
  const response = await axios.post(API_URL, database);
  return response.data;
};

export const updateDatabase = async (id: string, database: UpdateDatabaseRequest): Promise<void> => {
  await axios.put(`${API_URL}/${id}`, database);
};

export const deleteDatabase = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
