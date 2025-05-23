import api from './api';

// Fatura tipi tanımlamaları ve kodları (InvoiceTypeCode)
const INVOICE_TYPES = {
  PAPER: '0', // Kağıt Fatura
  E_INVOICE: '1', // E-Fatura
  E_ARCHIVE: '2' // E-Arşiv
};

// Cari hesap tipleri
const CURR_ACC_TYPES = {
  VENDOR: 1, // Tedarikçi
  CUSTOMER: 3 // Müşteri
};

// İşlem kodları (ProcessCode)
const PROCESS_CODES = {
  WHOLESALE_SALES: 'WS', // Toptan Satış
  WHOLESALE_PURCHASE: 'BP', // Toptan Alış (Bulk Purchase)
  EXPENSE_PURCHASE: 'EP', // Masraf Alış (Expense Purchase)
  EXPENSE_SALES: 'EXP' // Masraf Satış (Expense Sales)
};

// Transfer tipi kodları (TransTypeCode)
const TRANS_TYPE_CODES = {
  INBOUND: '1', // Giriş (Alış işlemleri için)
  OUTBOUND: '2', // Çıkış (Satış işlemleri için)
  TRANSFER: '3'  // Transfer
};

// İade tipi kodları (InvoiceReturnTypeCode)
const INVOICE_RETURN_TYPES = {
  NO_RETURN: '0', // İade değil
  OUTGOING_RETURN: '1', // Gider Pusulası
  COMPANY_RETURN: '2' // Şirket Fatura İadesi
};

// İşlem akış kodları
const PROCESS_FLOW_CODES = {
  WHOLESALE_SALES: 7, // Toptan Satış
  WHOLESALE_PURCHASE: 8, // Toptan Alış
  EXPENSE: 9 // Masraf
};

// Fatura tipi tanımlamaları
export interface InvoiceLine {
  invoiceLineID: string;
  invoiceHeaderID: string;
  sortOrder: number;
  itemTypeCode: string;
  itemCode: string;
  itemName?: string;
  colorCode?: string;
  qty1: number;
  qty2?: number;
  batchCode?: string;
  lineDescription?: string;
  vatCode?: string;
  vatRate: number;
  price: number;
  amount: number;
  discountAmount?: number;
  vatAmount: number;
  netAmount: number;
}

export interface CurrencyDetail {
  currencyCode: string;
  exchangeRate?: number;
  totalAmount: number;
  totalDiscount: number;
  totalVat: number;
  netAmount: number;
}

export interface InvoiceHeader {
  invoiceHeaderID: string;
  transTypeCode: string;
  processCode: string;
  invoiceNumber: string;
  isReturn: boolean;
  invoiceDate: string;
  invoiceTime?: string;
  operationDate?: string;
  series?: string;
  seriesNumber?: string;
  invoiceTypeCode: string;
  isEInvoice: boolean;
  eInvoiceNumber?: string;
  eInvoiceStatusCode?: string;
  paymentTerm?: number;
  description?: string;
  currAccCode: string;
  currAccName?: string;
  taxTypeCode?: string;
  companyCode?: string;
  officeCode?: string;
  warehouseCode?: string;
  exchangeRate?: number;
  totalDiscount?: number;
  totalVat?: number;
  totalAmount?: number;
  netAmount?: number;
}

export interface InvoiceDetail {
  invoiceHeader: InvoiceHeader;
  invoiceLines: InvoiceLine[];
  currencyDetails?: {
    documentCurrency: CurrencyDetail;
    localCurrency: CurrencyDetail;
  };
}

export interface InvoiceListParams {
  pageNumber?: number;
  pageSize?: number;
  page?: number; // Pagination için page alanı
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  currAccCode?: string;
  invoiceNumber?: string;
  invoiceTypeCode?: string;
  processCode?: string; // Backend'e gönderilecek ProcessCode parametresi
  processCodeList?: string[]; // Birden fazla ProcessCode için liste
  isReturn?: boolean;
  isEInvoice?: boolean;
}

