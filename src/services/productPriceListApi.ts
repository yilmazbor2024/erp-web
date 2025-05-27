import axios from 'axios';
import { API_URL } from '../config/constants';

export interface ProductPriceListItem {
  sortOrder: number;
  headerID: string;
  itemTypeCode: string;
  itemTypeDescription: string;
  itemCode: string;
  itemDescription: string;
  colorCode: string;
  colorDescription: string;
  itemDim1Code: string;
  itemDim2Code: string;
  itemDim3Code: string;
  unitOfMeasureCode: string;
  paymentPlanCode: string;
  lineDescription: string;
  birimFiyat: number;
  docCurrencyCode: string;
  isDisabled: boolean;
  disableDate: string;
  validFrom?: string; // Geçerlilik başlangıç tarihi
  validTo?: string;   // Geçerlilik bitiş tarihi
}

export interface ProductPriceListResponse {
  data: ProductPriceListItem[];
  success: boolean;
  message: string;
  error: string | null;
  totalCount?: number; // Toplam kayıt sayısı
}

export interface ProductPriceListParams {
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  companyCode?: number;
  searchText?: string; // Arama metni parametresi
  itemCode?: string;  // Ürün kodu parametresi
}

const productPriceListApi = {
  getPriceList: async (params: ProductPriceListParams): Promise<ProductPriceListResponse> => {
    try {
      console.log('Fiyat listesi için parametreler:', params);
      const token = localStorage.getItem('token');
      
      // Tarih parametrelerini kontrol et ve düzgün formatta gönder
      const apiParams = { ...params };
      if (apiParams.startDate) {
        console.log('Başlangıç tarihi:', apiParams.startDate);
      }
      if (apiParams.endDate) {
        console.log('Bitiş tarihi:', apiParams.endDate);
      }
      
      // Doğru endpoint'i kullan
      const response = await axios.get(`${API_URL}/api/v1/Product/all-price-lists`, {
        params: apiParams,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Fiyat listesi API yanıtı:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Fiyat listesi hatası:', error);
      
      if (error.response && error.response.data) {
        console.error('Sunucu hata yanıtı:', error.response.data);
        return error.response.data;
      }
      
      return {
        data: [], // Boş dizi döndürüyoruz, null yerine
        success: false,
        message: 'Fiyat listesi verileri alınırken bir hata oluştu',
        error: error.message
      };
    }
  }
};

export default productPriceListApi;
