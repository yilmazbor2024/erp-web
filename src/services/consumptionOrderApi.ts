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
  quantity?: number; // Eski formlardan gelen quantity alanı (Quantity ile aynı ama küçük harfle)
  unitCode?: string;
  lineDescription?: string;
  barcode?: string;
  itemTypeCode?: number; // 1: Ürün, 2: Malzeme
  currencyCode?: string; // Varsayılan: TRY
  costPrice?: number; // Maliyet fiyatı
  costAmount?: number; // Maliyet tutarı
  costPriceWithInflation?: number; // Enflasyon düzeltmeli maliyet fiyatı
  costAmountWithInflation?: number; // Enflasyon düzeltmeli maliyet tutarı
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
      // orderNumber'ın string olduğundan emin olalım
      if (typeof orderNumber !== 'string') {
        console.error('orderNumber string değil:', orderNumber, typeof orderNumber);
        return null;
      }
      
      // Depo transferleri API'sini kullanarak Sair Sarf Fişi detayı için endpoint oluşturuyoruz
      // Sair Sarf Fişleri için işlem kodu ekliyoruz (OC = Operation Consumption)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OC');
      const url = `/api/WarehouseTransfer/${orderNumber}?${queryParams.toString()}`;
      console.log('📟 API: Sair Sarf Fişi detayı getiriliyor', { orderNumber, url, orderNumberType: typeof orderNumber });
      
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
      // orderNumber'ın string olduğundan emin olalım
      if (typeof orderNumber !== 'string') {
        console.error('orderNumber string değil:', orderNumber, typeof orderNumber);
        return [];
      }
      
      // Depo transferleri API'sini kullanarak Sair Sarf Fişi kalemleri için endpoint oluşturuyoruz
      // Sair Sarf Fişleri için işlem kodu ekliyoruz (OC = Operation Consumption)
      const queryParams = new URLSearchParams();
      queryParams.append('innerProcessCode', 'OC');
      const url = `/api/WarehouseTransfer/${orderNumber}/items?${queryParams.toString()}`;
      console.log('📟 API: Sair Sarf Fişi kalemleri getiriliyor', { orderNumber, url, orderNumberType: typeof orderNumber });
      
      const response = await axiosInstance.get<ApiResponse<ConsumptionOrderItemResponse[]>>(url);
      
      console.log('📟 API: Sair Sarf Fişi kalemleri başarıyla alındı', { status: response.status, data: response.data });
      
      return response.data.data || [];
    } catch (error) {
      console.error(`Sair Sarf Fişi kalemleri getirilirken hata oluştu ${orderNumber}:`, error);
      return []; // Hata durumunda boş dizi döndür
    }
  },
  
  // Yeni Sair Sarf Fişi oluşturan fonksiyon
  createConsumptionOrder: async (request: ConsumptionOrderRequest): Promise<ConsumptionOrderResponse> => {
    try {
      // Sair Sarf Fişleri için işlem kodu ve eksik alanları ekliyoruz
      const requestWithProcessCode = {
        ...request,
        innerProcessCode: 'OC',
        sourceWarehouseCode: request.targetWarehouseCode, // Backend'in beklediği SourceWarehouseCode alanını hedef depo ile dolduruyoruz
        shipmentMethodCode: '1', // Depolar arası transfer için standart değer
        // Açıklama alanı zorunlu, boş ise varsayılan bir değer atayarak hata almasını önleme
        description: request.description || 'Sarf Fişi ' + new Date().toLocaleDateString('tr-TR'),
        items: request.items.map(item => {
          // quantity alanını kaldırıp sadece Quantity kullanmak için yeni bir nesne oluşturuyoruz
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
            barcode: item.barcode || item.itemCode, // Barkod yoksa itemCode'u kullan
            Quantity: finalQuantity, // Düzeltilmiş miktar formatı
            currencyCode: item.currencyCode || 'TRY', // Para birimi kodu
            costPrice: item.costPrice || 0, // Maliyet fiyatı
            costAmount: item.costAmount || 0, // Maliyet tutarı
            colorCode: item.colorCode || '0', // ColorCode zorunlu alan
            itemDim1Code: item.itemDim1Code || '', // ItemDim1Code boş string olmalı, "0" değil
            itemTypeCode: item.itemTypeCode !== undefined ? item.itemTypeCode : 2 // Ürünün kendi tipini kullan, yoksa varsayılan olarak 2 (Malzeme)
          };
        })
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
          colorCode: item.colorCode || '',
          itemDim1Code: item.itemDim1Code || '',
          Quantity: item.Quantity, // Backend modeli ile eşleşmesi için Quantity alanını kullanıyoruz
          unitCode: item.unitCode || '',
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
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Sarf fişi oluşturulamadı');
      }

      const orderNumber = response.data.data;
      console.log('📟 API: Sarf fişi başarıyla oluşturuldu. Fiş No:', orderNumber);

      // Oluşturulan fiş detaylarını getir
      let detailResponse;
      let retryCount = 0;
      const maxRetries = 3;
      
      // Yeniden deneme mekanizması
      while (retryCount < maxRetries) {
        try {
          // orderNumber'ın string olduğundan emin olalım
          const orderNumberStr = typeof orderNumber === 'string' ? orderNumber : String(orderNumber);
          console.log('Fiş detayları getiriliyor, Fiş No:', orderNumberStr);
          
          // Sair Sarf Fişleri için işlem kodu ekliyoruz (OC = Operation Consumption)
          const queryParams = new URLSearchParams();
          queryParams.append('innerProcessCode', 'OC');
          
          detailResponse = await axiosInstance.get<ApiResponse<ConsumptionOrderResponse>>(
            `/api/WarehouseTransfer/${orderNumberStr}?${queryParams.toString()}`
          );
          
          // Başarılı yanıt ve veri varsa döngüden çık
          if (detailResponse.data.success && detailResponse.data.data) {
            break;
          }
          
          // Yanıt var ama satırlar olmayabilir, satırları ayrıca getirmeyi dene
          console.log(`Deneme ${retryCount + 1}: Yanıt alındı ama satırlar kontrol ediliyor...`);
          
          try {
            // orderNumber'ın string olduğundan emin olalım
            const orderNumberStr = typeof orderNumber === 'string' ? orderNumber : String(orderNumber);
            console.log('Fiş kalemleri getiriliyor, Fiş No:', orderNumberStr);
            
            // Sair Sarf Fişleri için işlem kodu ekliyoruz (OC = Operation Consumption)
            const itemsQueryParams = new URLSearchParams();
            itemsQueryParams.append('innerProcessCode', 'OC');
            
            const itemsResponse = await axiosInstance.get<ApiResponse<ConsumptionOrderItemResponse[]>>(
              `/api/WarehouseTransfer/${orderNumberStr}/items?${itemsQueryParams.toString()}`
            );
            
            // Satırlar başarıyla alındıysa, detay yanıtına ekle
            if (itemsResponse.data.success && itemsResponse.data.data) {
              if (!detailResponse.data.data) {
                detailResponse.data.data = {} as ConsumptionOrderResponse;
              }
              detailResponse.data.data.items = itemsResponse.data.data;
              break;
            }
          } catch (itemsError) {
            console.warn(`Fiş satırları getirilirken hata oluştu. Fiş No: ${orderNumber}:`, itemsError);
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
        console.warn('Birden fazla denemeden sonra fiş detayları getirilemedi');
        
        // Sadece fiş numarası ile minimal bir yanıt döndür
        const minimalResponse: Partial<ConsumptionOrderResponse> = {
          transferNumber: orderNumber,
          orderNumber: orderNumber,
          description: requestWithProcessCode.description,
          warehouseCode: requestWithProcessCode.sourceWarehouseCode || '',
          targetWarehouseCode: requestWithProcessCode.targetWarehouseCode,
          operationDate: typeof requestWithProcessCode.operationDate === 'string' ? requestWithProcessCode.operationDate : new Date().toISOString().split('T')[0],
          operationTime: new Date().toISOString().split('T')[1].split('.')[0],
          isCompleted: false,
          isLocked: false,
          isTransferApproved: false,
          totalQty: requestWithProcessCode.items.reduce((sum, item) => sum + (item.Quantity || 0), 0),
          series: '',
          seriesNumber: '',
          innerProcessCode: 'OC',
          innerProcessDescription: 'Sarf Fişi',
          // Tip tanımında olmayan alanları kaldırıyorum
          items: requestWithProcessCode.items.map((item, index) => ({
            itemCode: item.itemCode,
            itemName: '',
            colorCode: item.colorCode || '',
            colorName: '',
            itemDim1Code: item.itemDim1Code || '',
            itemDim1Name: '',
            quantity: item.Quantity,
            unitCode: item.unitCode || '',
            unitName: '',
            barcode: item.barcode || '',
            lineDescription: item.lineDescription || '',
            innerLineId: `${index + 1}`,
            lineNumber: index + 1
          }))
        };
        
        return minimalResponse as ConsumptionOrderResponse;
      }

      // API'den gelen yanıtı kullan
      const consumptionOrderResponse = detailResponse.data.data;
      
      // Önemli: orderNumber alanını transferNumber ile doldur
      // Bu, frontend'de navigasyon için kullanılacak
      consumptionOrderResponse.orderNumber = consumptionOrderResponse.transferNumber || orderNumber;
      
      console.log('📟 API: Dönüş değeri kontrolü:', {
        transferNumber: consumptionOrderResponse.transferNumber,
        orderNumber: consumptionOrderResponse.orderNumber
      });
      
      return consumptionOrderResponse;
    } catch (error: any) {
      console.error('API: Sarf fişi oluşturulurken hata oluştu', error);
      
      // Hata detaylarını görüntüle
      if (error.response) {
        console.error('Hata detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Hata mesajını görüntüle
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
