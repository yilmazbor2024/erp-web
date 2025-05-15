import api from './api';

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
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  currAccCode?: string;
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

export interface CreateInvoiceRequest {
  transTypeCode: string;
  processCode: string;
  invoiceDate: string;
  invoiceTypeCode: string;
  isEInvoice: boolean;
  paymentTerm?: number;
  description?: string;
  currAccCode: string;
  warehouseCode: string;
  docCurrencyCode: string;
  exchangeRate?: number;
  isReturn?: boolean;
  lines: {
    sortOrder: number;
    itemCode: string;
    qty1: number;
    price: number;
    vatRate: number;
    lineDescription?: string;
  }[];
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
  currAccTypeCode: number;
  vendorCode: string;
  vendorDescription: string;
  customerCode: string;
  customerDescription: string;
  retailCustomerCode: string;
  storeCurrAccCode: string;
  storeDescription: string;
  employeeCode: string;
  firstLastName: string;
  subCurrAccCode: string;
  subCurrAccCompanyName: string;
  isCreditSale: boolean;
  processCode: string;
  transTypeCode: string;
  docCurrencyCode: string;
  series: string;
  seriesNumber: string;
  eInvoiceNumber: string;
  companyCode: string;
  officeCode: string;
  storeCode: string;
  warehouseCode: string;
  importFileNumber: string;
  exportFileNumber: string;
  exportTypeCode: string;
  posTerminalID: string;
  taxTypeCode: string;
  isCompleted: boolean;
  isSuspended: boolean;
  isLocked: boolean;
  isOrderBase: boolean;
  isShipmentBase: boolean;
  isPostingJournal: boolean;
  journalNumber: string;
  isPrinted: boolean;
  applicationCode: string;
  applicationDescription: string;
  applicationID: string;
  invoiceHeaderID: string;
  expenseTypeCode: string;
  formType: number;
  documentTypeCode: string;
}

