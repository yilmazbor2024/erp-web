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
  quantity?: number; // Eski formlardan gelen quantity alanı (Quantity ile aynı ama küçük harfle)
  unitCode: string; // Birim kodu (zorunlu)
  lineDescription?: string;
  barcode?: string; // Barkod (API tarafından zorunlu)
  currencyCode?: string; // Para birimi kodu (varsayılan: TRY)
  costPrice?: number; // Birim maliyet fiyatı
  costAmount?: number; // Toplam maliyet tutarı (Quantity x costPrice)
  itemTypeCode?: number; // Ürün tipi kodu (1: Ürün, 2: Malzeme)
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
  getProductionOrderByNumber: async (innerNumber: string): Promise<ProductionOrderResponse | null> => {
    try {
      // Depo transferleri API'sini kullanarak üretim siparişi detayı için endpoint oluşturuyoruz
      // Üretim siparişleri için WarehouseTransfer API'sini kullanıyoruz
      // Üretim siparişleri için işlem kodu ekliyoruz (OP = Operation/Production)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OP');
      const url = `/api/WarehouseTransfer/${innerNumber}?${queryParams.toString()}`;
      console.log('📟 API: Üretim siparişi detayı getiriliyor', { innerNumber, url });
      
      const response = await axiosInstance.get<ApiResponse<ProductionOrderResponse>>(url);
      
      console.log('📟 API: Üretim siparişi detayı başarıyla alındı', { status: response.status, data: response.data });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        console.warn('API: Üretim siparişi detayı başarısız veya veri yok', response.data);
        return null;
      }
    } catch (error) {
      console.error(`Üretim siparişi detayı getirilirken hata oluştu ${innerNumber}:`, error);
      return null;
    }
  },
  
  // İmalat fişi kalemlerini getiren fonksiyon
  getProductionOrderItems: async (innerNumber: string): Promise<ProductionOrderItemResponse[]> => {
    try {
      // Depo transferleri API'sini kullanarak üretim siparişi kalemleri için endpoint oluşturuyoruz
      // Üretim siparişleri için WarehouseTransfer API'sini kullanıyoruz
      // Üretim siparişleri için işlem kodu ekliyoruz (OP = Operation/Production)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OP');
      const url = `/api/WarehouseTransfer/${innerNumber}/items?${queryParams.toString()}`;
      console.log('📟 API: Üretim siparişi kalemleri getiriliyor', { innerNumber, url });
      
      const response = await axiosInstance.get<ApiResponse<ProductionOrderItemResponse[]>>(url);
      
      console.log('📟 API: Üretim siparişi kalemleri başarıyla alındı', { status: response.status, data: response.data });
      
      return response.data.data || [];
    } catch (error) {
      console.error(`Üretim siparişi kalemleri getirilirken hata oluştu ${innerNumber}:`, error);
      return []; // Hata durumunda boş dizi döndür, throw etme
    }
  },
  
  // Yeni imalat fişi oluşturan fonksiyon
  createProductionOrder: async (request: ProductionOrderRequest): Promise<ProductionOrderResponse> => {
    try {
      // Üretim siparişleri için işlem kodu ve zorunlu alanları ekliyoruz
      const requestWithProcessCode = {
        ...request,
        innerProcessCode: 'OP',
        // Açıklama alanı zorunlu, boş ise varsayılan bir değer atayarak hata almasını önleme
        description: request.description || 'İmalat Fişi ' + new Date().toLocaleDateString('tr-TR')
      };
      
      // Ürün satırlarını düzgün formata getir
      requestWithProcessCode.items = request.items.map(item => {
        const { quantity: origQuantity, ...rest } = item;
        
        // Miktar değerini float olarak hazırlama
        let finalQuantity = origQuantity || item.Quantity || 1;
        
        // Miktar string ise ("12,45" gibi) float'a çevir
        if (typeof finalQuantity === 'string') {
          // Virgüllü sayıyı noktalı sayıya çevir ("12,45" -> "12.45")
          const strValue = finalQuantity as string;
          finalQuantity = parseFloat(strValue.replace(',', '.'));
        }
        
        // Sayı değilse veya NaN ise 1 olarak ayarla
        if (isNaN(finalQuantity) || finalQuantity <= 0) {
          finalQuantity = 1;
        }
        
        return {
          ...rest,
          Quantity: finalQuantity, // Düzeltilmiş miktar formatı
          currencyCode: item.currencyCode || 'TRY',
          costPrice: item.costPrice || 0,
          costAmount: item.costAmount || 0,
          colorCode: item.colorCode || '0', // ColorCode zorunlu alan
          itemDim1Code: item.itemDim1Code || '', // ItemDim1Code zorunlu alan
          itemTypeCode: item.itemTypeCode !== undefined ? item.itemTypeCode : 2 // Ürünün kendi tipini kullan, yoksa varsayılan olarak 2 (Malzeme)
        };
      });
      
      // İstek verilerini detaylı görüntüle (geliştirme aşamasında yardımcı olması için)
      console.log('İmalat fişi oluşturma isteği:', JSON.stringify(requestWithProcessCode, null, 2));
      
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
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'İmalat fişi oluşturulamadı');
      }
      
      // API'den dönen imalat fişi numarasını string olarak kullan
      const innerNumber = String(response.data.data);
      console.log('📟 API: İmalat fişi başarıyla oluşturuldu. Fiş No:', innerNumber);
      
      // Oluşturulan imalat fişi detaylarını getir
      let detailResponse;
      let retryCount = 0;
      const maxRetries = 3;
      
      // Yeniden deneme mekanizması
      while (retryCount < maxRetries) {
        try {
          // İmalat fişi detaylarını getirmeyi dene
          // innerProcessCode parametresini ekle ve orderNumber'ın string olduğundan emin ol
          const queryParams = new URLSearchParams();
          queryParams.append('innerProcessCode', 'OP');
          detailResponse = await axiosInstance.get<ApiResponse<ProductionOrderResponse>>(`/api/WarehouseTransfer/${innerNumber}?${queryParams.toString()}`);
          
          // Başarılı yanıt ve veri varsa döngüden çık
          if (detailResponse.data.success && detailResponse.data.data) {
            break;
          }
          
          // Yanıt var ama satırlar olmayabilir, satırları ayrıca getirmeyi dene
          console.log(`Deneme ${retryCount + 1}: Yanıt alındı ama satırlar kontrol ediliyor...`);
          
          try {
            // İmalat fişi satırlarını getirmeyi dene
            const queryParams = new URLSearchParams();
            queryParams.append('innerProcessCode', 'OP');
            const itemsResponse = await axiosInstance.get<ApiResponse<ProductionOrderItemResponse[]>>(
              `/api/WarehouseTransfer/${innerNumber}/items?${queryParams.toString()}`
            );
            
            // Satırlar başarıyla alındıysa, detay yanıtına ekle
            if (itemsResponse.data.success && itemsResponse.data.data) {
              if (!detailResponse.data.data) {
                detailResponse.data.data = {} as ProductionOrderResponse;
              }
              detailResponse.data.data.items = itemsResponse.data.data;
              break;
            }
          } catch (itemsError) {
            console.warn(`İmalat fişi satırları getirilirken hata oluştu. Fiş No: ${innerNumber}:`, itemsError);
            // Ana istek için yeniden denemeye devam et
          }
        } catch (retryError) {
          console.warn(`Deneme ${retryCount + 1} başarısız:`, retryError);
        }
        
        // Yeniden denemeden önce bekle
        await new Promise(resolve => setTimeout(resolve, 1000));
        retryCount++;
      }
      
      // Tüm denemelerden sonra hala geçerli bir yanıt yoksa
      if (!detailResponse || !detailResponse.data.success) {
        console.warn('Birden fazla denemeden sonra imalat fişi detayları getirilemedi');
        
        // Sadece fiş numarası ile minimal bir yanıt döndür
        const minimalResponse: Partial<ProductionOrderResponse> = {
          transferNumber: innerNumber,
          operationDate: new Date().toISOString().split('T')[0],
          operationTime: new Date().toISOString().split('T')[1].substring(0, 8),
          innerProcessCode: 'OP',
          innerProcessDescription: 'İmalat Fişi',
          warehouseCode: requestWithProcessCode.targetWarehouseCode, // Kaynak depo olarak hedef depoyu kullan
          warehouseDescription: '',
          targetWarehouseCode: requestWithProcessCode.targetWarehouseCode,
          targetWarehouseName: '',
          isCompleted: false,
          isLocked: false,
          isTransferApproved: false,
          totalQty: requestWithProcessCode.items.reduce((sum, item) => sum + (item.Quantity || 0), 0),
          InnerHeaderID: '',
          items: []
        };
        
        // Önemli: orderNumber alanını innerNumber ile doldur
        minimalResponse.orderNumber = innerNumber;
        
        return minimalResponse as ProductionOrderResponse;
      }
      
      // API'den gelen yanıtı kullan
      const productionOrderResponse = detailResponse.data.data;
      
      // Önemli: orderNumber alanını innerNumber (transferNumber) ile doldur
      // Bu, frontend'de navigasyon için kullanılacak
      productionOrderResponse.orderNumber = productionOrderResponse.transferNumber || innerNumber;
      
      console.log('📟 API: Dönüş değeri kontrolü:', {
        transferNumber: productionOrderResponse.transferNumber,
        orderNumber: productionOrderResponse.orderNumber,
        innerNumber: innerNumber
      });
      
      return productionOrderResponse;
    } catch (error: any) {
      console.error('İmalat fişi oluşturulurken hata oluştu:', error);
      
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
