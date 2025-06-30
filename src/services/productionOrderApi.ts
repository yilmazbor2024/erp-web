import axiosInstance from '../config/axios';
import { ApiResponse } from '../api-helpers';

// İmalat fişi yanıt tipi
export interface ProductionOrderResponse {
  // Backend'den gelen orijinal alanlar
  transferNumber: string;
  operationDate: string;
  operationTime: string;
  series: string;
  seriesNumber: string;
  innerProcessCode: string;
  innerProcessDescription: string;
  description?: string;
  targetWarehouseCode: string;
  targetWarehouseName: string;
  warehouseCode: string;
  warehouseDescription: string;
  isCompleted: boolean;
  isLocked: boolean;
  isTransferApproved: boolean;
  transferApprovedDate?: string;
  totalQty: number;
  InnerHeaderID: string;
  
  // Frontend'de kullanılan alanlar (dönüştürme sonrası eklenir)
  orderNumber?: string;
  innerHeaderId?: string;
  totalQuantity?: number;
  
  // Detay sayfasında kullanılan alanlar
  createdUserName?: string;
  createdDate?: string;
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
  targetWarehouseCode: string; // Hedef depo kodu (veritabanında WarehouseCode alanına yazılır)
  description?: string;
  operationDate?: string;
  shipmentMethodCode: string; // Sevkiyat yöntemi kodu (zorunlu)
  innerProcessCode: string; // İşlem kodu: OP (üretim siparişi)
  items: ProductionOrderItemRequest[];
}

// İmalat fişi satır istek tipi
export interface ProductionOrderItemRequest {
  itemCode: string;
  colorCode?: string;
  itemDim1Code?: string;
  Quantity: number;
  unitCode: string; // Birim kodu (zorunlu)
  lineDescription?: string;
  barcode?: string; // Barkod (API tarafından zorunlu)
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
      