export interface WholesaleInvoiceListResponse {
  items: WholesaleInvoice[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export interface WholesaleInvoiceListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  currAccCode?: string;
  invoiceTypeCode?: string;
  isReturn?: boolean;
  isEInvoice?: boolean;
  isCompleted?: boolean;
}

// Toptan Alış Faturası tipi
export interface WholesalePurchaseInvoice {
  invoiceNumber: string;
  isReturn: boolean;
  isEInvoice: boolean;
  invoiceTypeCode: string;
  invoiceTypeDescription: string;
  invoiceDate: string;
  invoiceTime: string;
  currAccTypeCode: number;
  vendorCode: string;
  vendorDescription: string;
  customerCode: string;
  customerDescription: string;
  retailCustomerCode: string;
  storeCurrAccCode: string;
  storeDescription: string;
  employeeCode: string;
  firstLastName: string;
  subCurrAccCode: string;
  subCurrAccCompanyName: string;
  isCreditSale: boolean;
  processCode: string;
  transTypeCode: string;
  docCurrencyCode: string;
  series: string;
  seriesNumber: string;
  eInvoiceNumber: string;
  companyCode: string;
  officeCode: string;
  storeCode: string;
  warehouseCode: string;
  importFileNumber: string;
  exportFileNumber: string;
  exportTypeCode: string;
  posTerminalID: string;
  taxTypeCode: string;
  isCompleted: boolean;
  isSuspended: boolean;
  isLocked: boolean;
  isOrderBase: boolean;
  isShipmentBase: boolean;
  isPostingJournal: boolean;
  journalNumber: string;
  isPrinted: boolean;
  applicationCode: string;
  applicationDescription: string;
  applicationID: string;
  invoiceHeaderID: string;
  expenseTypeCode: string;
  formType: string;
  documentTypeCode: string;
}

// Toptan Alış Faturası liste yanıtı
export interface WholesalePurchaseInvoiceListResponse {
  items: WholesalePurchaseInvoice[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

// Toptan Alış Faturası liste parametreleri
export interface WholesalePurchaseInvoiceListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  vendorCode?: string;
  invoiceNumber?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

// Toptan Satış Faturası oluşturma isteği
export interface CreateWholesaleInvoiceRequest {
  invoiceNumber: string;
  isReturn: boolean;
  isEInvoice: boolean;
  invoiceTypeCode: string;
  invoiceDate: string;
  invoiceTime: string;
  currAccTypeCode: number;
  customerCode: string;
  vendorCode: string;
  docCurrencyCode: string;
  companyCode: string;
  warehouseCode: string;
  storeCode: string;
  officeCode: string;
  series: string;
  seriesNumber: string;
  eInvoiceNumber: string;
  processCode: string;
  transTypeCode: string;
  taxTypeCode: string;
  employeeCode: string;
  posTerminalID: string;
  exportTypeCode: string;
  subCurrAccCode: string;
  applicationCode: string;
  expenseTypeCode: string;
  documentTypeCode: string;
  exportFileNumber: string;
  importFileNumber: string;
  storeCurrAccCode: string;
  retailCustomerCode: string;
  formType: string;
  isCompleted: boolean;
  isSuspended: boolean;
  notes: string;
  details: CreateInvoiceDetailRequest[];
}

// Fatura detay satırı oluşturma isteği
export interface CreateInvoiceDetailRequest {
  lineNumber: number;
  itemCode: string;
  itemTypeCode: string;
  unitOfMeasureCode: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  vatRate: number;
  warehouseCode: string;
  locationCode: string;
  serialNumber: string;
  batchCode: string;
  currencyCode: string;
  salesPersonCode: string;
  productTypeCode: string;
  promotionCode: string;
  notes: string;
}

// Fatura arama parametreleri
export interface InvoiceSearchParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  startDate?: string;
  endDate?: string;
  customerCode?: string;
  invoiceNumber?: string;
  isCompleted?: boolean;
  companyCode?: string;
  warehouseCode?: string;
  searchTerm?: string;
  currAccCode?: string;
}

// Fatura başlık modeli
export interface InvoiceHeaderModel {
  invoiceHeaderID: number;
  invoiceNumber: string;
  isReturn: boolean;
  isEInvoice: boolean;
  invoiceTypeCode: number;
  invoiceTypeDescription: string;
  invoiceDate: string;
  invoiceTime: string;
  currAccTypeCode: number;
  customerCode: string;
  customerDescription: string;
  vendorCode: string;
  vendorDescription: string;
  docCurrencyCode: string;
  companyCode: string;
  warehouseCode: string;
  storeCode: string;
  officeCode: string;
  isCompleted: boolean;
  isSuspended: boolean;
  notes?: string;
}

// Toptan Satış Faturası listesi yanıtı
export interface WholesaleInvoiceListResponse {
  success: boolean;
  message: string;
  data?: {
    items: InvoiceHeaderModel[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
  status?: string;
}

// API fonksiyonları
const invoiceApi = {
  // Tüm faturaları listele
  getInvoices: async (params?: InvoiceListParams): Promise<InvoiceListResponse> => {
    try {
      console.log('Fetching invoices with params:', params);
      const response = await api.get('/api/Invoices', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  // Alış faturalarını listele
  getPurchaseInvoices: async (params?: InvoiceListParams): Promise<InvoiceListResponse> => {
    try {
      console.log('Fetching purchase invoices with params:', params);
      const response = await api.get('/api/Invoices/purchase', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase invoices:', error);
      throw error;
    }
  },

  // Satış faturalarını listele
  getSalesInvoices: async (params?: InvoiceListParams): Promise<InvoiceListResponse> => {
    try {
      console.log('Fetching sales invoices with params:', params);
      const response = await api.get('/api/Invoices/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales invoices:', error);
      throw error;
    }
  },

  // Fatura detayını getir
  getInvoiceDetail: async (invoiceHeaderID: string): Promise<InvoiceDetail> => {
    try {
      console.log(`Fetching invoice detail for ID: ${invoiceHeaderID}`);
      const response = await api.get(`/api/Invoices/${invoiceHeaderID}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice detail for ID ${invoiceHeaderID}:`, error);
      throw error;
    }
  },

  // Fatura satırlarını getir
  getInvoiceLines: async (invoiceHeaderID: string): Promise<InvoiceLine[]> => {
    try {
      console.log(`Fetching invoice lines for ID: ${invoiceHeaderID}`);
      const response = await api.get(`/api/Invoices/${invoiceHeaderID}/lines`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice lines for ID ${invoiceHeaderID}:`, error);
      throw error;
    }
  },

  // Yeni fatura oluştur
  createInvoice: async (invoice: CreateInvoiceRequest): Promise<InvoiceHeader> => {
    try {
      console.log('Creating new invoice:', invoice);
      const response = await api.post('/api/Invoices', invoice);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Fatura güncelle
  updateInvoice: async (invoiceHeaderID: string, invoice: Partial<CreateInvoiceRequest>): Promise<InvoiceHeader> => {
    try {
      console.log(`Updating invoice ID ${invoiceHeaderID}:`, invoice);
      const response = await api.put(`/api/Invoices/${invoiceHeaderID}`, invoice);
      return response.data;
    } catch (error) {
      console.error(`Error updating invoice ID ${invoiceHeaderID}:`, error);
      throw error;
    }
  },

  // Fatura sil
  deleteInvoice: async (invoiceHeaderID: string): Promise<void> => {
    try {
      console.log(`Deleting invoice ID: ${invoiceHeaderID}`);
      await api.delete(`/api/Invoices/${invoiceHeaderID}`);
    } catch (error) {
      console.error(`Error deleting invoice ID ${invoiceHeaderID}:`, error);
      throw error;
    }
  },

  // Fatura onayla
  approveInvoice: async (invoiceHeaderID: string): Promise<InvoiceHeader> => {
    try {
      console.log(`Approving invoice ID: ${invoiceHeaderID}`);
      const response = await api.post(`/api/Invoices/${invoiceHeaderID}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Error approving invoice ID ${invoiceHeaderID}:`, error);
      throw error;
    }
  },

  // E-Fatura gönder
  sendEInvoice: async (invoiceHeaderID: string): Promise<any> => {
    try {
      console.log(`Sending e-invoice for ID: ${invoiceHeaderID}`);
      const response = await api.post(`/api/Invoices/${invoiceHeaderID}/send-e-invoice`);
      return response.data;
    } catch (error) {
      console.error(`Error sending e-invoice for ID ${invoiceHeaderID}:`, error);
      throw error;
    }
  },

  // Fatura özeti getir
  getInvoiceSummary: async (params: { startDate: string; endDate: string; groupBy?: string }): Promise<any> => {
    try {
      console.log('Fetching invoice summary with params:', params);
      const response = await api.get('/api/Invoices/summary', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice summary:', error);
      throw error;
    }
  },

  // Fatura PDF'ini getir
  getInvoicePdf: async (invoiceHeaderID: string): Promise<Blob> => {
    try {
      console.log(`Fetching PDF for invoice ID: ${invoiceHeaderID}`);
      const response = await api.get(`/api/Invoices/${invoiceHeaderID}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching PDF for invoice ID ${invoiceHeaderID}:`, error);
      throw error;
    }
  },

  // Fatura PDF'ini indir
  downloadInvoicePdf: async (invoiceId: string): Promise<void> => {
    try {
      const response = await api.get(`/api/Invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      throw error;
    }
  },

  // Toptan Satış Faturalarını listele
  getWholesaleInvoices: async (params: InvoiceSearchParams): Promise<any> => {
    try {
      console.log('Fetching wholesale invoices with params:', params);
      
      // API'nin beklediği formatta parametreleri oluştur
      const requestParams = {
        Page: params.page || 1,
        PageSize: params.pageSize || 10,
        SortBy: params.sortBy ? params.sortBy.charAt(0).toUpperCase() + params.sortBy.slice(1) : 'InvoiceDate',
        SortDirection: params.sortDirection ? params.sortDirection.toUpperCase() : 'DESC',
        // InvoiceTypeCode parametresini kaldır, API zaten kendi içinde filtreliyor
        // InvoiceTypeCode: "TS", // TS (Toptan Satış) fatura tipi kodu
        StartDate: params.startDate,
        EndDate: params.endDate,
        CustomerCode: params.customerCode,
        InvoiceNumber: params.invoiceNumber,
        IsCompleted: params.isCompleted,
        CompanyCode: params.companyCode,
        WarehouseCode: params.warehouseCode,
        LangCode: "TR"
      };
      
      console.log('Sending request with required params:', requestParams);
      
      // Doğru endpoint'i kullan
      try {
        const response = await api.get('/api/v1/Invoice/wholesale', { params: requestParams });
        return response.data;
      } catch (error) {
        console.error('Error fetching wholesale invoices:', error);
        
        // Alternatif endpoint'i dene
        try {
          const altResponse = await api.get('/api/Invoices/wholesale', { params: requestParams });
          return altResponse.data;
        } catch (altError) {
          console.error('Error fetching wholesale invoices from alternative endpoint:', altError);
          throw altError;
        }
      }
    } catch (error) {
      console.error('Error in getWholesaleInvoices:', error);
      throw error;
    }
  },

  // Toptan Alış Faturalarını listele
  getWholesalePurchaseInvoices: async (params?: WholesalePurchaseInvoiceListParams): Promise<WholesalePurchaseInvoiceListResponse> => {
    try {
      console.log('Fetching wholesale purchase invoices with params:', params);
      
      // Zorunlu parametreleri ekle
      const requiredParams = {
        Page: params?.page || 1,
        PageSize: params?.pageSize || 50, // Daha fazla kayıt göster
        SortBy: 'InvoiceDate', // Büyük harfle başlayan alan adı
        SortDirection: 'DESC', // Büyük harfle yazılan yön
        // InvoiceTypeCode parametresini kaldırıyoruz, böylece tüm fatura tipleri listelenecek
        CompanyCode: '001', // Varsayılan şirket kodu
        StoreCode: '001', // Varsayılan mağaza kodu
        WarehouseCode: '001', // Varsayılan depo kodu
        ExpenseTypeCode: '0', // Varsayılan masraf tipi kodu
        VendorCode: '', // Boş tedarikçi kodu
        CustomerCode: '', // Boş müşteri kodu
        InvoiceNumber: '', // Boş fatura numarası
      };
      
      console.log('Sending request with required params:', requiredParams);
      
      // Doğrudan genel endpoint'i kullan
      try {
        const response = await api.get('/api/Invoices', { params: requiredParams });
        console.log('API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching wholesale purchase invoices:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in getWholesalePurchaseInvoices:', error);
      throw error;
    }
  },

  // Toptan Satış Faturası oluştur
  createWholesaleInvoice: async (invoice: CreateWholesaleInvoiceRequest): Promise<any> => {
    try {
      console.log('Creating wholesale invoice:', invoice);
      
      // Fatura tipini TS (Toptan Satış) olarak ayarla
      const invoiceData = {
        ...invoice,
        invoiceTypeCode: 'TS' // TS (Toptan Satış) fatura tipi kodu
      };
      
      console.log('Sending invoice data:', invoiceData);
      
      // Doğru endpoint'i kullan
      try {
        const response = await api.post('/api/v1/Invoice', invoiceData);
        console.log('API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error creating wholesale invoice:', error);
        // Alternatif endpoint'i dene
        try {
          const altResponse = await api.post('/api/Invoices', invoiceData);
          console.log('API alternative response:', altResponse.data);
          return altResponse.data;
        } catch (altError) {
          console.error('Error creating wholesale invoice from alternative endpoint:', altError);
          throw altError;
        }
      }
    } catch (error) {
      console.error('Error in createWholesaleInvoice:', error);
      throw error;
    }
  },
};

export default invoiceApi;
