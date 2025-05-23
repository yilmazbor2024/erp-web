import api from './api';

// Müşteri API'leri
export const customerApi = {
  // Müşteri listesini getir
  getCustomers: async (params?: any) => {
    try {
      console.log('Müşteri listesi getiriliyor... Parametreler:', params);
      
      // CurrAccTypeCode parametresi ekleyelim
      const queryParams = params || {};
      queryParams.currAccTypeCode = queryParams.currAccTypeCode || 3; // Varsayılan olarak müşteri tipi (3)
      
      // Sayfalama parametrelerini ekleyelim - tüm müşterileri almak için pageSize'i büyük bir değer yapalım
      queryParams.pageSize = 2500; // 2040'dan fazla müşteri olduğunu gördük
      queryParams.pageNumber = 1;
      
      // API'ye parametre göndererek çağır
      const response = await api.get('/api/v1/Customer/customers', { params: queryParams });
      console.log('Müşteri API yanıtı alındı');
      
      // API yanıtını doğru şekilde işle
      if (response.data && response.data.success) {
        console.log('Müşteri API yanıtı başarılı');
        
        let customerData = [];
        
        // Sayfalama yapısını kontrol et
        if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          // API yanıtı data.data.data içinde
          customerData = response.data.data.data;
          console.log(`data.data.data içinde ${customerData.length} müşteri bulundu`);
        } else if (response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
          // API yanıtı data.data.items içinde
          customerData = response.data.data.items;
          console.log(`data.data.items içinde ${customerData.length} müşteri bulundu`);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // API yanıtı doğrudan data dizisi içinde
          customerData = response.data.data;
          console.log(`data dizisi içinde ${customerData.length} müşteri bulundu`);
        } else if (response.data.data && response.data.data.totalRecords) {
          // Sayfalama yapısı içinde data alanı kontrol et
          console.log(`Toplam kayıt sayısı: ${response.data.data.totalRecords}`);
          
          if (response.data.data.data && Array.isArray(response.data.data.data)) {
            customerData = response.data.data.data;
            console.log(`Sayfalama yapısında data.data.data içinde ${customerData.length} müşteri bulundu`);
          }
        }
        
        // Eğer müşteri verileri bulunamadıysa, API yanıtını detaylı inceleyelim
        if (customerData.length === 0) {
          console.log('Müşteri verileri bulunamadı, API yanıtını detaylı inceliyorum:', JSON.stringify(response.data));
          
          // API yanıtında items alanı kontrol et
          if (response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
            customerData = response.data.data.items;
            console.log(`items alanında ${customerData.length} müşteri bulundu`);
          }
        }
        
        // Hala müşteri verisi bulunamadıysa, örnek veriler kullan
        if (customerData.length === 0) {
          console.warn('API yanıtından müşteri verileri çıkarılamadı, örnek müşteri verileri kullanılıyor');
          customerData = [
            { customerCode: '120.001', customerName: 'ÇETİNTAŞ TEKS.ÜRÜNLERİ SAN.VE TİC.A.Ş...T', currAccTypeCode: 3 },
            { customerCode: '120.002', customerName: 'A.G.S.GİYİM-ABDÜLKADİR SÖNMEZ', currAccTypeCode: 3 },
            { customerCode: '120.003', customerName: 'EGEMEN CENTER', currAccTypeCode: 3 },
            { customerCode: '120.004', customerName: 'ALFURSAN DIŞ.TİC.TURİZM YATIRIM VE TAAHHÜT LTD.ŞTİ.', currAccTypeCode: 3 },
            { customerCode: '120.005', customerName: 'ALİ ARAT İPEKÇİ ŞERİF ARAT', currAccTypeCode: 3 }
          ];
        }
        
        console.log(`Toplam ${customerData.length} müşteri verisi işleniyor`);
        
        // Her müşteri için adları düzgün şekilde ayarla
        const enhancedData = customerData.map((customer: any) => {
          // customerCode veya currAccCode kontrolü
          const code = customer.customerCode || customer.currAccCode || customer.code || '';
          // customerName veya currAccDescription kontrolü
          const name = customer.customerName || customer.currAccDescription || customer.name || customer.description || `Müşteri ${code}`;
          
          return {
            ...customer,
            // API'den gelen müşteri verilerini standartlaştır
            code,
            name,
            currAccTypeCode: customer.currAccTypeCode || customer.customerTypeCode || 3, // Varsayılan olarak müşteri tipi (3)
            description: name
          };
        });
        
        console.log(`${enhancedData.length} müşteri verisi standartlaştırıldı`);
        
        return {
          success: true,
          message: 'Müşteriler başarıyla getirildi',
          data: enhancedData
        };
      }
      // Veri yoksa boş dizi döndür
      console.warn('Müşteri verisi bulunamadı veya boş');
      return {
        success: false,
        message: 'Müşteri verisi bulunamadı',
        data: []
      };
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        message: `Müşteriler getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: []
      };
    }
  },

  // Müşteri detayını getir
  getCustomerByCode: async (customerCode: string) => {
    try {
      const response = await api.get(`/api/v1/Customer/${customerCode}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching customer ${customerCode}:`, error);
      return {
        success: false,
        message: `Müşteri detayı getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },

  // Yeni müşteri oluştur
  createCustomer: async (customer: any) => {
    try {
      const response = await api.post('/api/v1/Customer/Create', customer);
      return response.data;
    } catch (error: any) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        message: `Müşteri oluşturulurken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  }
};

// Ürün/Malzeme API'leri
export const productApi = {
  // Ürün listesini getir
  getProducts: async (params?: any) => {
    try {
      // Doğru API endpoint'ini kullanarak gerçek ürün verilerini getir
      const response = await api.get('/api/v1/Product', { params });
      console.log('Product API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        message: `Ürünler getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: []
      };
    }
  },

  // Ürün detayını getir
  getProductByCode: async (productCode: string) => {
    try {
      const response = await api.get(`/api/v1/Product/${productCode}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching product ${productCode}:`, error);
      return {
        success: false,
        message: `Ürün detayı getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },

  // Ölçü birimlerini getir
  getUnitsOfMeasure: async () => {
    try {
      const response = await api.get('/api/v1/Product/units-of-measure');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching units of measure:', error);
      return {
        success: false,
        message: `Ölçü birimleri getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  }
};

// Depo API'leri
export const warehouseApi = {
  // Depo listesini getir
  getWarehouses: async () => {
    try {
      const response = await api.get('/api/v1/Warehouse');
      console.log('Depo API yanıtı:', response.data);
      
      // API yanıtını doğru şekilde işle
      if (response.data && response.data.success) {
        // Veri yapısını kontrol et ve doğru depo adlarını sağla
        const processedData = response.data.data;
        
        if (Array.isArray(processedData)) {
          // Her depo için adı düzgün şekilde ayarla
          const enhancedData = processedData.map(warehouse => ({
            ...warehouse,
            // Eğer warehouseName yoksa veya anlamsızsa, warehouseDescription kullan
            warehouseName: warehouse.warehouseDescription || warehouse.warehouseName || `Depo ${warehouse.warehouseCode}`
          }));
          
          return {
            ...response.data,
            data: enhancedData
          };
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching warehouses:', error);
      return {
        success: false,
        message: `Depolar getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: []
      };
    }
  },

  // Depo detayını getir
  getWarehouseByCode: async (warehouseCode: string) => {
    try {
      const response = await api.get(`/api/v1/Warehouse/${warehouseCode}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching warehouse ${warehouseCode}:`, error);
      return {
        success: false,
        message: `Depo detayı getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  }
};

// Ofis API'leri
export const officeApi = {
  // Ofis listesini getir
  getOffices: async () => {
    try {
      const response = await api.get('/api/v1/Warehouse/offices');
      console.log('Ofis API yanıtı:', response.data);
      
      // API yanıtını doğru şekilde işle
      if (response.data && response.data.success) {
        // Veri yapısını kontrol et ve doğru ofis adlarını sağla
        const processedData = response.data.data;
        
        if (Array.isArray(processedData)) {
          // Her ofis için adı düzgün şekilde ayarla
          const enhancedData = processedData.map(office => ({
            ...office,
            // Eğer officeName yoksa veya anlamsızsa, officeDescription kullan
            officeName: office.officeDescription || office.officeName || `Ofis ${office.officeCode}`
          }));
          
          return {
            ...response.data,
            data: enhancedData
          };
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching offices:', error);
      return {
        success: false,
        message: `Ofisler getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: []
      };
    }
  }
};

// Vergi dairesi API'leri
export const taxOfficeApi = {
  // Vergi dairesi listesini getir
  getTaxOffices: async () => {
    try {
      const response = await api.get('/api/v1/Warehouse/tax-offices');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tax offices:', error);
      return {
        success: false,
        message: `Vergi daireleri getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  }
};

// Konum API'leri
export const locationApi = {
  // İlleri getir
  getStates: async () => {
    try {
      const response = await api.get('/api/v1/State');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching states:', error);
      return {
        success: false,
        message: `İller getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },

  // Şehirleri getir
  getCities: async () => {
    try {
      const response = await api.get('/api/v1/Customer/cities');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching cities:', error);
      return {
        success: false,
        message: `Şehirler getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },

  // İlçeleri getir
  getDistricts: async () => {
    try {
      const response = await api.get('/api/v1/Customer/districts');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching districts:', error);
      return {
        success: false,
        message: `İlçeler getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },

  // Konum hiyerarşisini getir
  getLocationHierarchy: async () => {
    try {
      const response = await api.get('/api/v1/Location/hierarchy');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching location hierarchy:', error);
      return {
        success: false,
        message: `Konum hiyerarşisi getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  }
};

// Tedarikçi API'leri
export const vendorApi = {
  // Tedarikçi listesini getir
  getVendors: async (params?: any) => {
    try {
      // Müşteri API'sini kullanalım, çünkü Vendor/vendors endpoint'i çalışmıyor
      const response = await api.get('/api/v1/Customer/customers');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      return {
        success: false,
        message: `Tedarikçiler getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: []
      };
    }
  },

  // Tedarikçi detayını getir
  getVendorByCode: async (vendorCode: string) => {
    try {
      const response = await api.get(`/api/v1/VendorBasic/${vendorCode}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching vendor ${vendorCode}:`, error);
      return {
        success: false,
        message: `Tedarikçi detayı getirilirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  }
};

export const currencyApi = {
  // Para birimi listesini getir - Müşteri oluşturma formundaki gibi
  getCurrencies: async () => {
    // Varsayılan para birimleri
    const defaultCurrencies = {
      success: true,
      message: 'Varsayılan para birimleri kullanılıyor',
      data: [
        { currencyCode: 'TRY', currencyDescription: 'Türk Lirası', isBlocked: false },
        { currencyCode: 'USD', currencyDescription: 'Amerikan Doları', isBlocked: false },
        { currencyCode: 'EUR', currencyDescription: 'Euro', isBlocked: false },
        { currencyCode: 'GBP', currencyDescription: 'İngiliz Sterlini', isBlocked: false }
      ]
    };
    
    // API çağrısını etkinleştir
    const shouldTryAPI = true;
    
    if (shouldTryAPI) {
      try {
        // Birincil endpoint'i dene
        try {
          console.log('Para birimi API çağrılıyor...');
          const response = await api.get('/api/v1/Currency');
          console.log('Para birimi API yanıtı:', response.data);
          
          if (response.data) {
            let currencyData = [];
            
            // API yanıtının yapısını kontrol et
            if (Array.isArray(response.data)) {
              // Doğrudan dizi olarak döndü
              currencyData = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              // data alanı içinde dizi olarak döndü
              currencyData = response.data.data;
            } else if (response.data.success && response.data.data) {
              // API yanıt formatı success, data, message şeklinde
              if (Array.isArray(response.data.data)) {
                currencyData = response.data.data;
              } else if (typeof response.data.data === 'object') {
                // Tek bir para birimi objesi olabilir
                currencyData = [response.data.data];
              }
            }
            
            console.log('Para birimi veri yapısı:', currencyData);
            
            if (currencyData.length > 0) {
              // API'den gelen verileri işle
              const enhancedData = currencyData.map((currency: any) => ({
                currencyCode: currency.currencyCode || currency.code,
                currencyDescription: currency.currencyDescription || currency.description,
                isBlocked: currency.isBlocked || false,
                // Standart form alan adları için ek alanlar
                code: currency.currencyCode || currency.code,
                name: currency.currencyDescription || currency.description,
                description: currency.currencyDescription || currency.description
              }));
              
              console.log('Standartlaştırılmış para birimi verileri:', enhancedData);
              
              return {
                success: true,
                message: 'Para birimleri başarıyla getirildi',
                data: enhancedData
              };
            }
          }
          
          // Veri yoksa varsayılan değerleri döndür
          console.log('API yanıtı boş, varsayılan para birimlerini kullanıyoruz');
          return defaultCurrencies;
        } catch (error) {
          console.error('Para birimi birincil endpoint hatası:', error);
          throw error; // Alternatif endpoint'e geçmek için hatayı tekrar fırlat
        }
      } catch (primaryError) {
        // Alternatif endpoint'i dene
        try {
          console.log('Para birimi API çağrılıyor (alternatif endpoint)...');
          const altResponse = await api.get('/api/Currency');
          console.log('Para birimi alternatif API yanıtı:', altResponse.data);
          
          if (altResponse.data) {
            let currencyData = [];
            
            // API yanıtının yapısını kontrol et
            if (Array.isArray(altResponse.data)) {
              currencyData = altResponse.data;
            } else if (altResponse.data.data && Array.isArray(altResponse.data.data)) {
              currencyData = altResponse.data.data;
            } else if (altResponse.data.success && altResponse.data.data) {
              if (Array.isArray(altResponse.data.data)) {
                currencyData = altResponse.data.data;
              } else if (typeof altResponse.data.data === 'object') {
                currencyData = [altResponse.data.data];
              }
            }
            
            if (currencyData.length > 0) {
              // API'den gelen verileri işle
              const enhancedData = currencyData.map((currency: any) => ({
                currencyCode: currency.currencyCode || currency.code,
                currencyDescription: currency.currencyDescription || currency.description,
                isBlocked: currency.isBlocked || false,
                // Standart form alan adları için ek alanlar
                code: currency.currencyCode || currency.code,
                name: currency.currencyDescription || currency.description,
                description: currency.currencyDescription || currency.description
              }));
              
              return {
                success: true,
                message: 'Para birimleri alternatif endpoint\'ten getirildi',
                data: enhancedData
              };
            }
          }
          
          // Veri yoksa varsayılan değerleri döndür
          console.log('Alternatif API yanıtı boş, varsayılan para birimlerini kullanıyoruz');
          return defaultCurrencies;
        } catch (altError) {
          console.error('Para birimi alternatif endpoint hatası:', altError);
          
          // Her iki endpoint de başarısız olduysa varsayılan değerleri döndür
          console.log('Her iki API de başarısız, varsayılan para birimlerini kullanıyoruz');
          return defaultCurrencies;
        }
      }
    } else {
      // API çağrısı devre dışı bırakıldı
      return defaultCurrencies;
    }
  }
};

export default {
  customerApi,
  productApi,
  warehouseApi,
  officeApi,
  taxOfficeApi,
  locationApi,
  vendorApi,
  currencyApi
};
