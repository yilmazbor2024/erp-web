import axiosInstance from '../config/axios';
import { ApiResponse, PagedResponse } from '../api-helpers';

// Depolar arası sevk yanıt tipi
export interface WarehouseTransferResponse {
  transferNumber: string;
  operationDate: string;
  operationTime: string;
  sourceWarehouseCode: string;
  sourceWarehouseName: string;
  targetWarehouseCode: string;
  targetWarehouseName: string;
  totalQty: number;
  description: string;
  isCompleted: boolean;
  isLocked: boolean;
  lockedByUser?: string;
  lockDate?: string;
  items: WarehouseTransferItemResponse[];
}

// Depolar arası sevk satır yanıt tipi
export interface WarehouseTransferItemResponse {
  itemCode: string;
  itemName: string;
  colorCode?: string;
  colorName?: string;
  itemDim1Code?: string;
  itemDim1Name?: string;
  quantity: number;
  unitCode?: string;
  barcode?: string;
  lineDescription?: string;
}

// Depolar arası sevk istek tipi
export interface WarehouseTransferRequest {
  sourceWarehouseCode: string;
  targetWarehouseCode: string;
  description?: string;
  items: WarehouseTransferItemRequest[];
}

// Depolar arası sevk satır istek tipi
export interface WarehouseTransferItemRequest {
  itemCode: string;
  colorCode?: string;
  itemDim1Code?: string;
  quantity: number;
  unitCode: string;
  lineDescription?: string;
}

// Depolar arası sevk filtreleme parametreleri
export interface WarehouseTransferFilterParams {
  sourceWarehouseCode?: string;
  targetWarehouseCode?: string;
  startDate?: Date;
  endDate?: Date;
}

// Depo yanıt tipi
export interface WarehouseResponse {
  warehouseCode: string;
  warehouseName: string;
  companyCode: string;
  isBlocked: boolean;
}

