import axiosInstance from '../config/axios';
import { ApiResponse, PagedResponse } from '../api-helpers';

// Tedarikçi tipleri
export type VendorDetailResponse = any;
export type VendorFilterRequest = any;
export type VendorUpdateRequest = any;
export type VendorCreateRequest = any;
export type VendorUpdateResponse = any;
export type VendorCreateResponse = any;
export type VendorListResponse = any;
export type VendorResponse = any;

// Tedarikçi API servisi
const vendorApi = {
  // Tedarikçi listesini getir
  getVendors: async (filter: VendorFilterRequest): Promise<ApiResponse<PagedResponse<VendorListResponse>>> => {
    console.log('API: Fetching vendors with filter:', filter);
    try {
      // API çağrısını yap - müşteri endpoint'ini kullanıyoruz
      // Tedarikçileri filtrelemek için doğru parametreleri kullanalım
      const vendorFilter = { 
        pageNumber: filter.page || 1,
        pageSize: filter.pageSize || 10,
        customerName: filter.searchTerm,
        // API yanıtında customerTypeCode=0 olarak geliyor, bu nedenle filtreleme yapmayacağız
        // currAccTypeCode: 1,  // Tedarikçi tipi kodu (1: Tedarikçi, 3: Müşteri)
        sortColumn: filter.sortBy,
        sortDirection: filter.sortDirection
      };
      
      console.log('API: Using vendor filter:', vendorFilter);
      const response = await axiosInstance.get('/api/v1/Customer/customers', { params: vendorFilter });
      
      // API yanıtını detaylı logla
      console.log('API: Vendors response status:', response.status);
      console.log('API: Vendors response headers:', response.headers);
      console.log('API: Vendors response data:', response.data);
      
      if (response.data) {
        console.log('API: Vendors response data keys:', Object.keys(response.data));
        if (response.data.data) {
          console.log('API: Vendors response data.data keys:', Object.keys(response.data.data));
          if (response.data.data.items) {
            console.log('API: Vendors count:', response.data.data.items.length);
          }
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('API: Error fetching vendors:', error);
      throw error;
    }
  },

  // Tedarikçi detayını getir
  getVendorByCode: async (vendorCode: string): Promise<ApiResponse<VendorDetailResponse>> => {
    console.log('API: Fetching vendor by code:', vendorCode);
    const response = await axiosInstance.get<ApiResponse<VendorDetailResponse>>(`/api/v1/VendorBasic/${vendorCode}`);
    console.log('API: Vendor detail response:', response.data);
    return response.data;
  },

  // Yeni tedarikçi oluştur
  createVendor: async (vendorData: any): Promise<ApiResponse<VendorCreateResponse>> => {
    console.log('API: Creating vendor with data:', vendorData);
    const response = await axiosInstance.post<ApiResponse<VendorCreateResponse>>('/api/v1/VendorBasic', vendorData);
    console.log('API: Create vendor response:', response.data);
    return response.data;
  },

  // Tedarikçi güncelle
  updateVendor: async (vendorCode: string, vendorData: VendorUpdateRequest): Promise<ApiResponse<VendorUpdateResponse>> => {
    console.log('API: Updating vendor with code:', vendorCode, 'and data:', vendorData);
    const response = await axiosInstance.put<ApiResponse<VendorUpdateResponse>>(`/api/v1/VendorBasic/${vendorCode}`, vendorData);
    console.log('API: Update vendor response:', response.data);
    return response.data;
  },

  // Tedarikçi sil
  deleteVendor: async (vendorCode: string): Promise<ApiResponse<any>> => {
    console.log('API: Deleting vendor with code:', vendorCode);
    const response = await axiosInstance.delete<ApiResponse<any>>(`/api/v1/VendorBasic/${vendorCode}`);
    console.log('API: Delete vendor response:', response.data);
    return response.data;
  }
};

export default vendorApi;