      if (params?.targetWarehouseCode) {
        queryParams.append('targetWarehouseCode', params.targetWarehouseCode);
      }
      
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate.toISOString().split('T')[0]);
      }
      
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate.toISOString().split('T')[0]);
      }
      
      // Üretim siparişleri için işlem kodu ekliyoruz (OP = Operation/Production)
      queryParams.append('innerProcessCode', 'OP');
      
      // Depo transferleri API'sini kullanarak üretim siparişleri için endpoint oluşturuyoruz
      // Üretim siparişleri için WarehouseTransfer API'sini kullanıyoruz
      const url = `/api/WarehouseTransfer?${queryParams.toString()}`;
      console.log('📟 API: Üretim siparişleri getiriliyor', { url });
      
      const response = await axiosInstance.get<ApiResponse<ProductionOrderResponse[]>>(url);
      
      console.log('📟 API: Üretim siparişleri başarıyla alındı', { status: response.status, data: response.data });
      
      // API'den gelen verileri frontend'in beklediği formata dönüştür
      const formattedData = (response.data.data || []).map(item => ({
        ...item,
        orderNumber: item.transferNumber, // transferNumber'ı orderNumber olarak kullan
        innerHeaderId: item.InnerHeaderID, // Büyük/küçük harf uyumsuzluğunu gider
        totalQuantity: item.totalQty, // totalQty'yi totalQuantity olarak kullan
        items: item.items || [] // items alanı yoksa boş dizi kullan
      }));
      
      console.log('📟 API: Üretim siparişleri formatlandı', { formattedData });
      return formattedData;
    } catch (error) {
      console.error('Error fetching production orders:', error);
      // Hata durumunda boş dizi döndür
      return [];
    }
  },
  
  // İmalat fişi detayını getiren fonksiyon
  getProductionOrderByNumber: async (orderNumber: string): Promise<ProductionOrderResponse | null> => {
    try {
      // Depo transferleri API'sini kullanarak üretim siparişi detayı için endpoint oluşturuyoruz
      // Üretim siparişleri için WarehouseTransfer API'sini kullanıyoruz
      // Üretim siparişleri için işlem kodu ekliyoruz (OP = Operation/Production)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OP');
      const url = `/api/WarehouseTransfer/${orderNumber}?${queryParams.toString()}`;
      console.log('📟 API: Üretim siparişi detayı getiriliyor', { orderNumber, url });
      
      const response = await axiosInstance.get<ApiResponse<ProductionOrderResponse>>(url);
      
      console.log('📟 API: Üretim siparişi detayı başarıyla alındı', { status: response.status, data: response.data });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        console.warn('API: Üretim siparişi detayı başarısız veya veri yok', response.data);
        return null;
      }
    } catch (error) {
      console.error(`Üretim siparişi detayı getirilirken hata oluştu ${orderNumber}:`, error);
      return null;
    }
  },
  
  // İmalat fişi kalemlerini getiren fonksiyon
  getProductionOrderItems: async (orderNumber: string): Promise<ProductionOrderItemResponse[]> => {
    try {
      // Depo transferleri API'sini kullanarak üretim siparişi kalemleri için endpoint oluşturuyoruz
      // Üretim siparişleri için WarehouseTransfer API'sini kullanıyoruz
      // Üretim siparişleri için işlem kodu ekliyoruz (OP = Operation/Production)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OP');
      const url = `/api/WarehouseTransfer/${orderNumber}/items?${queryParams.toString()}`;
      console.log('📟 API: Üretim siparişi kalemleri getiriliyor', { orderNumber, url });
      
      const response = await axiosInstance.get<ApiResponse<ProductionOrderItemResponse[]>>(url);
      
      console.log('📟 API: Üretim siparişi kalemleri başarıyla alındı', { status: response.status, data: response.data });
      
      return response.data.data || [];
    } catch (error) {
      console.error(`Üretim siparişi kalemleri getirilirken hata oluştu ${orderNumber}:`, error);
      return []; // Hata durumunda boş dizi döndür, throw etme
    }
  },
  
  // Yeni imalat fişi oluşturan fonksiyon
  createProductionOrder: async (request: ProductionOrderRequest): Promise<string | null> => {
    try {
      // Üretim siparişleri için işlem kodu ekliyoruz (OP = Operation/Production)
      const requestWithProcessCode = {
        ...request,
        innerProcessCode: 'OP'
      };
      
      // İstek verilerini detaylı görüntüle
      console.log('API isteği detayları:', JSON.stringify(requestWithProcessCode, null, 2));
      
      // Önemli alanları kontrol et
      console.log('Hedef depo (WarehouseCode):', requestWithProcessCode.targetWarehouseCode);
      console.log('İşlem tarihi:', requestWithProcessCode.operationDate);
      console.log('Ürün sayısı:', requestWithProcessCode.items.length);
      
      // Ürün detaylarını kontrol et
      requestWithProcessCode.items.forEach((item, index) => {
        console.log(`Ürün ${index + 1}:`, {
          itemCode: item.itemCode,
          colorCode: item.colorCode,
          itemDim1Code: item.itemDim1Code,
          Quantity: item.Quantity,
          unitCode: item.unitCode
        });
      });
      
      console.log('📟 API: Üretim siparişi oluşturuluyor');
      // Depo transferleri API'sini kullanarak üretim siparişi oluşturma için endpoint oluşturuyoruz
      const response = await axiosInstance.post<ApiResponse<string>>(
        '/api/WarehouseTransfer',
        requestWithProcessCode,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      if (response.data.success && response.data.data) {
        console.log('📟 API: Üretim siparişi başarıyla oluşturuldu', { status: response.status, data: response.data });
        return response.data.data; // Oluşturulan üretim siparişi numarası
      } else {
        console.warn('API: Üretim siparişi oluşturma endpoint başarısız veya veri yok', response.data);
        return null;
      }
    } catch (error: any) {
      console.error('Üretim siparişi oluşturulurken hata oluştu:', error);
      
      // Hata detaylarını görüntüle
      if (error.response) {
        console.error('Hata detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Doğrulama hatalarını detaylı göster
        if (error.response.data && error.response.data.validationErrors) {
          console.error('Doğrulama hataları:', error.response.data.validationErrors);
        }
        
        // Hata mesajını göster
        if (error.response.data && error.response.data.message) {
          console.error('Hata mesajı:', error.response.data.message);
        }
      }
      
      throw error;
    }
  },
  
  // Depoları getiren fonksiyon
  getWarehouses: async (): Promise<WarehouseResponse[]> => {
    try {
      console.log('📟 API: Üretim siparişleri için depoları getirme işlemi başlatılıyor');
      // Üretim siparişleri için işlem kodu ekliyoruz (OP = Operation/Production)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OP');
      // Endpoint düzeltildi: Warehouse Transfer API'sinin kullandığı endpoint'i kullanıyoruz
      const response = await axiosInstance.get<ApiResponse<WarehouseResponse[]>>(
        `/api/WarehouseTransfer/warehouses?${queryParams.toString()}`
      );
      
      console.log('📟 API: Depolar başarıyla alındı', { status: response.status, data: response.data });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      return []; // Hata durumunda boş dizi döndür, throw etme
    }
  }
};

export default productionOrderApi;
