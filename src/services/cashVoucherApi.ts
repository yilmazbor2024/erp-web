import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Kasa hesaplarını getiren fonksiyon
const getCashAccounts = async (officeCode?: string) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/payment/cash-accounts`, {
      params: officeCode ? { officeCode } : {},
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Kasa hesapları API yanıtı:', response.data);
    // API yanıtı { success: true, data: Array(3) } formatında geliyor
    if (response.data.success && Array.isArray(response.data.data)) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: 'Kasa hesapları formatı hatalı' };
    }
  } catch (error: any) {
    console.error('Kasa hesapları getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa hesapları getirilirken bir hata oluştu' 
    };
  }
};

// Kasa hesap detaylarını getiren fonksiyon
const getCashAccountDetails = async (cashAccountCode: string) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/cash-account/details`, {
      params: { cashAccountCode },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Kasa hesap detayları getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa hesap detayları getirilirken bir hata oluştu' 
    };
  }
};

// Kasa fişi oluşturan fonksiyon
const createCashVoucher = async (voucherData: any) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/api/v1/cash-voucher/create`, voucherData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Kasa fişi oluşturma hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa fişi oluşturulurken bir hata oluştu' 
    };
  }
};

// Müşteri hesap bakiyesini getiren fonksiyon
const getCustomerBalance = async (currAccCode: string) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/customer/balance`, {
      params: { currAccCode },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Müşteri bakiyesi getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Müşteri bakiyesi getirilirken bir hata oluştu' 
    };
  }
};

// Tedarikçi hesap bakiyesini getiren fonksiyon
const getVendorBalance = async (currAccCode: string) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/vendor/balance`, {
      params: { currAccCode },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Tedarikçi bakiyesi getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Tedarikçi bakiyesi getirilirken bir hata oluştu' 
    };
  }
};

// Kasa tahsilat fişlerini listeleyen fonksiyon
const getCashReceiptVouchers = async (params: any = {}) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/payment/cash-voucher/receipts`, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    // API yanıtını işle
    // API yanıtı { success: true, data: { items: [], total: 0 }, message: '' } şeklinde
    // Frontend'in beklediği { success: true, data: { items: [], total: 0 } } şeklinde
    return { success: true, data: response.data.data };
  } catch (error: any) {
    console.error('Kasa tahsilat fişleri getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa tahsilat fişleri getirilirken bir hata oluştu' 
    };
  }
};

// Kasa tediye fişlerini listeleyen fonksiyon
const getCashPaymentVouchers = async (params: any = {}) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/payment/cash-voucher/payments`, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    // API yanıtını işle
    // API yanıtı { success: true, data: { items: [], total: 0 }, message: '' } şeklinde
    // Frontend'in beklediği { success: true, data: { items: [], total: 0 } } şeklinde
    return { success: true, data: response.data.data };
  } catch (error: any) {
    console.error('Kasa tediye fişleri getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa tediye fişleri getirilirken bir hata oluştu' 
    };
  }
};

// Kasa virman fişlerini listeleyen fonksiyon
const getCashTransferVouchers = async (params: any = {}) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/payment/cash-voucher/transfers`, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    // API yanıtını işle
    // API yanıtı { success: true, data: { items: [], total: 0 }, message: '' } şeklinde
    // Frontend'in beklediği { success: true, data: { items: [], total: 0 } } şeklinde
    return { success: true, data: response.data.data };
  } catch (error: any) {
    console.error('Kasa virman fişleri getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa virman fişleri getirilirken bir hata oluştu' 
    };
  }
};

// Kasa bakiyelerini ve hareketlerini getiren fonksiyon
// params: startDate, endDate, cashTransTypeCode (optional), cashAccountCode (optional), currAccCode (optional), lineDescription (optional), page, pageSize
const getCashBalances = async (params: any = {}) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Varsayılan sayfalama parametreleri
    const defaultParams = {
      page: params.page || 1,
      pageSize: params.pageSize || 20
    };
    
    // Tüm parametreleri birleştir
    const queryParams = { ...defaultParams, ...params };
    
    // console.log('API çağrısı parametreleri:', queryParams);
    
    // Parametreleri API'ye gönder
    const response = await axios.get(`${API_BASE_URL}/api/v1/payment/cash-balance`, {
      params: queryParams,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    // console.log('Kasa bakiyeleri API yanıtı:', response.data);
    return { 
      success: true, 
      data: response.data.data,
      totalCount: response.data.totalCount,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages
    };
  } catch (error: any) {
    console.error('Kasa bakiyeleri getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa bakiyeleri getirilirken bir hata oluştu' 
    };
  }
};

