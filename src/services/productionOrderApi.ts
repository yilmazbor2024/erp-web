import axiosInstance from '../config/axios';
import { ApiResponse } from '../api-helpers';

// İmalat fişi yanıt tipi
export interface ProductionOrderResponse {
  innerHeaderId: string;
  orderNumber: string;
  operationDate: string;
  orderDate: string;
  targetWarehouseCode: string;
  targetWarehouseName: string;
  description?: string;
  totalQuantity: number;
  isApproved: boolean;
  approvedDate?: string;
  isLocked: boolean;
  createdUserName: string;
  createdDate: string;
  lastUpdatedUserName?: string;
  lastUpdatedDate?: string;
  items: ProductionOrderItemResponse[];
}

// İmalat fişi satır yanıt tipi
export interface ProductionOrderItemResponse {
  innerLineId: string;
  lineNumber: number;
  itemCode: string;
  itemName: string;
  colorCode?: string;
  colorName?: string;
  itemDim1Code?: string;
  itemDim1Name?: string;
  itemDim2Code?: string;
  itemDim2Name?: string;
  itemDim3Code?: string;
  itemDim3Name?: string;
  unitCode: string;
  unitName: string;
  quantity: number;
  description?: string;
}

// İmalat fişi istek tipi
export interface ProductionOrderRequest {
  targetWarehouseCode: string;
  description?: string;
  operationDate?: string;
  items: ProductionOrderItemRequest[];
}

// İmalat fişi satır istek tipi
export interface ProductionOrderItemRequest {
  itemCode: string;
  colorCode?: string;
  itemDim1Code?: string;
  quantity: number;
  lineDescription?: string;
  barcode?: string;
}

// İmalat fişi filtreleme parametreleri
export interface ProductionOrderFilterParams {
  orderNumber?: string;
  targetWarehouseCode?: string;
  startDate?: Date;
  endDate?: Date;
}

// Depo yanıt tipi
export interface WarehouseResponse {
  warehouseCode: string;
  warehouseName: string;
  isDefault: boolean;
}

const productionOrderApi = {
  // İmalat fişi listesini getiren fonksiyon
  getProductionOrders: async (params?: ProductionOrderFilterParams): Promise<ProductionOrderResponse[]> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.orderNumber) {
        queryParams.append('orderNumber', params.orderNumber);
      }
      
      if (params?.targetWarehouseCode) {
        queryParams.append('targetWarehouseCode', params.targetWarehouseCode);
      }
      
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate.toISOString().split('T')[0]);
      }
      
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate.toISOString().split('T')[0]);
      }
      
      const url = `/api/v1/inventory/production-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axiosInstance.get<ApiResponse<ProductionOrderResponse[]>>(url);
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching production orders:', error);
      throw error;
    }
  },
  
  // İmalat fişi detayını getiren fonksiyon
  getProductionOrderByNumber: async (orderNumber: string): Promise<ProductionOrderResponse> => {
    try {
      const response = await axiosInstance.get<ApiResponse<ProductionOrderResponse>>(
        `/api/v1/inventory/production-orders/${orderNumber}`
      );
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching production order ${orderNumber}:`, error);
      throw error;
    }
  },
  
  // İmalat fişi kalemlerini getiren fonksiyon
  getProductionOrderItems: async (orderNumber: string): Promise<ProductionOrderItemResponse[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<ProductionOrderItemResponse[]>>(
        `/api/v1/inventory/production-orders/${orderNumber}/items`
      );
      
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching production order items for ${orderNumber}:`, error);
      throw error;
    }
  },
  
  // Yeni imalat fişi oluşturan fonksiyon
  createProductionOrder: async (request: ProductionOrderRequest): Promise<string> => {
    try {
      const response = await axiosInstance.post<ApiResponse<string>>(
        '/api/v1/inventory/production-orders',
        request
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating production order:', error);
      throw error;
    }
  },
  
  // Depoları getiren fonksiyon
  getWarehouses: async (): Promise<WarehouseResponse[]> => {
    try {
      const response = await axiosInstance.get<ApiResponse<WarehouseResponse[]>>(
        '/api/v1/inventory/production-orders/warehouses'
      );
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw error;
    }
  }
};

export default productionOrderApi;
