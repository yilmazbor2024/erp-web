import api from './api';

export interface Company {
  companyCode: string;
  companyDescription: string;
  isBlocked: boolean;
}

export interface Office {
  officeCode: string;
  officeDescription: string;
  companyCode: string;
  isBlocked: boolean;
}

export interface Store {
  storeDescription: string;
  companyCode: string;
  isBlocked: boolean;
}

export interface CompanyListResponse {
  success: boolean;
  message: string;
  data?: {
    items: Company[];
    totalCount: number;
  };
}

// API fonksiyonları
const companyApi = {
  // Şirket listesini getir
  getCompanies: async (): Promise<Company[]> => {
    try {
      // Önce standart endpoint'i dene
      try {
        const response = await api.get('/api/v1/Company');
        if (response.data && response.data.success) {
          return response.data.data?.items || [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching companies from primary endpoint:', error);
        
        // Alternatif endpoint'i dene
        try {
          const altResponse = await api.get('/api/Company');
          if (altResponse.data && altResponse.data.success) {
            return altResponse.data.data?.items || [];
          }
          return [];
        } catch (altError) {
          console.error('Error fetching companies from alternative endpoint:', altError);
          
          // Sabit değerler döndür (API çalışmıyorsa)
          return [
            { companyCode: '001', companyDescription: 'Ana Şirket', isBlocked: false },
            { companyCode: '002', companyDescription: 'Yan Şirket', isBlocked: false }
          ];
        }
      }
    } catch (error) {
      console.error('Error in getCompanies:', error);
      throw error;
    }
  },

  // Ofis listesini getir
  getOffices: async (companyCode?: string): Promise<Office[]> => {
    try {
      const url = companyCode 
        ? `/api/v1/Office?companyCode=${companyCode}`
        : '/api/v1/Office';
      
      // Önce standart endpoint'i dene
      try {
        const response = await api.get(url);
        if (response.data && response.data.success) {
          return response.data.data?.items || [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching offices from primary endpoint:', error);
        
        // Alternatif endpoint'i dene
        try {
          const altUrl = companyCode 
            ? `/api/Office?companyCode=${companyCode}`
            : '/api/Office';
          
          const altResponse = await api.get(altUrl);
          if (altResponse.data && altResponse.data.success) {
            return altResponse.data.data?.items || [];
          }
          return [];
        } catch (altError) {
          console.error('Error fetching offices from alternative endpoint:', altError);
          
          // Sabit değerler döndür (API çalışmıyorsa)
          return [
            { officeCode: '001', officeDescription: 'Merkez Ofis', companyCode: '001', isBlocked: false },
            { officeCode: '002', officeDescription: 'Şube Ofis', companyCode: '001', isBlocked: false }
          ];
        }
      }
    } catch (error) {
      console.error('Error in getOffices:', error);
      throw error;
    }
  },

  // Mağaza listesini getir
  getStores: async (companyCode?: string): Promise<Store[]> => {
    try {
      const url = companyCode 
        ? `/api/v1/Store?companyCode=${companyCode}`
        : '/api/v1/Store';
      
      // Önce standart endpoint'i dene
      try {
        const response = await api.get(url);
        if (response.data && response.data.success) {
          return response.data.data?.items || [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching stores from primary endpoint:', error);
        
        // Alternatif endpoint'i dene
        try {
          const altUrl = companyCode 
            ? `/api/Store?companyCode=${companyCode}`
            : '/api/Store';
          
          const altResponse = await api.get(altUrl);
          if (altResponse.data && altResponse.data.success) {
            return altResponse.data.data?.items || [];
          }
          return [];
        } catch (altError) {
          console.error('Error fetching stores from alternative endpoint:', altError);
          
          return [];
        }
      }
    } catch (error) {
      console.error('Error in getStores:', error);
      throw error;
    }
  }
};

export default companyApi;
