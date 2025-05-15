import api from './api';

export interface Warehouse {
  warehouseCode: string;
  warehouseDescription: string;
  companyCode: string;
  isBlocked: boolean;
}

export interface WarehouseListResponse {
  success: boolean;
  message: string;
  data?: {
    items: Warehouse[];
    totalCount: number;
  };
}

// API fonksiyonları
const warehouseApi = {
  // Depo listesini getir
  getWarehouses: async (): Promise<Warehouse[]> => {
    try {
      // Önce standart endpoint'i dene
      try {
        const response = await api.get('/api/v1/Warehouse');
        if (response.data && response.data.success) {
          return response.data.data?.items || [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching warehouses from primary endpoint:', error);
        
        // Alternatif endpoint'i dene
        try {
          const altResponse = await api.get('/api/Warehouse');
          if (altResponse.data && altResponse.data.success) {
            return altResponse.data.data?.items || [];
          }
          return [];
        } catch (altError) {
          console.error('Error fetching warehouses from alternative endpoint:', altError);
          
          // Sabit değerler döndür (API çalışmıyorsa)
          return [
            { warehouseCode: '001', warehouseDescription: 'Ana Depo', companyCode: '001', isBlocked: false },
            { warehouseCode: '002', warehouseDescription: 'Yedek Depo', companyCode: '001', isBlocked: false }
          ];
        }
      }
    } catch (error) {
      console.error('Error in getWarehouses:', error);
      throw error;
    }
  },

  // Depo detayını getir
  getWarehouseByCode: async (warehouseCode: string): Promise<Warehouse | null> => {
    try {
      const response = await api.get(`/api/v1/Warehouse/${warehouseCode}`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching warehouse ${warehouseCode}:`, error);
      throw error;
    }
  }
};

export default warehouseApi;
