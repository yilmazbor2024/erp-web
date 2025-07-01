import axiosInstance from '../config/axios';
import { ApiResponse } from '../api-helpers';

// Sair Sarf Fişi yanıt tipi (İmalat Fişi ile aynı yapıda)
export interface ConsumptionOrderResponse {
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
  items: ConsumptionOrderItemResponse[];
}

// Sair Sarf Fişi satır yanıt tipi (İmalat Fişi ile aynı yapıda)
export interface ConsumptionOrderItemResponse {
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
  quantity: number;
  unitCode?: string;
  unitName?: string;
  lineDescription?: string;
}

// Sair Sarf Fişi istek tipi (İmalat Fişi ile aynı yapıda)
export interface ConsumptionOrderRequest {
  sourceWarehouseCode?: string;
  targetWarehouseCode: string;
  operationDate?: Date;
  description?: string;
  innerProcessCode?: string;
  shipmentMethodCode?: string;
  items: ConsumptionOrderItemRequest[];
}

// Sair Sarf Fişi satır istek tipi (İmalat Fişi ile aynı yapıda)
export interface ConsumptionOrderItemRequest {
  itemCode: string;
  colorCode?: string;
  itemDim1Code?: string;
  itemDim2Code?: string;
  itemDim3Code?: string;
  Quantity: number;
  unitCode?: string;
  lineDescription?: string;
  barcode?: string;
}

// Depo yanıt tipi
export interface WarehouseResponse {
  warehouseCode: string;
  warehouseDescription: string;
}

// Sair Sarf Fişi API servisi
const consumptionOrderApi = {
  // Sair Sarf Fişlerini listeleyen fonksiyon
  getConsumptionOrders: async (): Promise<ConsumptionOrderResponse[]> => {
    try {
      console.log('📟 API: Sair Sarf Fişleri getiriliyor');
      // Sair Sarf Fişleri için işlem kodu ekliyoruz (OC = Operation Consumption)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OC');
      const url = `/api/WarehouseTransfer?${queryParams.toString()}`;
      
      const response = await axiosInstance.get<ApiResponse<ConsumptionOrderResponse[]>>(url);
      
      console.log('📟 API: Sair Sarf Fişleri başarıyla alındı', { status: response.status, data: response.data });
      
      // Veriyi frontend için formatla
      const formattedData = (response.data.data || []).map(item => ({
        ...item,
        orderNumber: item.transferNumber, // transferNumber'ı orderNumber olarak kullan
        innerHeaderId: item.InnerHeaderID, // Büyük/küçük harf uyumsuzluğunu gider
        totalQuantity: item.totalQty, // totalQty'yi totalQuantity olarak kullan
        items: item.items || [] // items alanı yoksa boş dizi kullan
      }));
      
      console.log('📟 API: Sair Sarf Fişleri formatlandı', { formattedData });
      return formattedData;
    } catch (error) {
      console.error('Sair Sarf Fişleri getirilirken hata oluştu:', error);
      // Hata durumunda boş dizi döndür
      return [];
    }
  },
  
  // Sair Sarf Fişi detayını getiren fonksiyon
  getConsumptionOrderByNumber: async (orderNumber: string): Promise<ConsumptionOrderResponse | null> => {
    try {
      // Depo transferleri API'sini kullanarak Sair Sarf Fişi detayı için endpoint oluşturuyoruz
      // Sair Sarf Fişleri için işlem kodu ekliyoruz (OC = Operation Consumption)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OC');
      const url = `/api/WarehouseTransfer/${orderNumber}?${queryParams.toString()}`;
      console.log('📟 API: Sair Sarf Fişi detayı getiriliyor', { orderNumber, url });
      
      const response = await axiosInstance.get<ApiResponse<ConsumptionOrderResponse>>(url);
      
      console.log('📟 API: Sair Sarf Fişi detayı başarıyla alındı', { status: response.status, data: response.data });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        console.warn('API: Sair Sarf Fişi detayı başarısız veya veri yok', response.data);
        return null;
      }
    } catch (error) {
      console.error(`Sair Sarf Fişi detayı getirilirken hata oluştu ${orderNumber}:`, error);
      return null;
    }
  },
  
  // Sair Sarf Fişi kalemlerini getiren fonksiyon
  getConsumptionOrderItems: async (orderNumber: string): Promise<ConsumptionOrderItemResponse[]> => {
    try {
      // Depo transferleri API'sini kullanarak Sair Sarf Fişi kalemleri için endpoint oluşturuyoruz
      // Sair Sarf Fişleri için işlem kodu ekliyoruz (OC = Operation Consumption)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OC');
      const url = `/api/WarehouseTransfer/${orderNumber}/items?${queryParams.toString()}`;
      console.log('📟 API: Sair Sarf Fişi kalemleri getiriliyor', { orderNumber, url });
      
      const response = await axiosInstance.get<ApiResponse<ConsumptionOrderItemResponse[]>>(url);
      
      console.log('📟 API: Sair Sarf Fişi kalemleri başarıyla alındı', { status: response.status, data: response.data });
      
      return response.data.data || [];
    } catch (error) {
      console.error(`Sair Sarf Fişi kalemleri getirilirken hata oluştu ${orderNumber}:`, error);
      return []; // Hata durumunda boş dizi döndür
    }
  },
  
  // Yeni Sair Sarf Fişi oluşturan fonksiyon
  createConsumptionOrder: async (request: ConsumptionOrderRequest): Promise<string | null> => {
    try {
      // Sair Sarf Fişleri için işlem kodu ve eksik alanları ekliyoruz
      const requestWithProcessCode = {
        ...request,
        innerProcessCode: 'OC',
        sourceWarehouseCode: request.targetWarehouseCode, // Backend'in beklediği SourceWarehouseCode alanını hedef depo ile dolduruyoruz
        shipmentMethodCode: '1', // Depolar arası transfer için standart değer
        items: request.items.map(item => ({
          ...item,
          barcode: item.barcode || item.itemCode, // Barkod yoksa itemCode'u kullan
          Quantity: item.Quantity || 1 // Miktar yoksa 1 olarak ayarla
        }))
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
      
      console.log('📟 API: Sair Sarf Fişi oluşturuluyor');
      // Depo transferleri API'sini kullanarak Sair Sarf Fişi oluşturma için endpoint oluşturuyoruz
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
        console.log('📟 API: Sair Sarf Fişi başarıyla oluşturuldu', { status: response.status, data: response.data });
        return response.data.data; // Oluşturulan Sair Sarf Fişi numarası
      } else {
        console.warn('API: Sair Sarf Fişi oluşturma endpoint başarısız veya veri yok', response.data);
        return null;
      }
    } catch (error: any) {
      console.error('Sair Sarf Fişi oluşturulurken hata oluştu:', error);
      
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
      console.log('📟 API: Sair Sarf Fişleri için depoları getirme işlemi başlatılıyor');
      // Sair Sarf Fişleri için işlem kodu ekliyoruz (OC = Operation Consumption)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OC');
      // Endpoint düzeltildi: Warehouse Transfer API'sinin kullandığı endpoint'i kullanıyoruz
      const response = await axiosInstance.get<ApiResponse<WarehouseResponse[]>>(
        `/api/WarehouseTransfer/warehouses?${queryParams.toString()}`
      );
      
      console.log('📟 API: Depolar başarıyla alındı', { status: response.status, data: response.data });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      return []; // Hata durumunda boş dizi döndür
    }
  }
};

export default consumptionOrderApi;
