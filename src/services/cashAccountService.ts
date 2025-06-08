import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface CashAccount {
  cashAccountCode: string;
  cashAccountDescription: string;
  currencyCode: string;
  currencyDescription: string;
  companyCode: string;
  officeCode: string;
  officeDescription: string;
  storeCode: string;
  isBlocked: boolean;
}

export const fetchCashAccounts = async (): Promise<CashAccount[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/CashAccount`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching cash accounts:', error);
    throw error;
  }
};