// Kasa fişi detaylarını getiren fonksiyon
const getCashVoucherDetails = async (voucherNumber: string) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/cash-voucher/details`, {
      params: { voucherNumber },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Kasa fişi detayları getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa fişi detayları getirilirken bir hata oluştu' 
    };
  }
};

// Kasa hareketleri raporunu getiren fonksiyon
const getCashTransactionReport = async (params: any = {}) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Tarih formatını düzgün şekilde hazırla (YYYY-MM-DD)
    const formatDate = (date: Date | string): string => {
      if (typeof date === 'string') {
        // Eğer zaten string ise ve ISO formatında ise, sadece tarih kısmını al
        if (date.includes('T')) {
          return date.split('T')[0];
        }
        return date; // Zaten uygun formatta
      }
      // Date objesi ise ISO string'e çevir ve tarih kısmını al
      return date.toISOString().split('T')[0];
    };
    
    const today = new Date();
    
    // Zorunlu parametreleri kontrol et ve varsayılan değerler ata
    const defaultParams = {
      startDate: params.startDate ? formatDate(params.startDate) : formatDate(today),
      endDate: params.endDate ? formatDate(params.endDate) : formatDate(today),
      pageSize: params.pageSize || 10,
      pageNumber: params.pageNumber || 1,
      cashAccountCode: params.cashAccountCode || null  // null olarak gönder
    };
    
    console.log('Kasa hareketleri API çağrısı parametreleri:', defaultParams);
    
    // API endpoint'i henüz hazır olmayabilir, bu durumda boş sonuç döndür
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/payment/cash-transactions`, {
        params: defaultParams,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return { success: true, data: response.data };
    } catch (apiError: any) {
      // 400 veya 404 hatası durumunda boş sonuç döndür
      console.error(`Kasa hareketleri raporu getirme hatası: ${apiError.message || 'Bilinmeyen hata'}`);
      console.error('Hata detayları:', apiError.response?.data);
      
      // Boş sonuç döndür
      return { 
        success: true, 
        data: {
          items: [],
          totalCount: 0,
          pageSize: defaultParams.pageSize,
          pageNumber: defaultParams.pageNumber,
          totalPages: 0
        } 
      };
    }
  } catch (error: any) {
    console.error(`Kasa hareketleri raporu getirme hatası: ${error.message || 'Bilinmeyen hata'}`);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa hareketleri raporu getirilirken bir hata oluştu',
      data: {
        items: [],
        totalCount: 0,
        pageSize: params.pageSize || 10,
        pageNumber: params.pageNumber || 1,
        totalPages: 0
      }
    };
  }
};

// Kasa hareketi detayını getiren fonksiyon
const getCashTransactionDetail = async (transactionNumber: string) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/payment/cash-transaction/${transactionNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Kasa hareketi detayı getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa hareketi detayı getirilirken bir hata oluştu' 
    };
  }
};

// Kasa özet bilgilerini getiren fonksiyon
const getCashSummary = async (params: any = {}) => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Zorunlu parametreleri kontrol et ve varsayılan değerler ata
    const defaultParams = {
      startDate: params.startDate || new Date().toISOString().split('T')[0], // Bugünün tarihi
      endDate: params.endDate || new Date().toISOString().split('T')[0],     // Bugünün tarihi
      cashAccountCode: params.cashAccountCode || ''  // Boş bırakılabilir
    };
    
    console.log('Kasa özet API çağrısı parametreleri:', defaultParams);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/payment/cash-summary`, {
        params: defaultParams,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // API yanıtı { success: true, data: [...], message: "..." } formatında
      if (response.data.success && Array.isArray(response.data.data)) {
        return { success: true, data: response.data.data };
      } else {
        console.warn('Kasa özet API yanıtı formatı beklenen şekilde değil, varsayılan değerler kullanılıyor');
        return { success: true, data: getDefaultCashSummary() };
      }
    } catch (apiError: any) {
      // 400 veya 404 hatası durumunda varsayılan değerler döndür
      console.error(`Kasa özet bilgileri getirme hatası: ${apiError.message || 'Bilinmeyen hata'}`);
      return { success: true, data: getDefaultCashSummary() };
    }
  } catch (error: any) {
    console.error('Kasa özet bilgileri getirme hatası:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Kasa özet bilgileri getirilirken bir hata oluştu',
      message: error.response?.data?.message || error.message || 'Kasa özet bilgileri getirilirken bir hata oluştu',
      data: getDefaultCashSummary()
    };
  }
};

// Varsayılan kasa özet bilgilerini döndüren yardımcı fonksiyon
const getDefaultCashSummary = () => {
  return [
    {
      cashAccountCode: '100.01',
      cashAccountName: 'ANA KASA',
      currencyCode: 'TRY',
      openingBalance: 0,
      debitTotal: 0,
      creditTotal: 0,
      closingBalance: 0,
      doc_CurrencyCode: 'TRY',
      doc_OpeningBalance: 0,
      doc_DebitTotal: 0,
      doc_CreditTotal: 0,
      doc_ClosingBalance: 0
    }
  ];
};

const cashVoucherApi = {
  getCashAccounts,
  getCashAccountDetails,
  createCashVoucher,
  getCustomerBalance,
  getVendorBalance,
  getCashReceiptVouchers,
  getCashPaymentVouchers,
  getCashTransferVouchers,
  getCashVoucherDetails,
  getCashTransactionReport,
  getCashTransactionDetail,
  getCashBalances,
  getCashSummary
};

export default cashVoucherApi;