export interface InvoiceListResponse {
  items: InvoiceHeader[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

// Toptan Satış Faturası tipi
export interface WholesaleInvoice {
  invoiceNumber: string;
  isReturn: boolean;
  isEInvoice: boolean;
  invoiceTypeCode: string;
  invoiceTypeDescription: string;
  invoiceDate: string;
  invoiceTime: string;
  operationDate: string;
  series: string;
  seriesNumber: string;
  description: string;
  currAccCode: string;
  currAccName: string;
  taxTypeCode: string;
  companyCode: string;
  officeCode: string;
  warehouseCode: string;
  exchangeRate: number;
  totalDiscount: number;
  totalVat: number;
  totalAmount: number;
  netAmount: number;
  isCompleted: boolean;
  isSuspended: boolean;
  isPostingJournal: boolean;
  journalNumber: string;
  isPrinted: boolean;
  applicationCode: string;
  applicationDescription: string;
  applicationID: string;
  invoiceHeaderID: string;
  formType: number;
  documentTypeCode: string;
  customerCode?: string; // Müşteri kodu
  vendorCode?: string; // Tedarikçi kodu
  docCurrencyCode?: string; // Belge para birimi kodu
}

// Toptan Alış Faturası tipi
export interface WholesalePurchaseInvoice extends WholesaleInvoice {}

// Masraf Faturası tipi
export interface ExpenseInvoice extends WholesaleInvoice {}

// Fatura listesi parametreleri
export interface WholesaleInvoiceListParams extends InvoiceListParams {}

// Toptan Alış Faturası listesi parametreleri
export interface WholesalePurchaseInvoiceListParams extends InvoiceListParams {}

// Masraf Faturası listesi parametreleri
export interface ExpenseInvoiceListParams extends InvoiceListParams {}

// Toptan Satış Faturası oluşturma isteği
export interface CreateWholesaleInvoiceRequest {
  // Zorunlu alanlar
  invoiceNumber: string; // Fatura numarası
  invoiceTypeCode: string; // Fatura tipi kodu (WS)
  invoiceDate: string; // Fatura tarihi (YYYY-MM-DD)
  currAccTypeCode: number; // Cari hesap tipi kodu (3: Müşteri)
  docCurrencyCode: string; // Belge para birimi kodu (TRY)
  companyCode: string; // Şirket kodu (1)
  warehouseCode: string; // Depo kodu
  customerCode: string; // Müşteri kodu
  currAccCode: string; // Cari hesap kodu
  vendorCode?: string; // Tedarikçi kodu (currAccTypeCode = 1 ise)
  invoiceHeaderID?: string; // Fatura başlık ID (güncelleme işlemleri için)
  
  // Opsiyonel alanlar
  isReturn?: boolean; // İade mi? (default: false)
  invoiceReturnTypeCode?: string; // İade tipi kodu (0: İade değil, 1: Gider Pusulası, 2: Şirket Fatura İadesi)
  isEInvoice?: boolean; // E-Fatura mı? (default: false)
  invoiceTime?: string; // Fatura saati (HH:MM:SS)
  officeCode?: string; // Ofis kodu
  processCode?: string; // İşlem kodu (WS)
  transTypeCode?: string; // İşlem tipi kodu (1: Giriş, 2: Çıkış, 3: Transfer)
  notes?: string; // Notlar
  details: any[]; // Fatura detayları
}

// Genel fatura oluşturma isteği
export interface CreateInvoiceRequest {
  // Zorunlu alanlar
  invoiceNumber: string; // Fatura numarası
  invoiceTypeCode: string; // Fatura tipi kodu (WS, WP, MAF, MAI)
  invoiceDate: string; // Fatura tarihi (YYYY-MM-DD)
  currAccTypeCode: number; // Cari hesap tipi kodu (1: Tedarikçi, 3: Müşteri)
  docCurrencyCode: string; // Belge para birimi kodu (TRY)
  companyCode: string; // Şirket kodu (1)
  warehouseCode: string; // Depo kodu
  currAccCode: string; // Cari hesap kodu
  invoiceHeaderID?: string; // Fatura başlık ID (güncelleme işlemleri için)
  
  // Opsiyonel alanlar
  customerCode?: string; // Müşteri kodu (currAccTypeCode = 3 ise)
  vendorCode?: string; // Tedarikçi kodu (currAccTypeCode = 1 ise)
  isReturn?: boolean; // İade mi? (default: false)
  invoiceReturnTypeCode?: string; // İade tipi kodu (0: İade değil, 1: Gider Pusulası, 2: Şirket Fatura İadesi)
  isEInvoice?: boolean; // E-Fatura mı? (default: false)
  invoiceTime?: string; // Fatura saati (HH:MM:SS)
  officeCode?: string; // Ofis kodu
  processCode?: string; // İşlem kodu (WS, BP, EP)
  transTypeCode?: string; // İşlem tipi kodu (1: Giriş, 2: Çıkış, 3: Transfer)
  description?: string; // Açıklama
  paymentTerm?: number; // Ödeme vadesi (gün)
  series?: string; // Seri
  seriesNumber?: string; // Seri numarası
  eInvoiceNumber?: string; // E-Fatura numarası
  eInvoiceStatusCode?: string; // E-Fatura durumu
  operationDate?: string; // İşlem tarihi
  taxTypeCode?: string; // Vergi tipi kodu
  isCompleted?: boolean; // Tamamlandı mı?
  isSuspended?: boolean; // Askıya alındı mı?
  applicationCode?: string; // Uygulama kodu
  applicationID?: number; // Uygulama ID
  formType?: string; // Form tipi
  documentTypeCode?: string; // Belge tipi kodu
  notes?: string; // Notlar
  exchangeRate?: number; // Döviz kuru
  details: any[]; // Fatura detayları
}

export interface CreateInvoiceDetailRequest {
  itemCode: string; // Ürün kodu
  unitOfMeasureCode: string; // Ölçü birimi kodu
  quantity: number; // Miktar
  unitPrice: number; // Birim fiyat
  vatRate?: number; // KDV oranı
  lineDescription?: string; // Satır açıklaması
  colorCode?: string; // Renk kodu
  batchCode?: string; // Parti kodu
  discountRate?: number; // İndirim oranı
  discountAmount?: number; // İndirim tutarı
  description?: string; // Açıklama
}

// Fatura API'si
const invoiceApi = {
  // Toptan Satış Faturası listesi
  getWholesaleInvoices: async (params: InvoiceListParams): Promise<any> => {
    try {
      const response = await api.get('/api/v1/Invoice/wholesale', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error in getWholesaleInvoices:', error);
      return {
        success: false,
        message: `Fatura listesi alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: {
          items: [],
          totalCount: 0,
          pageCount: 0,
          currentPage: 1,
          pageSize: 10
        }
      };
    }
  },
  
  // Toptan Alış Faturası listesi
  getWholesalePurchaseInvoices: async (params: InvoiceListParams): Promise<any> => {
    try {
      const response = await api.get('/api/v1/Invoice/wholesale-purchase', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error in getWholesalePurchaseInvoices:', error);
      return {
        success: false,
        message: `Fatura listesi alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: {
          items: [],
          totalCount: 0,
          pageCount: 0,
          currentPage: 1,
          pageSize: 10
        }
      };
    }
  },
  
  // Masraf Faturası listesi
  getExpenseInvoices: async (params: InvoiceListParams): Promise<any> => {
    try {
      const response = await api.get('/api/v1/Invoice/expense', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error in getExpenseInvoices:', error);
      return {
        success: false,
        message: `Fatura listesi alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: {
          items: [],
          totalCount: 0,
          pageCount: 0,
          currentPage: 1,
          pageSize: 10
        }
      };
    }
  },
  
  // Fatura detayı
  getInvoiceDetail: async (invoiceHeaderID: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/Invoice/${invoiceHeaderID}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getInvoiceDetail:', error);
      return {
        success: false,
        message: `Fatura detayı alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
  
  // Toptan Satış Faturası oluştur
  createWholesaleInvoice: async (invoice: CreateInvoiceRequest): Promise<any> => {
    try {
      console.log('Creating wholesale invoice:', invoice);
      
      // Zorunlu alanları kontrol et ve varsayılan değerleri ata
      const invoiceData = {
        ...invoice,
        invoiceTypeCode: invoice.invoiceTypeCode || INVOICE_TYPES.PAPER, // 0 (Kağıt Fatura) varsayılan fatura tipi kodu
        currAccTypeCode: CURR_ACC_TYPES.CUSTOMER, // 3 (Müşteri) cari hesap tipi kodu
        processCode: invoice.processCode || PROCESS_CODES.WHOLESALE_SALES, // WS (Toptan Satış) işlem kodu
        transTypeCode: invoice.transTypeCode || TRANS_TYPE_CODES.OUTBOUND, // 2 (Çıkış) - Toptan Satış için
        docCurrencyCode: invoice.docCurrencyCode || 'TRY', // Varsayılan para birimi TRY
        companyCode: invoice.companyCode || '1', // Varsayılan şirket kodu 1
        isReturn: invoice.isReturn || false, // Varsayılan iade değil
        invoiceReturnTypeCode: invoice.invoiceReturnTypeCode || INVOICE_RETURN_TYPES.NO_RETURN, // 0 (İade değil)
        isEInvoice: invoice.isEInvoice || false, // Varsayılan e-fatura değil
        // Veritabanı eşleşmesi için gerekli dönüşümler
        details: invoice.details.map(detail => ({
          ...detail,
          qty: detail.quantity, // quantity -> qty
          unitCode: detail.unitOfMeasureCode, // unitOfMeasureCode -> unitCode
          productCode: detail.itemCode // itemCode -> productCode
        }))
      };
      
      console.log('Sending invoice data:', invoiceData);
      
      // Doğru endpoint'i kullan
      const response = await api.post('/api/v1/Invoice/wholesale', invoiceData);
      console.log('API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in createWholesaleInvoice:', error);
      return {
        success: false,
        message: `Toptan satış faturası oluşturulurken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
  
  // Toptan Alış Faturası oluştur
  createWholesalePurchaseInvoice: async (invoice: CreateInvoiceRequest): Promise<any> => {
    try {
      console.log('Creating wholesale purchase invoice:', invoice);
      
      // Zorunlu alanları kontrol et ve varsayılan değerleri ata
      const invoiceData = {
        ...invoice,
        invoiceTypeCode: invoice.invoiceTypeCode || INVOICE_TYPES.PAPER, // 0 (Kağıt Fatura) varsayılan fatura tipi kodu
        currAccTypeCode: CURR_ACC_TYPES.VENDOR, // 1 (Tedarikçi) cari hesap tipi kodu
        processCode: invoice.processCode || PROCESS_CODES.WHOLESALE_PURCHASE, // BP (Toptan Alış) işlem kodu
        transTypeCode: invoice.transTypeCode || TRANS_TYPE_CODES.INBOUND, // 1 (Giriş) - Toptan Alış için
        docCurrencyCode: invoice.docCurrencyCode || 'TRY', // Varsayılan para birimi TRY
        companyCode: invoice.companyCode || '1', // Varsayılan şirket kodu 1
        isReturn: invoice.isReturn || false, // Varsayılan iade değil
        invoiceReturnTypeCode: invoice.invoiceReturnTypeCode || INVOICE_RETURN_TYPES.NO_RETURN, // 0 (İade değil)
        isEInvoice: invoice.isEInvoice || false, // Varsayılan e-fatura değil
        // Veritabanı eşleşmesi için gerekli dönüşümler
        details: invoice.details.map(detail => ({
          ...detail,
          qty: detail.quantity, // quantity -> qty
          unitCode: detail.unitOfMeasureCode, // unitOfMeasureCode -> unitCode
          productCode: detail.itemCode // itemCode -> productCode
        }))
      };
      
      console.log('Sending invoice data:', invoiceData);
      
      // Doğru endpoint'i kullan
      const response = await api.post('/api/v1/Invoice/wholesale-purchase', invoiceData);
      console.log('API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in createWholesalePurchaseInvoice:', error);
      return {
        success: false,
        message: `Toptan alış faturası oluşturulurken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
  
  // Masraf Faturası oluştur
  createExpenseInvoice: async (invoice: CreateInvoiceRequest): Promise<any> => {
    try {
      console.log('Creating expense invoice:', invoice);
      
      // İşlem kodu kontrolü
      if (!invoice.processCode) {
        throw new Error('İşlem kodu (processCode) zorunludur');
      }
      
      // Zorunlu alanları kontrol et ve varsayılan değerleri ata
      const invoiceData = {
        ...invoice,
        invoiceTypeCode: invoice.invoiceTypeCode || INVOICE_TYPES.PAPER, // 0 (Kağıt Fatura) varsayılan fatura tipi kodu
        currAccTypeCode: CURR_ACC_TYPES.VENDOR, // 1 (Tedarikçi) cari hesap tipi kodu
        processCode: invoice.processCode || PROCESS_CODES.EXPENSE_PURCHASE, // EP (Masraf Alış) işlem kodu
        transTypeCode: invoice.transTypeCode || TRANS_TYPE_CODES.INBOUND, // 1 (Giriş) - Masraf Alış için
        docCurrencyCode: invoice.docCurrencyCode || 'TRY', // Varsayılan para birimi TRY
        companyCode: invoice.companyCode || '1', // Varsayılan şirket kodu 1
        isReturn: invoice.isReturn || false, // Varsayılan iade değil
        invoiceReturnTypeCode: invoice.invoiceReturnTypeCode || INVOICE_RETURN_TYPES.NO_RETURN, // 0 (İade değil)
        isEInvoice: invoice.isEInvoice || false, // Varsayılan e-fatura değil
        // Veritabanı eşleşmesi için gerekli dönüşümler
        details: invoice.details.map(detail => ({
          ...detail,
          qty: detail.quantity, // quantity -> qty
          unitCode: detail.unitOfMeasureCode, // unitOfMeasureCode -> unitCode
          productCode: detail.itemCode // itemCode -> productCode
        }))
      };
      
      console.log('Sending invoice data:', invoiceData);
      
      // Doğru endpoint'i kullan
      const response = await api.post('/api/v1/Invoice/expense', invoiceData);
      console.log('API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in createExpenseInvoice:', error);
      return {
        success: false,
        message: `Masraf faturası oluşturulurken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
  
  // Fatura PDF'ini getir
  getInvoicePdf: async (invoiceHeaderID: string): Promise<Blob> => {
    try {
      const response = await api.get(`/api/v1/Invoice/${invoiceHeaderID}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in getInvoicePdf:', error);
      throw new Error(`PDF indirme hatası: ${error.message || 'Bilinmeyen hata'}`);
    }
  },
  
  // E-Fatura gönder
  sendEInvoice: async (invoiceHeaderID: string): Promise<any> => {
    try {
      const response = await api.post(`/api/v1/Invoice/${invoiceHeaderID}/send-einvoice`);
      return response.data;
    } catch (error: any) {
      console.error('Error in sendEInvoice:', error);
      throw new Error(`E-Fatura gönderme hatası: ${error.message || 'Bilinmeyen hata'}`);
    }
  },
  
  // Fatura PDF'ini indir
  downloadInvoicePdf: async (invoiceHeaderID: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/Invoice/${invoiceHeaderID}/download-pdf`, {
        responseType: 'blob'
      });
      
      // PDF dosyasını indir
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fatura_${invoiceHeaderID}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error in downloadInvoicePdf:', error);
      throw new Error(`PDF indirme hatası: ${error.message || 'Bilinmeyen hata'}`);
    }
  },
  
  // Otomatik fatura numarası oluşturma fonksiyonu (artık backend tarafında yapılıyor)
  // Bu fonksiyon sadece geçiş süreci için korunuyor, yeni implementasyonda kullanılmıyor
  generateInvoiceNumber: async (processCode: string): Promise<string> => {
    try {
      // Backend'den fatura numarası al
      const response = await api.get(`/api/v1/Invoice/generate-number?processCode=${processCode}`);
      if (response.data && response.data.success) {
        return response.data.data || `${processCode}-TEMP`;
      }
      return `${processCode}-TEMP`; // Geçici numara dön
    } catch (error) {
      console.error('Fatura numarası alınırken hata oluştu:', error);
      return `${processCode}-TEMP`; // Hata durumunda geçici numara dön
    }
  },
  
  // Toptan Satış Faturası detayını getir
  getWholesaleInvoiceById: async (invoiceHeaderID: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/Invoice/wholesale/${invoiceHeaderID}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getWholesaleInvoiceById:', error);
      return {
        success: false,
        message: `Fatura detayı alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
  
  // Toptan Alış Faturası detayını getir
  getWholesalePurchaseInvoiceById: async (invoiceHeaderID: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/Invoice/wholesale-purchase/${invoiceHeaderID}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getWholesalePurchaseInvoiceById:', error);
      return {
        success: false,
        message: `Fatura detayı alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
  
  // Masraf Faturası detayını getir
  getExpenseInvoiceById: async (invoiceHeaderID: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/Invoice/expense/${invoiceHeaderID}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getExpenseInvoiceById:', error);
      return {
        success: false,
        message: `Fatura detayı alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
  
  // Fatura detaylarını getir
  getInvoiceDetails: async (invoiceHeaderID: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/Invoice/${invoiceHeaderID}/details`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getInvoiceDetails:', error);
      return {
        success: false,
        message: `Fatura detayları alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: []
      };
    }
  },
  
  // Fatura ödeme detaylarını getir
  getInvoicePaymentDetails: async (invoiceHeaderID: string): Promise<any> => {
    try {
      const response = await api.get(`/api/v1/Invoice/${invoiceHeaderID}/payments`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getInvoicePaymentDetails:', error);
      return {
        success: false,
        message: `Fatura ödeme detayları alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: []
      };
    }
  },
  
  // Tüm faturaları getir
  getAllInvoices: async (params: InvoiceListParams): Promise<any> => {
    try {
      // processCodeList parametresi varsa, onu özel olarak işle
      let apiParams = { ...params };
      
      // Eğer processCodeList varsa, bunu string'e çevir
      if (apiParams.processCodeList && Array.isArray(apiParams.processCodeList)) {
        const processCodeListStr = apiParams.processCodeList.join(',');
        // processCodeList array'ini kaldır ve yerine string olarak ekle
        delete apiParams.processCodeList;
        (apiParams as any).processCodeList = processCodeListStr;
      }
      
      console.log('API params sent to backend:', apiParams);
      
      const response = await api.get('/api/v1/Invoice/all', { params: apiParams });
      return response.data;
    } catch (error: any) {
      console.error('Error in getAllInvoices:', error);
      return {
        success: false,
        message: `Fatura listesi alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: {
          items: [],
          totalCount: 0,
          pageCount: 0,
          currentPage: 1,
          pageSize: 10
        }
      };
    }
  },
  
  // Satış faturalarını getir
  getSalesInvoices: async (params: InvoiceListParams): Promise<any> => {
    try {
      const response = await api.get('/api/v1/Invoice/sales', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error in getSalesInvoices:', error);
      return {
        success: false,
        message: `Satış faturaları alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: {
          items: [],
          totalCount: 0,
          pageCount: 0,
          currentPage: 1,
          pageSize: 10
        }
      };
    }
  },
  
  // Alış faturalarını getir
  getPurchaseInvoices: async (params: InvoiceListParams): Promise<any> => {
    try {
      const response = await api.get('/api/v1/Invoice/purchase', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error in getPurchaseInvoices:', error);
      return {
        success: false,
        message: `Alış faturaları alınırken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: {
          items: [],
          totalCount: 0,
          pageCount: 0,
          currentPage: 1,
          pageSize: 10
        }
      };
    }
  },
  
  // Toptan Satış Faturası güncelle
  updateWholesaleInvoice: async (invoice: CreateInvoiceRequest): Promise<any> => {
    try {
      console.log('Updating wholesale invoice:', invoice);
      
      // Zorunlu alanları kontrol et ve varsayılan değerleri ata
      const invoiceData = {
        ...invoice,
        invoiceTypeCode: invoice.invoiceTypeCode || INVOICE_TYPES.PAPER, // 0 (Kağıt Fatura)
        currAccTypeCode: CURR_ACC_TYPES.CUSTOMER,
        processCode: invoice.processCode || PROCESS_CODES.WHOLESALE_SALES,
        docCurrencyCode: invoice.docCurrencyCode || 'TRY',
        companyCode: invoice.companyCode || '1',
        isReturn: invoice.isReturn || false,
        isEInvoice: invoice.isEInvoice || false,
        details: invoice.details.map(detail => ({
          ...detail,
          qty: detail.quantity,
          unitCode: detail.unitOfMeasureCode,
          productCode: detail.itemCode
        }))
      };
      
      console.log('Sending invoice data:', invoiceData);
      
      const response = await api.put(`/api/v1/Invoice/wholesale/${invoice.invoiceHeaderID}`, invoiceData);
      console.log('API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in updateWholesaleInvoice:', error);
      return {
        success: false,
        message: `Toptan satış faturası güncellenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
  
  // Toptan Alış Faturası güncelle
  updateWholesalePurchaseInvoice: async (invoice: CreateInvoiceRequest): Promise<any> => {
    try {
      console.log('Updating wholesale purchase invoice:', invoice);
      
      // Zorunlu alanları kontrol et ve varsayılan değerleri ata
      const invoiceData = {
        ...invoice,
        invoiceTypeCode: invoice.invoiceTypeCode || INVOICE_TYPES.PAPER, // 0 (Kağıt Fatura)
        currAccTypeCode: CURR_ACC_TYPES.VENDOR,
        processCode: invoice.processCode || PROCESS_CODES.WHOLESALE_PURCHASE,
        docCurrencyCode: invoice.docCurrencyCode || 'TRY',
        companyCode: invoice.companyCode || '1',
        isReturn: invoice.isReturn || false,
        isEInvoice: invoice.isEInvoice || false,
        details: invoice.details.map(detail => ({
          ...detail,
          qty: detail.quantity,
          unitCode: detail.unitOfMeasureCode,
          productCode: detail.itemCode
        }))
      };
      
      console.log('Sending invoice data:', invoiceData);
      
      const response = await api.put(`/api/v1/Invoice/wholesale-purchase/${invoice.invoiceHeaderID}`, invoiceData);
      console.log('API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in updateWholesalePurchaseInvoice:', error);
      return {
        success: false,
        message: `Toptan alış faturası güncellenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
  
  // Masraf Faturası güncelle
  updateExpenseInvoice: async (invoice: CreateInvoiceRequest): Promise<any> => {
    try {
      console.log('Updating expense invoice:', invoice);
      
      // Zorunlu alanları kontrol et ve varsayılan değerleri ata
      const invoiceData = {
        ...invoice,
        invoiceTypeCode: invoice.invoiceTypeCode || INVOICE_TYPES.PAPER, // 0 (Kağıt Fatura)
        currAccTypeCode: CURR_ACC_TYPES.VENDOR,
        processCode: invoice.processCode || PROCESS_CODES.EXPENSE_PURCHASE, // EP (Masraf Alış)
        docCurrencyCode: invoice.docCurrencyCode || 'TRY',
        companyCode: invoice.companyCode || '1',
        isReturn: invoice.isReturn || false,
        isEInvoice: invoice.isEInvoice || false,
        details: invoice.details.map(detail => ({
          ...detail,
          qty: detail.quantity,
          unitCode: detail.unitOfMeasureCode,
          productCode: detail.itemCode
        }))
      };
      
      console.log('Sending invoice data:', invoiceData);
      
      const response = await api.put(`/api/v1/Invoice/expense/${invoice.invoiceHeaderID}`, invoiceData);
      console.log('API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in updateExpenseInvoice:', error);
      return {
        success: false,
        message: `Masraf faturası güncellenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        data: null
      };
    }
  },
};

export default invoiceApi;
