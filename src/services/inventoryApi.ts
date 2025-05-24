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
  // Ürün kodu bilgisini ekleyelim
  itemCode?: string;
}

// API fonksiyonları
const inventoryApi = {
  // Barkod ile envanter/stok bilgisini getir
  async getInventoryStockByBarcode(barcode: string): Promise<InventoryStock[]> {
    try {
      if (!barcode) {
        throw new Error('Barkod boş olamaz');
      }
      
      console.log(`Barkod ile envanter/stok bilgisi aranıyor: ${barcode}`);
      // Token'i kontrol et ve konsola yazdır
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      console.log('Envanter API - Token:', token ? 'Token mevcut' : 'Token yok');
      
      // API endpoint'ini düzelt ve konsola yazdır
      const endpoint = `/api/v1/Inventory/stock/by-barcode/${barcode}`;
      console.log('Envanter API - Endpoint:', endpoint);
      
      const response = await axiosInstance.get(endpoint);
      console.log('Envanter API - Response:', response);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('Barkod ile envanter/stok bilgisi bulundu:', response.data.data);
        
        // API'den gelen verileri InventoryStock formatına dönüştür
        const inventoryStocks: InventoryStock[] = response.data.data.map((item: any) => {
          console.log('Envanter API yanıtı (tek item):', item);
          return {
            itemTypeCode: item.itemTypeCode || '',
            usedBarcode: item.usedBarcode || '',
            itemDescription: item.itemDescription || '',
            colorDescription: item.colorDescription || '',
            binCode: item.binCode || '',
            unitOfMeasureCode: item.unitOfMeasureCode || '',
            barcodeTypeCode: item.barcodeTypeCode || '',
            colorCode: item.colorCode || '',
            itemDim1Code: item.itemDim1Code || '',
            itemDim2TypeCode: item.itemDim2TypeCode || '',
            itemDim2Code: item.itemDim2Code || '',
            itemDim3Code: item.itemDim3Code || '',
            qty: typeof item.qty === 'number' ? item.qty : 0,
            variantIsBlocked: Boolean(item.variantIsBlocked),
            isNotExist: Boolean(item.isNotExist),
            // Ürün kodu bilgisini ekleyelim
            itemCode: item.itemCode || ''
          };
        });
        
        return inventoryStocks;
      }
      
      console.warn('Barkod ile envanter/stok bilgisi bulunamadı:', response.data);
      return [];
    } catch (error) {
      console.error('Barkod ile envanter/stok bilgisi aranırken hata oluştu:', error);
      throw error;
    }
  }
};

export default inventoryApi;
