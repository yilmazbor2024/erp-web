import axiosInstance from '../config/axios';
import { ApiResponse } from '../api-helpers';

// Ürün tipi tanımlamaları
export interface ProductVariant {
  id: string; // Benzersiz tanımlayıcı (UI için gerekli)
  productCode: string;
  productDescription: string;
  colorCode: string;
  colorDescription: string;
  manufacturerColorCode: string;
  itemDim1Code: string;
  itemDim1Name?: string; // Beden adı/açıklaması
  itemDim2Code: string;
  itemDim2Name?: string; // İkinci boyut adı/açıklaması
  itemDim3Code: string;
  itemDim3Name?: string; // Üçüncü boyut adı/açıklaması
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
  vatCode?: string; // KDV kodu (%0, %10, %20 gibi)
  isBlocked: boolean;
  // Eski kodla uyumluluk için eklenen alanlar
  color?: string; // colorDescription ile aynı değere sahip olacak
  size?: string; // itemDim1Code ile aynı değere sahip olacak
  itemTypeCode?: number; // Ürün tipi kodu (1: Ürün, 2: Malzeme)
}

export interface InventoryStock {
  itemTypeCode: string;
  itemCode: string;
  usedBarcode: string;
  itemDescription: string;
  colorDescription: string;
  colorCode: string;
  itemDim1Code: string; // Beden
  itemDim2TypeCode: string;
  itemDim2Code: string;
  itemDim3Code: string;
  binCode: string;
  unitOfMeasureCode: string;
  barcodeTypeCode: string;
  qty: number;
  warehouseCode: string;
  warehouseName: string;
  variantIsBlocked: boolean;
  isNotExist: boolean;
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

// Envanter stok sorgulama parametreleri
export interface InventoryStockParams {
  barcode?: string;
  productCode?: string;
  productDescription?: string;
  colorCode?: string;
  itemDim1Code?: string;
  warehouseCode?: string;
  showOnlyPositiveStock?: boolean;
}

// API fonksiyonları
const productApi = {
  // Ürün adı veya kodu ile arama yap
  async searchProducts(searchText: string): Promise<ProductVariant[]> {
    try {
      // console.log('Ürün araması yapılıyor:', searchText);
      
      // Ürün varyantlarını getirmek için getProductVariantsByProductCodeOrDescription fonksiyonunu kullan
      return await this.getProductVariantsByProductCodeOrDescription(searchText);
    } catch (error) {
      console.error('Ürün araması sırasında hata oluştu:', error);
      return [];
    }
  },
  
  // Ürün varyantlarını ürün kodu veya açıklamasına göre getir
  async getProductVariantsByProductCodeOrDescription(searchText: string): Promise<ProductVariant[]> {
    try {
      if (!searchText) {
        console.warn('Arama metni boş, ürün varyantları getirilemedi');
        return [];
      }
      
      // console.log('Ürün kodu/açıklaması ile arama yapılıyor:', searchText);
      
      // Sadece ProductController endpoint'ini kullan
      const response = await axiosInstance.get(`/api/Product/variants/by-product-code-or-description`, {
        params: { searchText }
      });
      
      if (response.data && (response.data.success || response.data.isSuccess) && 
          ((Array.isArray(response.data.data) && response.data.data.length > 0) || 
           (Array.isArray(response.data.items) && response.data.items.length > 0))) {
        
        const responseData = response.data.data || response.data.items;
        // console.log('Ürün kodu/açıklaması ile bulunan varyantlar:', responseData.length, 'adet');
        
        // API'den gelen verileri ProductVariant formatına dönüştür
        const variants: ProductVariant[] = responseData.map((item: any) => {
          // itemTypeCode değerini doğru şekilde ayarla
          let typeCode: number | undefined;
          
          if (item.itemTypeCode) {
            // Eğer doğrudan itemTypeCode varsa, onu kullan
            typeCode = parseInt(String(item.itemTypeCode));
          } else if (item.productTypeCode) {
            // productTypeCode varsa, ona göre belirle
            // productTypeCode = 0 -> ItemTypeCode = 2 (MALZEME)
            // productTypeCode = 1 -> ItemTypeCode = 1 (ÜRÜN)
            typeCode = item.productTypeCode === '0' ? 2 : 1;
          } else {
            // Varsayılan olarak ürün (1) kullan
            typeCode = 1;
          }
          
          return {
            productCode: item.productCode || item.itemCode || '',
            productDescription: item.productDescription || item.itemDescription || '',
            colorCode: item.colorCode || '',
            colorDescription: item.colorDescription || '',
            manufacturerColorCode: item.manufacturerColorCode || '',
            itemDim1Code: item.itemDim1Code || item.size || '',
            itemDim1Name: item.itemDim1Name || item.itemDim1Description || item.itemDim1Code || '',
            itemDim2Code: item.itemDim2Code || '',
            itemDim2Name: item.itemDim2Name || item.itemDim2Description || item.itemDim2Code || '',
            itemDim3Code: item.itemDim3Code || '',
            itemDim3Name: item.itemDim3Name || item.itemDim3Description || item.itemDim3Code || '',
            barcodeTypeCode: item.barcodeTypeCode || '',
            barcode: item.barcode || item.usedBarcode || '',
            notHaveBarcodes: Boolean(item.notHaveBarcodes),
            qty: item.qty !== null && item.qty !== undefined ? Number(item.qty) : null,
            productTypeCode: item.productTypeCode || item.itemTypeCode || '',
            productTypeDescription: item.productTypeDescription || '',
            unitOfMeasureCode1: item.unitOfMeasureCode1 || item.unitOfMeasureCode || '',
            unitOfMeasureCode2: item.unitOfMeasureCode2 || '',
            salesPrice1: typeof item.salesPrice1 === 'number' ? item.salesPrice1 : 0,
            vatRate: item.vatRate !== null && item.vatRate !== undefined ? Number(item.vatRate) : 18,
            isBlocked: Boolean(item.isBlocked || item.variantIsBlocked),
            // itemTypeCode alanını ekle
            itemTypeCode: typeCode
          };
        });
        
        return variants;
      }
      
      // Bulunamadıysa boş dizi döndür
      // console.log('Ürün kodu/açıklaması ile varyant bulunamadı');
      return [];
    } catch (error) {
      console.error('Ürün kodu veya açıklamasına göre ürün varyantları alınırken hata oluştu:', error);
      return [];
    }
  },
  // Çok amaçlı envanter/stok sorgulama
  async getInventoryStockMultiPurpose(params: InventoryStockParams): Promise<InventoryStock[]> {
    try {
      // console.log('Envanter/stok bilgileri getiriliyor... Parametreler:', params);
      
      const queryParams = new URLSearchParams();
      
      // Parametreleri ekle
      if (params.barcode) queryParams.append('barcode', params.barcode);
      if (params.productCode) queryParams.append('productCode', params.productCode);
      if (params.productDescription) queryParams.append('productDescription', params.productDescription);
      if (params.colorCode) queryParams.append('colorCode', params.colorCode);
      if (params.itemDim1Code) queryParams.append('itemDim1Code', params.itemDim1Code);
      if (params.warehouseCode) queryParams.append('warehouseCode', params.warehouseCode);
      if (params.showOnlyPositiveStock !== undefined) queryParams.append('showOnlyPositiveStock', params.showOnlyPositiveStock.toString());
      
      // console.log('Envanter API çağrısı yapılıyor:', `/api/Inventory/stock/multi-purpose?${queryParams.toString()}`);
      const response = await axiosInstance.get<ApiResponse<InventoryStock[]>>(`/api/Inventory/stock/multi-purpose?${queryParams.toString()}`);
      // console.log('Envanter API yanıtı alındı:', response.data);
      
      if (response.data && response.data.success) {
        return response.data.data.map((item: any) => ({
          itemTypeCode: item.itemTypeCode,
          itemCode: item.itemCode,
          usedBarcode: item.usedBarcode,
          itemDescription: item.itemDescription,
          colorDescription: item.colorDescription,
          colorCode: item.colorCode,
          itemDim1Code: item.itemDim1Code,
          itemDim2TypeCode: item.itemDim2TypeCode,
          itemDim2Code: item.itemDim2Code,
          itemDim3Code: item.itemDim3Code,
          binCode: item.binCode,
          unitOfMeasureCode: item.unitOfMeasureCode,
          barcodeTypeCode: item.barcodeTypeCode,
          qty: item.qty,
          warehouseCode: item.warehouseCode,
          warehouseName: item.warehouseName,
          variantIsBlocked: item.variantIsBlocked,
          isNotExist: item.isNotExist
        }));
      }
      return [];
    } catch (error: any) {
      console.error('Envanter/stok bilgileri alınırken hata oluştu:', error);
      console.error('Hata detayları:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.response?.data
      });
      return [];
    }
  },

