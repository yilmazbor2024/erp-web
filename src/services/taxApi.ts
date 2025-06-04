import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthHeader } from '../utils/authUtils';

export interface TaxType {
  taxTypeCode: string;
  isBlocked: boolean;
  langCode: string;
  taxTypeDescription: string;
}

/**
 * Tüm vergi tiplerini getiren fonksiyon
 * @returns Vergi tipleri listesi
 */
export const getAllTaxTypes = async (): Promise<TaxType[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/tax/types`, {
      headers: getAuthHeader()
    });
    
    console.log('Vergi tipleri başarıyla alındı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Vergi tipleri alınırken hata oluştu:', error);
    throw error;
  }
};

const taxApi = {
  getAllTaxTypes
};

export default taxApi;
