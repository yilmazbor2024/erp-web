import axiosInstance from '../config/axios';
import { ApiResponse } from '../api-helpers';

// Ürün tipi tanımlamaları
export interface ProductVariant {
  productCode: string;
  productDescription: string;
  colorCode: string;
  colorDescription: string;
  manufacturerColorCode: string;
  itemDim1Code: string;
  itemDim2Code: string;
  itemDim3Code: string;
  barcodeTypeCode: string;
  barcode: string;
  notHaveBarcodes: boolean;
  qty: number | null;
  productTypeCode: string;
  productTypeDescription: string;
  unitOfMeasureCode1: string;
  unitOfMeasureCode2: string;
  salesPrice1: number;
  vatRate: number | null;
  isBlocked: boolean;
}

export interface ProductPriceList {
  priceListNumber: string;
  priceGroupCode: string;
  priceGroupDescription: string;
  priceListTypeCode: string;
  priceListTypeDescription: string;
  priceListDate: string | null;
  validDate: string | null;
  validTime: string | null;
  companyCode: string;
  isConfirmed: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  createdUserName: string;
  lastUpdatedUserName: string;
  birimFiyat?: number; // Yeni SQL sorgusundan gelen BirimFiyat alanı
  itemTypeCode?: string; // Yeni SQL sorgusundan gelen ItemTypeCode alanı
  vatRate: number | null;
  productCode: string;
}

export interface Product {
  productCode: string;
  productDescription: string;
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

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  productTypeCode?: string;
  isBlocked?: boolean;
}

