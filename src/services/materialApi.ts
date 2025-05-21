import axiosInstance from '../config/axios';
import { ApiResponse } from '../api-helpers';

// Malzeme tipi tanımlamaları
export interface Material {
  materialCode: string;
  materialDescription: string;
  productTypeCode: string;
  productTypeDescription: string;
  itemDimTypeCode: string;
  itemDimTypeDescription: string;
  unitOfMeasureCode1: string;
  unitOfMeasureCode2: string;
  companyBrandCode: string;
  usePOS: boolean;
  useStore: boolean;
  useRoll: boolean;
  useBatch: boolean;
  generateSerialNumber: boolean;
  useSerialNumber: boolean;
  isUTSDeclaratedItem: boolean;
  createdDate: string;
  lastUpdatedDate: string;
  isBlocked: boolean;
}

export interface MaterialListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  productTypeCode?: string;
  isBlocked?: boolean;
}

export interface MaterialListResponse {
  items: Material[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export interface CreateMaterialRequest {
  materialCode: string;
  materialDescription: string;
  productTypeCode: string;
  itemDimTypeCode: string;
  unitOfMeasureCode1: string;
  unitOfMeasureCode2?: string;
  companyBrandCode?: string;
  usePOS?: boolean;
  useStore?: boolean;
  useRoll?: boolean;
  useBatch?: boolean;
  generateSerialNumber?: boolean;
  useSerialNumber?: boolean;
  isUTSDeclaratedItem?: boolean;
  isBlocked?: boolean;
}

export interface UpdateMaterialRequest {
  materialDescription?: string;
  productTypeCode?: string;
  itemDimTypeCode?: string;
  unitOfMeasureCode1?: string;
  unitOfMeasureCode2?: string;
  companyBrandCode?: string;
  usePOS?: boolean;
  useStore?: boolean;
  useRoll?: boolean;
  useBatch?: boolean;
  generateSerialNumber?: boolean;
  useSerialNumber?: boolean;
  isUTSDeclaratedItem?: boolean;
  isBlocked?: boolean;
}

// API fonksiyonları
const materialApi = {
  // Malzeme listesini getir
  async getMaterials(params?: MaterialListParams): Promise<MaterialListResponse> {
    try {
      // API endpoint için ItemTypeCode=2 parametresi ekliyoruz
      const queryParams = new URLSearchParams();
      
      if (params) {
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        
        // Frontend-Backend alan adı eşleştirmesi
        if (params.sortBy) {
          // Frontend alan adlarını backend alan adlarına dönüştür
          const fieldMappings: Record<string, string> = {
            'materialCode': 'ProductCode',
            'materialDescription': 'ProductDescription',
            // Diğer alan eşleştirmeleri buraya eklenebilir
          };
          
          // Eğer eşleştirme varsa, dönüştürülmüş adı kullan, yoksa orijinal adı kullan
          const backendFieldName = fieldMappings[params.sortBy] || params.sortBy;
          queryParams.append('sortBy', backendFieldName);
        }
        
        if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
        if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
        if (params.productTypeCode) queryParams.append('productTypeCode', params.productTypeCode);
        if (params.isBlocked !== undefined) queryParams.append('isBlocked', params.isBlocked.toString());
      }
      
      // Malzemeler için ItemTypeCode=2 parametresi ekliyoruz
      queryParams.append('itemTypeCode', '2');
      
      const response = await axiosInstance.get(`/api/Item?${queryParams.toString()}`);
      
      if (response.data && response.data.success) {
        // API yanıtını frontend modeliyle eşleştir
        const data = response.data.data;
        
        return {
          items: data.items.map((item: any) => ({
            materialCode: item.itemCode,
            materialDescription: item.itemDescription,
            productTypeCode: item.productTypeCode,
            productTypeDescription: item.productTypeDescription,
            itemDimTypeCode: item.itemDimTypeCode,
            itemDimTypeDescription: item.itemDimTypeDescription,
            unitOfMeasureCode1: item.unitOfMeasureCode1,
            unitOfMeasureCode2: item.unitOfMeasureCode2,
            companyBrandCode: item.companyBrandCode,
            usePOS: item.usePOS,
            useStore: item.useStore,
            useRoll: item.useRoll,
            useBatch: item.useBatch,
            generateSerialNumber: item.generateSerialNumber,
            useSerialNumber: item.useSerialNumber,
            isUTSDeclaratedItem: item.isUTSDeclaratedItem,
            createdDate: item.createdDate,
            lastUpdatedDate: item.lastUpdatedDate,
            isBlocked: item.isBlocked
          })),
          totalCount: data.totalCount,
          pageCount: data.pageCount,
          currentPage: data.currentPage,
          pageSize: data.pageSize
        };
      }
      
      throw new Error('Failed to fetch materials');
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  },
  
  // Malzeme detayını getir
  async getMaterialDetail(materialCode: string): Promise<Material> {
    try {
      // Malzemeler için ItemTypeCode=2 parametresi ekliyoruz
      const queryParams = new URLSearchParams();
      queryParams.append('itemTypeCode', '2');
      
      const response = await axiosInstance.get(`/api/Item/${materialCode}?${queryParams.toString()}`);
      
      if (response.data && response.data.success) {
        // API yanıtını frontend modeliyle eşleştir
        const item = response.data.data;
        
        return {
          materialCode: item.itemCode,
          materialDescription: item.itemDescription,
          productTypeCode: item.productTypeCode,
          productTypeDescription: item.productTypeDescription,
          itemDimTypeCode: item.itemDimTypeCode,
          itemDimTypeDescription: item.itemDimTypeDescription,
          unitOfMeasureCode1: item.unitOfMeasureCode1,
          unitOfMeasureCode2: item.unitOfMeasureCode2,
          companyBrandCode: item.companyBrandCode,
          usePOS: item.usePOS,
          useStore: item.useStore,
          useRoll: item.useRoll,
          useBatch: item.useBatch,
          generateSerialNumber: item.generateSerialNumber,
          useSerialNumber: item.useSerialNumber,
          isUTSDeclaratedItem: item.isUTSDeclaratedItem,
          createdDate: item.createdDate,
          lastUpdatedDate: item.lastUpdatedDate,
          isBlocked: item.isBlocked
        };
      }
      
      throw new Error('Failed to fetch material details');
    } catch (error) {
      console.error('Error fetching material details:', error);
      throw error;
    }
  },
  
  // Yeni malzeme oluştur
  async createMaterial(material: CreateMaterialRequest): Promise<Material> {
    try {
      // Request modelini ItemController'ın beklediği modele dönüştür
      const createItemRequest = {
        itemCode: material.materialCode,
        itemDescription: material.materialDescription,
        itemTypeCode: 2, // Malzeme tipi kodu
        productTypeCode: material.productTypeCode,
        itemDimTypeCode: material.itemDimTypeCode,
        unitOfMeasureCode1: material.unitOfMeasureCode1,
        unitOfMeasureCode2: material.unitOfMeasureCode2,
        companyBrandCode: material.companyBrandCode,
        usePOS: material.usePOS,
        useStore: material.useStore,
        useRoll: material.useRoll,
        useBatch: material.useBatch,
        generateSerialNumber: material.generateSerialNumber,
        useSerialNumber: material.useSerialNumber,
        isUTSDeclaratedItem: material.isUTSDeclaratedItem,
        isBlocked: material.isBlocked
      };
      
      const response = await axiosInstance.post('/api/Item', createItemRequest);
      
      if (response.data && response.data.success) {
        // API yanıtını frontend modeliyle eşleştir
        const item = response.data.data;
        
        return {
          materialCode: item.itemCode,
          materialDescription: item.itemDescription,
          productTypeCode: item.productTypeCode,
          productTypeDescription: item.productTypeDescription,
          itemDimTypeCode: item.itemDimTypeCode,
          itemDimTypeDescription: item.itemDimTypeDescription,
          unitOfMeasureCode1: item.unitOfMeasureCode1,
          unitOfMeasureCode2: item.unitOfMeasureCode2,
          companyBrandCode: item.companyBrandCode,
          usePOS: item.usePOS,
          useStore: item.useStore,
          useRoll: item.useRoll,
          useBatch: item.useBatch,
          generateSerialNumber: item.generateSerialNumber,
          useSerialNumber: item.useSerialNumber,
          isUTSDeclaratedItem: item.isUTSDeclaratedItem,
          createdDate: item.createdDate,
          lastUpdatedDate: item.lastUpdatedDate,
          isBlocked: item.isBlocked
        };
      }
      
      throw new Error('Failed to create material');
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  },
  
  // Malzeme güncelle
  async updateMaterial(materialCode: string, material: UpdateMaterialRequest): Promise<Material> {
    try {
      // Request modelini ItemController'ın beklediği modele dönüştür
      const updateItemRequest = {
        itemDescription: material.materialDescription,
        itemTypeCode: 2, // Malzeme tipi kodu
        productTypeCode: material.productTypeCode,
        itemDimTypeCode: material.itemDimTypeCode,
        unitOfMeasureCode1: material.unitOfMeasureCode1,
        unitOfMeasureCode2: material.unitOfMeasureCode2,
        companyBrandCode: material.companyBrandCode,
        usePOS: material.usePOS,
        useStore: material.useStore,
        useRoll: material.useRoll,
        useBatch: material.useBatch,
        generateSerialNumber: material.generateSerialNumber,
        useSerialNumber: material.useSerialNumber,
        isUTSDeclaratedItem: material.isUTSDeclaratedItem,
        isBlocked: material.isBlocked
      };
      
      // Malzemeler için ItemTypeCode=2 parametresi ekliyoruz
      const queryParams = new URLSearchParams();
      queryParams.append('itemTypeCode', '2');
      
      const response = await axiosInstance.put(`/api/Item/${materialCode}?${queryParams.toString()}`, updateItemRequest);
      
      if (response.data && response.data.success) {
        // API yanıtını frontend modeliyle eşleştir
        const item = response.data.data;
        
        return {
          materialCode: item.itemCode,
          materialDescription: item.itemDescription,
          productTypeCode: item.productTypeCode,
          productTypeDescription: item.productTypeDescription,
          itemDimTypeCode: item.itemDimTypeCode,
          itemDimTypeDescription: item.itemDimTypeDescription,
          unitOfMeasureCode1: item.unitOfMeasureCode1,
          unitOfMeasureCode2: item.unitOfMeasureCode2,
          companyBrandCode: item.companyBrandCode,
          usePOS: item.usePOS,
          useStore: item.useStore,
          useRoll: item.useRoll,
          useBatch: item.useBatch,
          generateSerialNumber: item.generateSerialNumber,
          useSerialNumber: item.useSerialNumber,
          isUTSDeclaratedItem: item.isUTSDeclaratedItem,
          createdDate: item.createdDate,
          lastUpdatedDate: item.lastUpdatedDate,
          isBlocked: item.isBlocked
        };
      }
      
      throw new Error('Failed to update material');
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  },
  
  // Malzeme sil
  async deleteMaterial(materialCode: string): Promise<void> {
    try {
      // Malzemeler için ItemTypeCode=2 parametresi ekliyoruz
      const queryParams = new URLSearchParams();
      queryParams.append('itemTypeCode', '2');
      
      const response = await axiosInstance.delete(`/api/Item/${materialCode}?${queryParams.toString()}`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  },
  
  // Malzeme tiplerini getir
  async getMaterialTypes(): Promise<{ code: string; description: string }[]> {
    try {
      // Malzeme tiplerini getirmek için itemTypeCode=2 parametresi ekliyoruz
      const queryParams = new URLSearchParams();
      queryParams.append('itemTypeCode', '2');
      
      const response = await axiosInstance.get(`/api/Item/product-types?${queryParams.toString()}`);
      
      if (response.data && response.data.success) {
        return response.data.data.map((type: any) => ({
          code: type.productTypeCode,
          description: type.productTypeDescription
        }));
      }
      
      throw new Error('Failed to fetch material types');
    } catch (error) {
      console.error('Error fetching material types:', error);
      throw error;
    }
  },
  
  // Ölçü birimlerini getir
  async getUnitOfMeasures(): Promise<{ code: string; description: string }[]> {
    try {
      const response = await axiosInstance.get('/api/Item/unit-of-measures');
      
      if (response.data && response.data.success) {
        return response.data.data.map((unit: any) => ({
          code: unit.unitOfMeasureCode,
          description: unit.unitOfMeasureDescription
        }));
      }
      
      throw new Error('Failed to fetch unit of measures');
    } catch (error) {
      console.error('Error fetching unit of measures:', error);
      throw error;
    }
  }
};

export default materialApi;
