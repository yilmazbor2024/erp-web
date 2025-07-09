import axiosInstance from '../config/axios';
import { ApiResponse } from '../api-helpers';

// Envanter stok bilgisi tipi tanımlamaları
export interface InventoryStock {
  itemTypeCode: string;
  usedBarcode: string;
  itemDescription: string;
  colorDescription: string;
  binCode: string;
  unitOfMeasureCode: string;
  barcodeTypeCode: string;
  colorCode: string;
  itemDim1Code: string;
  itemDim2TypeCode: string;
  itemDim2Code: string;
  itemDim3Code: string;
  qty: number;
  variantIsBlocked: boolean;
  isNotExist: boolean;
  itemCode: string;
  productCode: string;
  quantity: number;
  warehouseCode?: string;
  warehouseName?: string;
}

// Stok arama parametreleri için arayüz
export interface InventorySearchParams {
  barcode?: string;
  productCode?: string;
  productDescription?: string;
  colorCode?: string;
  itemDim1Code?: string;
  warehouseCode?: string;
  showOnlyPositiveStock?: boolean;
}

// API fonksiyonları
const inventoryApi = {
  // Çok amaçlı stok sorgulama fonksiyonu
  async getInventoryStock(params: InventorySearchParams): Promise<InventoryStock[]> {
    try {
      console.log('Envanter stok sorgusu yapılıyor:', params);
      
      // Query parametrelerini oluştur
      const queryParams = new URLSearchParams();
      
      // Parametreleri ekle (sadece değeri olanları)
      if (params.barcode) queryParams.append('barcode', params.barcode);
      if (params.productCode) queryParams.append('productCode', params.productCode);
      if (params.productDescription) queryParams.append('productDescription', params.productDescription);
      if (params.colorCode) queryParams.append('colorCode', params.colorCode);
      if (params.itemDim1Code) queryParams.append('itemDim1Code', params.itemDim1Code);
      if (params.warehouseCode) queryParams.append('warehouseCode', params.warehouseCode);
      if (params.showOnlyPositiveStock) queryParams.append('showOnlyPositiveStock', params.showOnlyPositiveStock.toString());
      
      // API dokümanında belirtilen kesin doğru endpoint
      const endpoint = `/api/Inventory/stock/multi-purpose?${queryParams.toString()}`;
      console.log(`Envanter stok sorgusu endpoint: ${endpoint}`);
      
      const response = await axiosInstance.get(endpoint);
      console.log('Envanter API - Yanıt alındı');
      console.log('Envanter API - Response:', response);
      
      // API yanıt yapısı kontrolü - İki farklı format olabilir
      // Format 1: {data: Array, success: true, message: string}
      // Format 2: {data: {isSuccess: true, data: Array}}
      
      let inventoryData: any[] = [];
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Format 1: {data: Array, success: true}
        console.log('Format 1: Başarılı yanıt, data dizisi bulundu:', response.data.data);
        inventoryData = response.data.data;
      } else if (response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        // Format 2: {data: {isSuccess: true, data: Array}}
        console.log('Format 2: Başarılı yanıt, data dizisi bulundu:', response.data.data);
        inventoryData = response.data.data;
      }
      
      if (inventoryData.length > 0) {
        console.log('Envanter stok bilgisi bulundu, veri dönüştürülüyor:', inventoryData);
        
        // API'den gelen verileri InventoryStock formatına dönüştür
        const inventoryStocks: InventoryStock[] = inventoryData.map((item: any) => {
          const qty = typeof item.qty === 'number' ? item.qty : 0;
          return {
            itemTypeCode: item.itemTypeCode || '',
            itemCode: item.itemCode || item.productCode || '',
            usedBarcode: item.usedBarcode || item.barcode || '',
            itemDescription: item.itemDescription || item.productDescription || '',
            colorDescription: item.colorDescription || '',
            binCode: item.binCode || '',
            unitOfMeasureCode: item.unitOfMeasureCode || '',
            barcodeTypeCode: item.barcodeTypeCode || '',
            colorCode: item.colorCode || '',
            itemDim1Code: item.itemDim1Code || '',
            itemDim2TypeCode: item.itemDim2TypeCode || '',
            itemDim2Code: item.itemDim2Code || '',
            itemDim3Code: item.itemDim3Code || '',
            qty: qty,
            // Tip uyumluluğu için gerekli alanlar
            productCode: item.itemCode || item.productCode || '',
            quantity: qty,
            variantIsBlocked: Boolean(item.variantIsBlocked),
            isNotExist: Boolean(item.isNotExist),
            warehouseCode: item.warehouseCode || '',
            warehouseName: item.warehouseName || ''
          };
        });
        
        return inventoryStocks;
      }
      
      console.warn('Envanter stok bilgisi bulunamadı:', response.data);
      return [];
    } catch (error) {
      console.error('Envanter stok bilgisi aranırken hata oluştu:', error);
      throw error;
    }
  },
  
  // Barkod ile stok sorgulama (eski fonksiyonu koruyalım, yeni fonksiyonu çağırsın)
  async getInventoryStockByBarcode(barcode: string): Promise<InventoryStock[]> {
    try {
      if (!barcode) {
        throw new Error('Barkod boş olamaz');
      }
      
      console.log(`Barkod ile envanter/stok bilgisi aranıyor: ${barcode}`);
      
      try {
        // Yeni çok amaçlı fonksiyonu çağır
        return await this.getInventoryStock({ barcode });
      } catch (error) {
        console.warn('Barkod ile stok bilgisi alınırken hata oluştu, alternatif API endpoint deneniyor...');
        
        // Alternatif endpoint'leri doğrudan dene
        try {
          const response = await axiosInstance.get(`/api/Item/inventory-by-barcode/${barcode}`);
          if (response.data && (response.data.success || response.data.isSuccess)) {
            const data = response.data.data || response.data.items || [];
            return this.mapResponseToInventoryStock(data);
          }
        } catch (altError) {
          console.warn('Alternatif endpoint de başarısız oldu');
        }
        
        // Boş dizi döndür
        return [];
      }
    } catch (error) {
      console.error('Barkod ile envanter/stok bilgisi aranırken hata oluştu:', error);
      // Hata fırlatmak yerine boş dizi döndür
      return [];
    }
  },
  
  // API yanıtını InventoryStock formatına dönüştür
  mapResponseToInventoryStock(data: any[]): InventoryStock[] {
    if (!Array.isArray(data)) return [];
    
    return data.map((item: any) => {
      const qty = typeof item.qty === 'number' ? item.qty : 0;
      const productCode = item.itemCode || item.productCode || '';
      
      return {
        itemTypeCode: item.itemTypeCode || '',
        itemCode: productCode,
        usedBarcode: item.usedBarcode || item.barcode || '',
        itemDescription: item.itemDescription || item.productDescription || '',
        colorDescription: item.colorDescription || '',
        binCode: item.binCode || '',
        unitOfMeasureCode: item.unitOfMeasureCode || item.unitOfMeasureCode1 || '',
        barcodeTypeCode: item.barcodeTypeCode || '',
        colorCode: item.colorCode || '',
        itemDim1Code: item.itemDim1Code || '',
        itemDim2TypeCode: item.itemDim2TypeCode || '',
        itemDim2Code: item.itemDim2Code || '',
        itemDim3Code: item.itemDim3Code || '',
        qty: qty,
        // Tip uyumluluğu için gerekli alanlar
        productCode: productCode,
        quantity: qty,
        variantIsBlocked: Boolean(item.variantIsBlocked || item.isBlocked),
        isNotExist: Boolean(item.isNotExist),
        warehouseCode: item.warehouseCode || '',
        warehouseName: item.warehouseName || ''
      };
    });
  },
  
  // Ürün koduna göre stok bilgisini getir
  async getInventoryStockByProductCode(productCode: string): Promise<InventoryStock[]> {
    try {
      if (!productCode) {
        console.warn('Ürün kodu boş, stok bilgisi getirilemedi');
        return [];
      }
      
      console.log(`Ürün koduna göre stok bilgisi aranıyor: ${productCode}`);
      
      // API dokümanında belirtilen kesin doğru endpoint
      const queryParams = new URLSearchParams();
      queryParams.append('productCode', productCode);
      queryParams.append('showOnlyPositiveStock', 'false');
      
      const endpoint = `/api/Inventory/stock/multi-purpose?${queryParams.toString()}`;
      console.log(`Ürün stok sorgusu endpoint: ${endpoint}`);
      
      const response = await axiosInstance.get(endpoint);
      
      if (response.data && Array.isArray(response.data.data)) {
        const stocks = response.data.data;
        console.log(`Ürün kodu ${productCode} için stok bilgisi bulundu:`, stocks.length, 'adet');
        return stocks;
      }
      
      console.warn(`Ürün kodu ${productCode} için stok bilgisi bulunamadı`);
      return [];
    } catch (error: any) {
      // Hata durumunda log yazdır ve boş dizi döndür
      if (error.response && error.response.status === 404) {
        console.warn(`Ürün kodu ${productCode} için stok bilgisi bulunamadı (404)`);
      } else {
        console.error('Ürün stok bilgisi aranırken hata oluştu:', error);
      }
      return [];
    }
  }
};

export default inventoryApi;