export interface ProductListResponse {
  items: Product[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export interface CreateProductRequest {
  productCode: string;
  productDescription: string;
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

export interface UpdateProductRequest {
  productDescription?: string;
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
const productApi = {
  // Ürün listesini getir
  async getProducts(params?: ProductListParams): Promise<ProductListResponse> {
    try {
      console.log('Ürün listesi getiriliyor... Parametreler:', params);
      
      // API endpoint'ini değiştir: /api/products -> /api/Item
      const queryParams = new URLSearchParams();
      
      // Sayfalama parametrelerini ekleyelim - tüm ürünleri almak için pageSize'i büyük bir değer yapalım
      queryParams.append('pageSize', '2500'); // Büyük bir değer kullan
      queryParams.append('pageNumber', '1');
      
      // Diğer parametreleri ekle
      if (params) {
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
        if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
        if (params.productTypeCode) queryParams.append('productTypeCode', params.productTypeCode);
        if (params.isBlocked !== undefined) queryParams.append('isBlocked', params.isBlocked.toString());
      }
      
      console.log('Ürün API çağrısı yapılıyor:', `/api/Item?${queryParams.toString()}`);
      const response = await axiosInstance.get(`/api/Item?${queryParams.toString()}`);
      console.log('Ürün API yanıtı alındı');
      
      if (response.data && response.data.success) {
        console.log('Ürün API yanıtı başarılı');
        
        // API yanıtını frontend modeliyle eşleştir
        const data = response.data.data;
        
        // Sayfalama yapısını kontrol et
        let items = [];
        let totalCount = 0;
        
        if (data && data.items && Array.isArray(data.items)) {
          items = data.items;
          totalCount = data.totalCount || items.length;
          console.log(`API yanıtında ${items.length} ürün bulundu`);
        } else if (data && Array.isArray(data)) {
          items = data;
          totalCount = items.length;
          console.log(`API yanıtında dizi olarak ${items.length} ürün bulundu`);
        } else {
          console.warn('API yanıtında ürün verisi bulunamadı:', data);
        }
        
        // Ürün verilerini standartlaştır
        const standardizedItems = items.map((item: any) => ({
          productCode: item.itemCode || item.productCode || '',
          productDescription: item.itemDescription || item.productDescription || '',
          productTypeCode: item.productTypeCode || '',
          productTypeDescription: item.productTypeDescription || '',
          itemDimTypeCode: item.itemDimTypeCode || '',
          itemDimTypeDescription: item.itemDimTypeDescription || '',
          unitOfMeasureCode1: item.unitOfMeasureCode1 || 'ADET',
          unitOfMeasureCode2: item.unitOfMeasureCode2 || '',
          companyBrandCode: item.companyBrandCode || '',
          color: item.color || '',
          size: item.size || '',
          usePOS: item.usePOS || false,
          useStore: item.useStore || false,
          useRoll: item.useRoll || false,
          useBatch: item.useBatch || false,
          generateSerialNumber: item.generateSerialNumber || false,
          useSerialNumber: item.useSerialNumber || false,
          isUTSDeclaratedItem: item.isUTSDeclaratedItem || false,
          createdDate: item.createdDate || '',
          lastUpdatedDate: item.lastUpdatedDate || '',
          isBlocked: item.isBlocked || false
        }));
        
        console.log(`${standardizedItems.length} ürün verisi standartlaştırıldı`);
        
        return {
          items: standardizedItems,
          totalCount: totalCount,
          pageCount: data.pageCount || 1,
          currentPage: data.currentPage || 1,
          pageSize: data.pageSize || standardizedItems.length
        };
      }
      
      throw new Error('Failed to fetch products');
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  // Ürün detayını getir
  async getProductDetail(productCode: string): Promise<Product> {
    try {
      if (!productCode) {
        throw new Error('Ürün kodu boş olamaz');
      }

      // Özel route parametreleri için kontrol
      if (productCode === 'price-list') {
        throw new Error('Bu sayfa bir ürün detayı değil, fiyat listesi sayfasıdır. Lütfen geçerli bir ürün kodu ile tekrar deneyin.');
      }

      console.log(`Ürün detayı için istek yapılıyor: ${productCode}`);
      
      // Doğru endpoint'i kullan
      const response = await axiosInstance.get(`/api/Item/${productCode}`, {
        params: {
          langCode: 'TR'
        }
      });
      
      if (response.data && response.data.success) {
        // API yanıtını frontend modeliyle eşleştir
        const item = response.data.data;
        
        return {
          productCode: item.itemCode,
          productDescription: item.itemDescription,
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
      
      throw new Error(`Ürün detayları getirilemedi: ${productCode}`);
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  },
  
  // Yeni ürün oluştur
  async createProduct(product: CreateProductRequest): Promise<Product> {
    try {
      // API endpoint'ini değiştir: /api/products -> /api/Item
      // Request modelini ItemController'ın beklediği modele dönüştür
      const createItemRequest = {
        itemCode: product.productCode,
        itemDescription: product.productDescription,
        productTypeCode: product.productTypeCode,
        itemDimTypeCode: product.itemDimTypeCode,
        unitOfMeasureCode1: product.unitOfMeasureCode1,
        unitOfMeasureCode2: product.unitOfMeasureCode2,
        companyBrandCode: product.companyBrandCode,
        usePOS: product.usePOS,
        useStore: product.useStore,
        useRoll: product.useRoll,
        useBatch: product.useBatch,
        generateSerialNumber: product.generateSerialNumber,
        useSerialNumber: product.useSerialNumber,
        isUTSDeclaratedItem: product.isUTSDeclaratedItem,
        isBlocked: product.isBlocked
      };
      
      const response = await axiosInstance.post('/api/Item', createItemRequest);
      
      if (response.data && response.data.success) {
        // API yanıtını frontend modeliyle eşleştir
        const item = response.data.data;
        
        return {
          productCode: item.itemCode,
          productDescription: item.itemDescription,
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
      
      throw new Error('Failed to create product');
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },
  
  // Ürün güncelle
  async updateProduct(productCode: string, product: UpdateProductRequest): Promise<Product> {
    try {
      // API endpoint'ini değiştir: /api/products/{productCode} -> /api/Item/{itemCode}
      // Request modelini ItemController'ın beklediği modele dönüştür
      const updateItemRequest = {
        itemDescription: product.productDescription,
        productTypeCode: product.productTypeCode,
        itemDimTypeCode: product.itemDimTypeCode,
        unitOfMeasureCode1: product.unitOfMeasureCode1,
        unitOfMeasureCode2: product.unitOfMeasureCode2,
        companyBrandCode: product.companyBrandCode,
        usePOS: product.usePOS,
        useStore: product.useStore,
        useRoll: product.useRoll,
        useBatch: product.useBatch,
        generateSerialNumber: product.generateSerialNumber,
        useSerialNumber: product.useSerialNumber,
        isUTSDeclaratedItem: product.isUTSDeclaratedItem,
        isBlocked: product.isBlocked
      };
      
      const response = await axiosInstance.put(`/api/Item/${productCode}`, updateItemRequest);
      
      if (response.data && response.data.success) {
        // API yanıtını frontend modeliyle eşleştir
        const item = response.data.data;
        
        return {
          productCode: item.itemCode,
          productDescription: item.itemDescription,
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
      
      throw new Error('Failed to update product');
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },
  
  // Ürün sil
  async deleteProduct(productCode: string): Promise<void> {
    try {
      // API endpoint'ini değiştir: /api/products/{productCode} -> /api/Item/{itemCode}
      const response = await axiosInstance.delete(`/api/Item/${productCode}`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
  
  // Ürün tiplerini getir
  async getProductTypes(): Promise<{ code: string; description: string }[]> {
    try {
      // Ürün tiplerini getirmek için yeni endpoint kullan
      const response = await axiosInstance.get('/api/Item/product-types');
      
      if (response.data && response.data.success) {
        return response.data.data.map((type: any) => ({
          code: type.productTypeCode,
          description: type.productTypeDescription
        }));
      }
      
      throw new Error('Failed to fetch product types');
    } catch (error) {
      console.error('Error fetching product types:', error);
      throw error;
    }
  },
  
  // Ölçü birimlerini getir
  async getUnitOfMeasures(): Promise<{ unitOfMeasureCode: string; unitOfMeasureDescription: string }[]> {
    // API'nin 500 hatası verdiğini bildiğimiz için, gereksiz API çağrısı yapmadan doğrudan varsayılan değerleri döndürelim
    // Bu sayede konsol hataları azalacak
    
    // Üretim ortamında API çağrısını etkinleştirmek için bu bayrağı true yapın
    const shouldTryAPI = false;
    
    if (shouldTryAPI) {
      try {
        // Ölçü birimlerini getirmek için yeni endpoint kullan
        const response = await axiosInstance.get('/api/Item/unit-of-measures');
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          return response.data.data.map((unit: any) => ({
            unitOfMeasureCode: unit.unitOfMeasureCode,
            unitOfMeasureDescription: unit.unitOfMeasureDescription
          }));
        }
        
        // API yanıtı başarısız ise varsayılan birim listesi döndür
        return this.getDefaultUnitOfMeasures();
      } catch (error) {
        // Hata durumunda varsayılan birim listesi döndür
        return this.getDefaultUnitOfMeasures();
      }
    } else {
      // API çağrısı devre dışı bırakıldı, doğrudan varsayılan değerleri döndür
      return this.getDefaultUnitOfMeasures();
    }
  },
  
  // Varsayılan ölçü birimlerini döndür
  getDefaultUnitOfMeasures(): { unitOfMeasureCode: string; unitOfMeasureDescription: string }[] {
    return [
      { unitOfMeasureCode: 'ADET', unitOfMeasureDescription: 'Adet' },
      { unitOfMeasureCode: 'KG', unitOfMeasureDescription: 'Kilogram' },
      { unitOfMeasureCode: 'LT', unitOfMeasureDescription: 'Litre' },
      { unitOfMeasureCode: 'MT', unitOfMeasureDescription: 'Metre' },
      { unitOfMeasureCode: 'M2', unitOfMeasureDescription: 'Metrekare' },
      { unitOfMeasureCode: 'M3', unitOfMeasureDescription: 'Metreküp' },
      { unitOfMeasureCode: 'PKT', unitOfMeasureDescription: 'Paket' },
      { unitOfMeasureCode: 'KTN', unitOfMeasureDescription: 'Karton' }
    ];
  },
  
  // Barkod ile ürün varyantlarını ara
  async getProductVariantsByBarcode(barcode: string): Promise<ProductVariant[]> {
    try {
      if (!barcode) {
        throw new Error('Barkod boş olamaz');
      }
      
      console.log(`Barkod ile ürün varyantları aranıyor: ${barcode}`);
      const response = await axiosInstance.get(`/api/Product/variants/by-barcode/${barcode}`);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('Barkod ile ürün varyantları bulundu:', response.data.data);
        
        // API'den gelen verileri ProductVariant formatına dönüştür
        const variants: ProductVariant[] = response.data.data.map((item: any) => ({
          productCode: item.productCode || '',
          productDescription: item.productDescription || '',
          colorCode: item.colorCode || '',
          colorDescription: item.colorDescription || '',
          manufacturerColorCode: item.manufacturerColorCode || '',
          itemDim1Code: item.itemDim1Code || '',
          itemDim2Code: item.itemDim2Code || '',
          itemDim3Code: item.itemDim3Code || '',
          barcodeTypeCode: item.barcodeTypeCode || '',
          barcode: item.barcode || '',
          notHaveBarcodes: Boolean(item.notHaveBarcodes),
          qty: item.qty !== null && item.qty !== undefined ? Number(item.qty) : null,
          productTypeCode: item.productTypeCode || '',
          productTypeDescription: item.productTypeDescription || '',
          unitOfMeasureCode1: item.unitOfMeasureCode1 || '',
          unitOfMeasureCode2: item.unitOfMeasureCode2 || '',
          salesPrice1: typeof item.salesPrice1 === 'number' ? item.salesPrice1 : 0,
          vatRate: item.vatRate !== null && item.vatRate !== undefined ? Number(item.vatRate) : 18,
          isBlocked: Boolean(item.isBlocked)
        }));
        
        return variants;
      }
      
      console.warn('Barkod ile ürün varyantı bulunamadı:', response.data);
      return [];
    } catch (error) {
      console.error('Barkod ile ürün varyantları aranırken hata oluştu:', error);
      throw error;
    }
  },

  // Ürün koduna göre fiyat listesini getir
  async getProductPriceList(productCode: string): Promise<ProductPriceList[]> {
    try {
      if (!productCode) {
        console.warn('Ürün kodu boş, fiyat listesi getirilemedi');
        return [];
      }
      
      console.log(`Ürün koduna göre fiyat listesi aranıyor: ${productCode}`);
      
      // Şu anda örnek veriler döndürüyoruz, API entegrasyonu daha sonra eklenecek
      // Gerçek API entegrasyonu için aşağıdaki kodu kullanabilirsiniz
      /*
      const endpoint = `/api/Item/${productCode}/prices`;
      console.log('Fiyat Listesi API - Endpoint:', endpoint);
      
      const response = await axiosInstance.get(endpoint);
      console.log('Fiyat Listesi API - Response:', response);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('Ürün fiyat listesi bulundu:', response.data.data);
        
        // API'den gelen verileri ProductPriceList formatına dönüştür
        const priceList: ProductPriceList[] = response.data.data.map((item: any) => {
          return {
            priceListNumber: item.priceListNumber || '',
            priceGroupCode: item.priceGroupCode || '',
            priceGroupDescription: item.priceGroupDescription || '',
            priceListTypeCode: item.priceListTypeCode || '',
            priceListTypeDescription: item.priceListTypeDescription || '',
            priceListDate: item.priceListDate,
            validDate: item.validDate,
            validTime: item.validTime,
            companyCode: item.companyCode || '',
            isConfirmed: item.isConfirmed || false,
            isCompleted: item.isCompleted || false,
            isLocked: item.isLocked || false,
            createdUserName: item.createdUserName || '',
            lastUpdatedUserName: item.lastUpdatedUserName || '',
            birimFiyat: item.birimFiyat || 0,
            itemTypeCode: item.itemTypeCode || '',
            vatRate: item.vatRate,
            productCode: item.productCode || productCode
          };
        });
        
        return priceList;
      }
      
      console.warn('Ürün fiyat listesi bulunamadı');
      return [];
      */
      
      // Örnek veriler - ProductPriceList tipine uygun olarak döndürülüyor
      const currentDate = new Date().toISOString();
      return [
        {
          priceListNumber: '001',
          priceGroupCode: 'STANDART',
          priceGroupDescription: 'Standart Fiyat Grubu',
          priceListTypeCode: 'ALIS',
          priceListTypeDescription: 'Alış Fiyatı',
          priceListDate: currentDate,
          validDate: currentDate,
          validTime: null,
          companyCode: '1',
          isConfirmed: true,
          isCompleted: true,
          isLocked: false,
          createdUserName: 'admin',
          lastUpdatedUserName: 'admin',
          birimFiyat: 120.50,
          itemTypeCode: '1',
          vatRate: 18,
          productCode: productCode
        },
        {
          priceListNumber: '002',
          priceGroupCode: 'STANDART',
          priceGroupDescription: 'Standart Fiyat Grubu',
          priceListTypeCode: 'SATIS',
          priceListTypeDescription: 'Satış Fiyatı',
          priceListDate: currentDate,
          validDate: currentDate,
          validTime: null,
          companyCode: '1',
          isConfirmed: true,
          isCompleted: true,
          isLocked: false,
          createdUserName: 'admin',
          lastUpdatedUserName: 'admin',
          birimFiyat: 150.00,
          itemTypeCode: '1',
          vatRate: 18,
          productCode: productCode
        },
        {
          priceListNumber: '003',
          priceGroupCode: 'IHRACAT',
          priceGroupDescription: 'İhracat Fiyat Grubu',
          priceListTypeCode: 'IHRACAT',
          priceListTypeDescription: 'İhracat Fiyatı',
          priceListDate: currentDate,
          validDate: currentDate,
          validTime: null,
          companyCode: '1',
          isConfirmed: true,
          isCompleted: true,
          isLocked: false,
          createdUserName: 'admin',
          lastUpdatedUserName: 'admin',
          birimFiyat: 12.50,
          itemTypeCode: '1',
          vatRate: 0,
          productCode: productCode
        }
      ];
    } catch (error) {
      console.error('Ürün fiyat listesi aranırken hata oluştu:', error);
      throw error;
    }
  }
};

export default productApi;
