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
  operationDate?: string; // İşlem tarihi
  shipmentMethodCode: string; // Sevkiyat yöntemi kodu (zorunlu)
  innerProcessCode: string; // İşlem kodu: WT (depo transferi) veya OP (üretim siparişi)
  items: WarehouseTransferItemRequest[];
}

// Depolar arası sevk satır istek tipi
export interface WarehouseTransferItemRequest {
  itemCode: string;
  colorCode?: string;
  itemDim1Code?: string;
  Quantity: number; // Backend ile uyumlu olması için quantity yerine Quantity kullanıyoruz (ondalıklı değerleri destekler)
  quantity?: number; // Eski formlardan gelen quantity alanı (Quantity ile aynı ama küçük harfle)
  unitCode: string;
  lineDescription?: string;
  barcode?: string; // Barkod (API tarafından zorunlu)
  currencyCode?: string; // Para birimi kodu (varsayılan: TRY)
  costPrice?: number; // Birim maliyet fiyatı
  costAmount?: number; // Toplam maliyet tutarı (Quantity x costPrice)
  itemTypeCode?: number; // Ürün tipi kodu (1: Ürün, 2: Malzeme)
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
  warehouseDescription: string; // API'den gelen gerçek alan adı
  companyCode: string;
  officeCode: string;
  officeDescription: string;
  warehouseOwnerCode: string;
  warehouseOwnerDescription: string;
  warehouseTypeCode: string;
  warehouseTypeDescription: string;
  isBlocked: boolean;
  // Diğer alanlar
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
  createWarehouseTransfer: async (request: WarehouseTransferRequest): Promise<WarehouseTransferResponse> => {
    try {
      // Açıklama alanı zorunlu, boş ise varsayılan bir değer atayarak hata almasını önleme
      const requestWithDescription = {
        ...request,
        description: request.description || 'Depolar Arası Transfer ' + new Date().toLocaleDateString('tr-TR')
      };

      // Ürün satırlarını düzgün formata getir
      requestWithDescription.items = request.items.map(item => {
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
          barcode: item.barcode || item.itemCode,
          Quantity: finalQuantity, // Düzeltilmiş miktar formatı
          currencyCode: item.currencyCode || 'TRY',
          costPrice: item.costPrice || 0,
          costAmount: item.costAmount || 0,
          colorCode: item.colorCode || '0', // ColorCode zorunlu alan
          itemDim1Code: item.itemDim1Code || '', // ItemDim1Code zorunlu alan
          itemTypeCode: item.itemTypeCode !== undefined ? item.itemTypeCode : 2 // Ürünün kendi tipini kullan, yoksa varsayılan olarak 2 (Malzeme)
        };
      });

      console.log('Depolar arası transfer oluşturma isteği:', requestWithDescription);

      // Depolar arası transfer oluştur
      const response = await axiosInstance.post<ApiResponse<string>>('/api/WarehouseTransfer', requestWithDescription);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Depolar arası transfer oluşturulamadı');
      }

      const transferNumber = response.data.data;
      console.log('Depolar arası transfer başarıyla oluşturuldu. Transfer No:', transferNumber);

      // Oluşturulan transfer detaylarını getir
      let detailResponse;
      let retryCount = 0;
      const maxRetries = 3;
      
      // Yeniden deneme mekanizması
      while (retryCount < maxRetries) {
        try {
          detailResponse = await axiosInstance.get<ApiResponse<WarehouseTransferResponse>>(`/api/WarehouseTransfer/${transferNumber}`);
          
          // Başarılı yanıt ve veri varsa döngüden çık
          if (detailResponse.data.success && detailResponse.data.data) {
            break;
          }
          
          // Yanıt var ama satırlar olmayabilir, satırları ayrıca getirmeyi dene
          console.log(`Deneme ${retryCount + 1}: Yanıt alındı ama satırlar kontrol ediliyor...`);
          
          try {
            const itemsResponse = await axiosInstance.get<ApiResponse<WarehouseTransferItemResponse[]>>(
              `/api/WarehouseTransfer/${transferNumber}/items`
            );
            
            // Satırlar başarıyla alındıysa, detay yanıtına ekle
            if (itemsResponse.data.success && itemsResponse.data.data) {
              if (!detailResponse.data.data) {
                detailResponse.data.data = {} as WarehouseTransferResponse;
              }
              detailResponse.data.data.items = itemsResponse.data.data;
              break;
            }
          } catch (itemsError) {
            console.warn(`Transfer satırları getirilirken hata oluştu. Transfer No: ${transferNumber}:`, itemsError);
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
        console.warn('Birden fazla denemeden sonra transfer detayları getirilemedi');
        
        // Sadece transfer numarası ile minimal bir yanıt döndür
        return {
          transferNumber: transferNumber,
          description: requestWithDescription.description,
          sourceWarehouseCode: requestWithDescription.sourceWarehouseCode,
          sourceWarehouseName: '',
          targetWarehouseCode: requestWithDescription.targetWarehouseCode,
          targetWarehouseName: '',
          operationDate: new Date().toISOString().split('T')[0],
          operationTime: new Date().toISOString().split('T')[1].split('.')[0],
          isCompleted: false,
          isLocked: false,
          totalQty: requestWithDescription.items.reduce((sum, item) => sum + (item.Quantity || 0), 0),
          items: requestWithDescription.items.map(item => ({
            itemCode: item.itemCode,
            itemName: '',
            colorCode: item.colorCode || '',
            colorName: '',
            itemDim1Code: item.itemDim1Code || '',
            itemDim1Name: '',
            quantity: item.Quantity,
            unitCode: item.unitCode || '',
            barcode: item.barcode || '',
            lineDescription: item.lineDescription || ''
          }))
        } as WarehouseTransferResponse;
      }

      return detailResponse.data.data;
    } catch (error: any) {
      console.error('Depolar arası transfer oluşturulurken hata oluştu:', error);
      
      // Hata detaylarını görüntüle
      if (error.response) {
        console.error('Hata detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Validasyon hatalarını detaylı göster
        if (error.response.data && error.response.data.validationErrors) {
          console.error('Validasyon hataları:', error.response.data.validationErrors);
          
          // Her bir validasyon hatasını detaylı göster
          error.response.data.validationErrors.forEach((validationError: any, index: number) => {
            console.error(`Validasyon hatası ${index + 1}:`, {
              property: validationError.property,
              message: validationError.message,
              value: validationError.value
            });
          });
        }
        
        // API mesajını görüntüle
        if (error.response.data && error.response.data.message) {
          console.error('API mesajı:', error.response.data.message);
        }
      }
      
      throw error;
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
        // API'den gelen depo verilerini detaylı kontrol et
        console.log('📦 Depo verileri:', JSON.stringify(response.data.data, null, 2));
        
        // Her bir depo için kontrol yap
        const warehouses = response.data.data;
        warehouses.forEach((warehouse, index) => {
          console.log(`Depo ${index + 1}:`, {
            warehouseCode: warehouse.warehouseCode,
            warehouseDescription: warehouse.warehouseDescription,
            hasName: !!warehouse.warehouseDescription
          });
        });
        
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
