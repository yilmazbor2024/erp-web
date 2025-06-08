import axios from 'axios';
import { getAuthToken } from '../utils/auth';
import { API_BASE_URL } from '../config/constants';

export interface CashTransaction {
  documentDate: string;
  documentNumber: string;
  cashTransTypeCode: number;
  cashTransTypeDescription: string;
  cashTransNumber: string;
  refNumber: string;
  glTypeCode: string;
  description: string;
  sumDescription: string;
  applicationCode: string;
  applicationDescription: string;
  currAccTypeCode: string;
  currAccTypeDescription: string;
  currAccCode: string;
  currAccDescription: string;
  glAccCode: string;
  glAccDescription: string;
  lineDescription: string;
  chequeTransTypeDescription: string;
  doc_CurrencyCode: string;
  doc_Debit: number;
  doc_Credit: number;
  doc_Balance: number;
  loc_CurrencyCode: string;
  loc_ExchangeRate: number;
  loc_Debit: number;
  loc_Credit: number;
  loc_Balance: number;
  cashAccountCode: string;
}

export interface CashSummary {
  cashAccountCode: string;
  cashAccountDescription: string;
  currencyCode: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export const fetchCashTransactions = async (
  startDate: string,
  endDate: string,
  cashAccountCode?: string
): Promise<CashTransaction[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    let url = `${API_BASE_URL}/api/CashTransaction/transactions?startDate=${startDate}&endDate=${endDate}`;
    if (cashAccountCode) {
      url += `&cashAccountCode=${cashAccountCode}`;
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching cash transactions:', error);
    throw error;
  }
};

export const fetchCashSummary = async (): Promise<CashSummary[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`${API_BASE_URL}/api/CashTransaction/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching cash summary:', error);
    throw error;
  }
};