const warehouseTransferApi = {
  // Depolar arası sevk listesini getiren fonksiyon
  getWarehouseTransfers: async (params?: WarehouseTransferFilterParams): Promise<WarehouseTransferResponse[]> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.sourceWarehouseCode) {
        queryParams.append('sourceWarehouseCode', params.sourceWarehouseCode);
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
      
      const url = `/api/WarehouseTransfer${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('📡 API: Calling getWarehouseTransfers', { url });
      const response = await axiosInstance.get<ApiResponse<any[]>>(url);
      console.log('📡 API: getWarehouseTransfers response', { status: response.status, data: response.data });
      
      if (response.data.success && response.data.data) {
        // Gelen veriyi frontend modeline dönüştür ve eksik alanları varsayılan değerlerle doldur
        return response.data.data.map((item: any) => ({
          transferNumber: item.transferNumber || '',
          operationDate: item.operationDate || new Date().toISOString(),
          operationTime: item.operationTime || '',
          sourceWarehouseCode: item.sourceWarehouseCode || '',
          sourceWarehouseName: item.sourceWarehouseName || 'Bilinmeyen Depo',
          targetWarehouseCode: item.targetWarehouseCode || '',
          targetWarehouseName: item.targetWarehouseName || 'Bilinmeyen Depo',
          totalQty: item.totalQty || 0,
          description: item.description || '',
          isCompleted: item.isCompleted || false,
          isLocked: item.isLocked || false,
          lockedByUser: item.lockedByUser || '',
          lockDate: item.lockDate || '',
          items: item.items || []
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error('📡 API Error: getWarehouseTransfers failed', { 
        message: error.message, 
        status: error.response?.status,
        data: error.response?.data
      });
      return [];
    }
  },
  
  // Belirli bir depolar arası sevk kaydını getiren fonksiyon
  getWarehouseTransferByNumber: async (transferNumber: string): Promise<WarehouseTransferResponse | null> => {
    try {
      const response = await axiosInstance.get<ApiResponse<WarehouseTransferResponse>>(`/api/WarehouseTransfer/${transferNumber}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        console.warn(`API: WarehouseTransfer/${transferNumber} endpoint returned success=false or no data`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`API: Error fetching warehouse transfer ${transferNumber}`, error);
      return null;
    }
  },
  
  // Yeni bir depolar arası sevk kaydı oluşturan fonksiyon
  createWarehouseTransfer: async (request: WarehouseTransferRequest): Promise<string | null> => {
    try {
      const response = await axiosInstance.post<ApiResponse<string>>('/api/WarehouseTransfer', request);
      
      if (response.data.success && response.data.data) {
        return response.data.data; // Oluşturulan sevk numarası
      } else {
        console.warn('API: WarehouseTransfer create endpoint returned success=false or no data', response.data);
        return null;
      }
    } catch (error) {
      console.error('API: Error creating warehouse transfer', error);
      return null;
    }
  },
  
  // Depolar arası sevk kaydını onaylayan fonksiyon
  approveWarehouseTransfer: async (transferNumber: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post<ApiResponse<boolean>>(`/api/WarehouseTransfer/${transferNumber}/approve`);
      
      if (response.data.success && response.data.data) {
        return true;
      } else {
        console.warn(`API: WarehouseTransfer/${transferNumber}/approve endpoint returned success=false or no data`, response.data);
        return false;
      }
    } catch (error) {
      console.error(`API: Error approving warehouse transfer ${transferNumber}`, error);
      return false;
    }
  },
  
  // Depolar arası sevk kaydını iptal eden fonksiyon
  cancelWarehouseTransfer: async (transferNumber: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post<ApiResponse<boolean>>(`/api/WarehouseTransfer/${transferNumber}/cancel`);
      
      if (response.data.success && response.data.data) {
        return true;
      } else {
        console.warn(`API: WarehouseTransfer/${transferNumber}/cancel endpoint returned success=false or no data`, response.data);
        return false;
      }
    } catch (error) {
      console.error(`API: Error canceling warehouse transfer ${transferNumber}`, error);
      return false;
    }
  },
  
  // Depolar arası sevk kaydını kilitleyen fonksiyon
  lockWarehouseTransfer: async (transferNumber: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post<ApiResponse<boolean>>(`/api/WarehouseTransfer/${transferNumber}/lock`);
      
      if (response.data.success && response.data.data) {
        return true;
      } else {
        console.warn(`API: WarehouseTransfer/${transferNumber}/lock endpoint returned success=false or no data`, response.data);
        return false;
      }
    } catch (error) {
      console.error(`API: Error locking warehouse transfer ${transferNumber}`, error);
      return false;
    }
  },
  
  // Depolar arası sevk kaydının kilidini açan fonksiyon
  unlockWarehouseTransfer: async (transferNumber: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post<ApiResponse<boolean>>(`/api/WarehouseTransfer/${transferNumber}/unlock`);
      
      if (response.data.success && response.data.data) {
        return true;
      } else {
        console.warn(`API: WarehouseTransfer/${transferNumber}/unlock endpoint returned success=false or no data`, response.data);
        return false;
      }
    } catch (error) {
      console.error(`API: Error unlocking warehouse transfer ${transferNumber}`, error);
      return false;
    }
  },
  
  // Belirli bir sevk kaydının satır detaylarını getiren fonksiyon
  getWarehouseTransferItems: async (transferNumber: string): Promise<WarehouseTransferItemResponse[]> => {
    try {
      console.log('📡 API: Calling getWarehouseTransferItems', { transferNumber });
      const response = await axiosInstance.get<ApiResponse<WarehouseTransferItemResponse[]>>(`/api/WarehouseTransfer/${transferNumber}/items`);
      console.log('📡 API: getWarehouseTransferItems response', { status: response.status, data: response.data });
      
      if (response.data.success && response.data.data) {
        // Gelen veriyi frontend modeline dönüştür ve eksik alanları varsayılan değerlerle doldur
        return response.data.data.map((item: any) => ({
          itemCode: item.itemCode || '',
          itemName: item.itemName || 'Bilinmeyen Ürün',
          colorCode: item.colorCode || '',
          colorName: item.colorName || '',
          itemDim1Code: item.itemDim1Code || '',
          itemDim1Name: item.itemDim1Name || '',
          quantity: item.quantity || 0,
          unitCode: item.unitCode || '',
          barcode: item.barcode || '',
          lineDescription: item.lineDescription || ''
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error(`📡 API Error: getWarehouseTransferItems failed for ${transferNumber}`, { 
        message: error.message, 
        status: error.response?.status,
        data: error.response?.data
      });
      return [];
    }
  },
  
  // Depoları getiren fonksiyon
  getWarehouses: async (): Promise<WarehouseResponse[]> => {
    try {
      console.log('📡 API: Calling getWarehouses');
      const response = await axiosInstance.get<ApiResponse<WarehouseResponse[]>>('/api/WarehouseTransfer/warehouses');
      console.log('📡 API: getWarehouses response', { status: response.status, data: response.data });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        console.warn('API: WarehouseTransfer/warehouses endpoint returned success=false or no data', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('API: Error fetching warehouses', { 
        message: error.message, 
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      return [];
    }
  }
};

export default warehouseTransferApi;