  // Ürün listesini getir
  async getProducts(params?: ProductListParams): Promise<ProductListResponse> {
    try {
      // console.log('Ürün listesi getiriliyor... Parametreler:', params);
      
      // API endpoint'ini değiştir: /api/products -> /api/Item
      const queryParams = new URLSearchParams();
      
      // Sayfalama parametrelerini ekleyelim - tüm ürünleri almak için pageSize'i büyük bir değer yapalım
      queryParams.append('pageSize', '10000'); // Daha büyük bir değer kullan
      queryParams.append('pageNumber', '1');
      
      // Eğer searchTerm varsa, doğrudan ürün kodu üzerinden arama yapalım
      if (params?.searchTerm) {
        // Arama terimini temizle ve URL-safe hale getir
        const searchTerm = params.searchTerm.trim();
        queryParams.append('searchTerm', searchTerm);
        
        // Ürün kodu araması için özel parametre ekleyelim
        queryParams.append('searchField', 'itemCode'); // Ürün kodu alanında ara
        // console.log(`Ürün kodu araması: "${searchTerm}"`);
      }
      
      // Diğer parametreleri ekle
      if (params) {
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
        if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
        if (params.productTypeCode) queryParams.append('productTypeCode', params.productTypeCode);
        if (params.isBlocked !== undefined) queryParams.append('isBlocked', params.isBlocked.toString());
      }
      
      // console.log('Ürün API çağrısı yapılıyor:', `/api/Item?${queryParams.toString()}`);
      const response = await axiosInstance.get(`/api/Item?${queryParams.toString()}`);
      // console.log('Ürün API yanıtı alındı');
      
      if (response.data && response.data.success) {
        // console.log('Ürün API yanıtı başarılı');
        
        // API yanıtını frontend modeliyle eşleştir
        const data = response.data.data;
        
        // Sayfalama yapısını kontrol et
        let items = [];
        let totalCount = 0;
        
        if (data && data.items && Array.isArray(data.items)) {
          items = data.items;
          totalCount = data.totalCount || items.length;
          // console.log(`API yanıtında ${items.length} ürün bulundu`);
        } else if (data && Array.isArray(data)) {
          items = data;
          totalCount = items.length;
          // console.log(`API yanıtında dizi olarak ${items.length} ürün bulundu`);
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
        
        // console.log(`${standardizedItems.length} ürün verisi standartlaştırıldı`);
        
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

      // console.log(`Ürün detayı için istek yapılıyor: ${productCode}`);
      
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
  
  // Sadece barkod ile ürün varyantlarını ara
  async getProductVariantsByBarcode(searchText: string): Promise<ProductVariant[]> {
    try {
      if (!searchText) {
        console.warn('Barkod araması için boş değer gönderildi');
        return [];
      }
      
      // Barkod değerini temizle (boşluk vs.)
      const cleanBarcode = searchText.trim();
      // console.log(`Sadece barkod ile ürün varyantı aranıyor: ${cleanBarcode}`);
      
      try {
        // Önce Item API'sini deneyelim
        // console.log(`/api/Item API'si deneniyor: ${cleanBarcode}`);
        const itemResponse = await axiosInstance.get(`/api/Item/${cleanBarcode}`);
        
        if (itemResponse.data && itemResponse.data.success && itemResponse.data.data) {
          // console.log('Item API ile ürün bulundu:', itemResponse.data.data);
          const item = itemResponse.data.data;
          
          // Item API'den gelen veriyi ProductVariant formatına dönüştür
          const variant: ProductVariant = {
            id: item.itemCode || '', // id alanı için itemCode kullan
            productCode: item.itemCode || '',
            productDescription: item.itemDescription || '',
            colorCode: item.colorCode || '',
            colorDescription: item.colorDescription || '',
            manufacturerColorCode: item.manufacturerColorCode || '',
            itemDim1Code: item.itemDim1Code || item.size || '',
            itemDim1Name: item.itemDim1Name || item.itemDim1Description || item.itemDim1Code || '',
            itemDim2Code: item.itemDim2Code || '',
            itemDim2Name: item.itemDim2Name || item.itemDim2Description || item.itemDim2Code || '',
            itemDim3Code: item.itemDim3Code || '',
            itemDim3Name: item.itemDim3Name || item.itemDim3Description || item.itemDim3Code || '',
            barcodeTypeCode: item.barcodeTypeCode || '',
            barcode: item.barcode || item.usedBarcode || cleanBarcode,
            notHaveBarcodes: Boolean(item.notHaveBarcodes),
            qty: item.qty !== null && item.qty !== undefined ? Number(item.qty) : null,
            productTypeCode: item.itemTypeCode || '',
            productTypeDescription: item.productTypeDescription || '',
            unitOfMeasureCode1: item.unitOfMeasureCode || '',
            unitOfMeasureCode2: '',
            salesPrice1: typeof item.salesPrice1 === 'number' ? item.salesPrice1 : 0,
            vatRate: item.vatRate !== null && item.vatRate !== undefined ? Number(item.vatRate) : 10,
            isBlocked: Boolean(item.isBlocked),
            // itemTypeCode alanını doğru şekilde ayarla (1: Ürün, 2: Malzeme)
            itemTypeCode: item.itemTypeCode 
          };
          
          return [variant];
        }
      } catch (itemError) {
        // console.log('Item API ile ürün bulunamadı, Product API deneniyor:', itemError);
      }
      
      // Item API başarısız olduysa Product API'yi dene
      // console.log(`Product API deneniyor: /api/Product/variants/by-barcode/${cleanBarcode}`);
      const response = await axiosInstance.get(`/api/Product/variants/by-barcode/${cleanBarcode}`);
      
      if (response.data && (response.data.success || response.data.isSuccess) && 
          ((Array.isArray(response.data.data) && response.data.data.length > 0) || 
           (Array.isArray(response.data.items) && response.data.items.length > 0))) {
        
        const responseData = response.data.data || response.data.items;
        // console.log('Barkod ile ürün varyantları bulundu:', responseData);
        
        // API'den gelen verileri ProductVariant formatına dönüştür
        const variants: ProductVariant[] = responseData.map((item: any) => {
          // itemTypeCode değerini doğru şekilde ayarla
          let typeCode: number | undefined;
          
          if (item.itemTypeCode) {
            // Eğer doğrudan itemTypeCode varsa, onu kullan
            typeCode = parseInt(String(item.itemTypeCode));
          } else if (item.productTypeCode) {
            // productTypeCode varsa, ona göre belirle
            // productTypeCode = 0 -> ItemTypeCode = 2 (MALZEME)
            // productTypeCode = 1 -> ItemTypeCode = 1 (ÜRÜN)
            typeCode = item.productTypeCode === '0' ? 2 : 1;
          } else {
            // Varsayılan olarak ürün (1) kullan
            typeCode = 1;
          }
          
          return {
            productCode: item.productCode || item.itemCode || '',
            productDescription: item.productDescription || item.itemDescription || '',
            colorCode: item.colorCode || '',
            colorDescription: item.colorDescription || '',
            manufacturerColorCode: item.manufacturerColorCode || '',
            itemDim1Code: item.itemDim1Code || item.size || '',
            itemDim1Name: item.itemDim1Name || item.itemDim1Description || item.itemDim1Code || '',
            itemDim2Code: item.itemDim2Code || '',
            itemDim2Name: item.itemDim2Name || item.itemDim2Description || item.itemDim2Code || '',
            itemDim3Code: item.itemDim3Code || '',
            itemDim3Name: item.itemDim3Name || item.itemDim3Description || item.itemDim3Code || '',
            barcodeTypeCode: item.barcodeTypeCode || '',
            barcode: item.barcode || item.usedBarcode || cleanBarcode,
            notHaveBarcodes: Boolean(item.notHaveBarcodes),
            qty: item.qty !== null && item.qty !== undefined ? Number(item.qty) : null,
            productTypeCode: item.productTypeCode || item.itemTypeCode || '',
            productTypeDescription: item.productTypeDescription || '',
            unitOfMeasureCode1: item.unitOfMeasureCode1 || item.unitOfMeasureCode || '',
            unitOfMeasureCode2: item.unitOfMeasureCode2 || '',
            salesPrice1: typeof item.salesPrice1 === 'number' ? item.salesPrice1 : 0,
            vatRate: item.vatRate !== null && item.vatRate !== undefined ? Number(item.vatRate) : 18,
            isBlocked: Boolean(item.isBlocked || item.variantIsBlocked),
            // itemTypeCode alanını ekle
            itemTypeCode: typeCode
          };
        });
        
        return variants;
      }
      
      // Bulunamadıysa boş dizi döndür
      // console.log(`Barkod ${cleanBarcode} ile hiçbir API'den sonuç alınamadı`);
      return [];
    } catch (error) {
      console.error('Barkod ile ürün varyantları aranırken hata oluştu:', error);
      return [];
    }
  },
  
  // Ürün koduna göre varyantları getir
  async getProductVariantsByCode(productCode: string): Promise<ProductVariant[]> {
    try {
      if (!productCode) {
        throw new Error('Ürün kodu boş olamaz');
      }
      
      // console.log(`Ürün koduna göre varyantlar aranıyor: ${productCode}`);
      
      // Önce API'den varyantları getirmeyi dene
      try {
        // URL yapısını değiştirdim, query parameter kullanıyorum
        // console.log(`API çağrısı yapılıyor: /api/Product/variants/by-product-code?productCode=${productCode}`);
        const response = await axiosInstance.get(`/api/Product/variants/by-product-code`, {
          params: { productCode }
        });
        
        // console.log('API yanıtı:', response.data);
        
        if (response.data && (response.data.success || response.data.isSuccess) && 
            ((Array.isArray(response.data.data) && response.data.data.length > 0) || 
             (Array.isArray(response.data.items) && response.data.items.length > 0))) {
          
          const responseData = response.data.data || response.data.items;
          // console.log('Ürün koduna göre varyantlar bulundu:', responseData);
          
          // API'den gelen verileri ProductVariant formatına dönüştür
          const variants: ProductVariant[] = responseData.map((item: any) => ({
            productCode: item.productCode || '',
            productDescription: item.productDescription || '',
            colorCode: item.colorCode || '',
            colorDescription: item.colorDescription || '',
            manufacturerColorCode: item.manufacturerColorCode || '',
            itemDim1Code: item.itemDim1Code || item.size || '',
            itemDim1Name: item.itemDim1Name || item.itemDim1Description || item.itemDim1Code || '',
            itemDim2Code: item.itemDim2Code || '',
            itemDim2Name: item.itemDim2Name || item.itemDim2Description || item.itemDim2Code || '',
            itemDim3Code: item.itemDim3Code || '',
            itemDim3Name: item.itemDim3Name || item.itemDim3Description || item.itemDim3Code || '',
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
            isBlocked: Boolean(item.isBlocked),
            // itemTypeCode alanını doğru şekilde ayarla (1: Ürün, 2: Malzeme)
            itemTypeCode: item.itemTypeCode ? parseInt(item.itemTypeCode) : (item.productTypeCode === '2' ? 2 : 1) // productTypeCode'a göre ayarla
          }));
          
          return variants;
        }
      } catch (variantError) {
        // console.log('Ürün varyantları bulunamadı, ürün detayı deneniyor:', variantError);
      }
      
      // Varyantlar bulunamazsa, ürün detayını getir
      try {
        // Ürün detayını getir - URL encode ediyoruz ve parametreleri ayrı gönderiyoruz
        // console.log(`Ürün detayı aranıyor: /api/Item - searchTerm: ${productCode}`);
        const productResponse = await axiosInstance.get(`/api/Item`, {
          params: {
            searchTerm: productCode,
            searchField: 'itemCode',
            pageSize: 1
          }
        });
        
        // console.log('Ürün detayı API yanıtı:', productResponse.data);
        
        if (productResponse.data && productResponse.data.success && productResponse.data.data && 
            Array.isArray(productResponse.data.data.items) && productResponse.data.data.items.length > 0) {
          
          const item = productResponse.data.data.items[0];
          // console.log('Ürün detayı bulundu:', item);
          
          // Ürün detayını ProductVariant formatına dönüştür
          const variant: ProductVariant = {
            id: item.itemCode || item.productCode || '', // id alanı için itemCode kullan
            productCode: item.itemCode || item.productCode || '',
            productDescription: item.itemDescription || item.productDescription || '',
            colorCode: item.colorCode || '',
            colorDescription: item.colorDescription || item.color || '',
            manufacturerColorCode: '',
            itemDim1Code: item.itemDim1Code || item.size || '',
            itemDim2Code: '',
            itemDim3Code: '',
            barcodeTypeCode: '',
            barcode: '',
            notHaveBarcodes: false,
            qty: null,
            productTypeCode: item.productTypeCode || '',
            productTypeDescription: item.productTypeDescription || '',
            unitOfMeasureCode1: item.unitOfMeasureCode1 || 'ADET',
            unitOfMeasureCode2: item.unitOfMeasureCode2 || '',
            salesPrice1: typeof item.salesPrice1 === 'number' ? item.salesPrice1 : 0,
            vatRate: item.vatRate !== null && item.vatRate !== undefined ? Number(item.vatRate) : 18,
            isBlocked: Boolean(item.isBlocked)
          };
          
          return [variant];
        }
      } catch (productError) {
        console.error('Ürün detayı alınırken hata oluştu:', productError);
      }
      
      console.warn('Ürün koduna göre hiçbir ürün bulunamadı:', productCode);
      return [];
    } catch (error) {
      console.error('Ürün koduna göre varyantlar aranırken hata oluştu:', error);
      // Hata durumunda boş dizi döndür
      return [];
    }
  },
  
  // Ürün koduna göre fiyat listesini getir
  async getProductPriceList(productCode: string): Promise<ProductPriceList[]> {
    try {
      if (!productCode) {
        console.warn('Ürün kodu boş, fiyat listesi getirilemedi');
        return [];
      }
      
      // API dokümanında belirtilen kesin doğru endpoint
      const endpoint = `/api/Product/${productCode}/price-list`;
      // console.log(`Ürün fiyat listesi endpoint: ${endpoint}`);
      
      const response = await axiosInstance.get(endpoint);
      
      if (response.data && (response.data.success || response.data.isSuccess) && 
          (Array.isArray(response.data.data) || Array.isArray(response.data.items))) {
        
        const items = response.data.data || response.data.items || [];
        // console.log('Ürün fiyat listesi bulundu:', items.length, 'adet');
        
        // API'den gelen verileri ProductPriceList formatına dönüştür
        const priceList: ProductPriceList[] = items.map((item: any) => {
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
            vatRate: item.vatRate === 18 ? 10 : (item.vatRate || 10), // 18 ise 10'a çevir, yoksa 10 kullan
            productCode: item.productCode || productCode
          };
        });
        
        return priceList;
      }
      
      // Veri bulunamadıysa boş dizi döndür
      console.warn('Ürün fiyat listesi bulunamadı');
      return [];
    } catch (error: any) {
      // Hata durumunda log yazdır ve boş dizi döndür
      if (error.response && error.response.status === 404) {
        console.warn(`Ürün kodu ${productCode} için fiyat listesi bulunamadı (404)`);
      } else {
        console.error('Ürün fiyat listesi aranırken hata oluştu:', error);
      }
      return [];
    }
  }
};

export default productApi;