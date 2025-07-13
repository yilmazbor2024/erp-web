import axiosInstance from '../config/axios';
import { getUser } from '../utils/auth';
import { detectBrowser, detectOS, detectDevice, getIPAddress, getLocation, GeolocationResult } from '../utils/deviceDetection';

export interface PageViewLog {
  pageUrl: string;
  module: string;
  username?: string;
  visitTime?: string;
  exitTime?: string;
  duration?: number;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  ipAddress?: string;
  location?: string;
}

export interface FormActionLog {
  formName: string;
  action: string;
  details?: string;
  username?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  ipAddress?: string;
  location?: string;
}

export interface ApiCallLog {
  endpoint: string;
  method: string;
  status?: number;
  responseTime?: number;
  details?: string;
  username?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  ipAddress?: string;
  location?: string;
}

export interface AuditLogFilter {
  module?: string;
  action?: string;
  username?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}

export interface AuditLog {
  id: number;
  userId: string;
  username: string;
  action: string;
  module: string;
  pageUrl?: string;
  formName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string; // Backend'de CreatedAt olarak geçiyor ama frontend'de timestamp olarak kullanmaya devam ediyoruz
}

export interface AuditLogResponse {
  logs: AuditLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const auditLogService = {
  logPageView: async (log: PageViewLog): Promise<{ logId: number } | undefined> => {
    try {
      const user = getUser();
      
      // Kullanıcı adını ekle
      if (user && !log.username) {
        log.username = user.userName || user.email;
      }
      
      // Ziyaret zamanını ekle
      if (!log.visitTime) {
        log.visitTime = new Date().toISOString();
      }
      
      // Tarayıcı, işletim sistemi ve cihaz bilgilerini ekle
      if (!log.userAgent) log.userAgent = navigator.userAgent;
      if (!log.browser) log.browser = detectBrowser();
      if (!log.os) log.os = detectOS();
      if (!log.device) log.device = detectDevice();
      
      // IP adresini al
      if (!log.ipAddress) {
        try {
          log.ipAddress = await getIPAddress();
        } catch (error) {
          console.error('IP adresi alınamadı:', error);
        }
      }
      
      // Konum bilgisini al
      if (!log.location) {
        try {
          const locationResult: GeolocationResult = await getLocation(false);
          if (locationResult.success && locationResult.location) {
            log.location = locationResult.location;
          } else {
            log.location = locationResult.message || 'Konum bilgisi alınamadı';
          }
        } catch (error) {
          console.error('Konum bilgisi alınamadı:', error);
          log.location = 'Konum bilgisi alınamadı';
        }
      }
      
      const response = await axiosInstance.post('/api/v1/auditlog/log-page-view', log);
      return response.data;
    } catch (error) {
      console.error('Sayfa görüntüleme loglanamadı:', error);
      return undefined;
    }
  },

  logFormAction: async (log: FormActionLog): Promise<{ logId: number } | undefined> => {
    try {
      const user = getUser();
      
      // Kullanıcı adını ekle
      if (user && !log.username) {
        log.username = user.userName || user.email;
      }
      
      // Tarayıcı, işletim sistemi ve cihaz bilgilerini ekle
      if (!log.userAgent) log.userAgent = navigator.userAgent;
      if (!log.browser) log.browser = detectBrowser();
      if (!log.os) log.os = detectOS();
      if (!log.device) log.device = detectDevice();
      
      // IP adresini al
      if (!log.ipAddress) {
        try {
          log.ipAddress = await getIPAddress();
        } catch (error) {
          console.error('IP adresi alınamadı:', error);
        }
      }
      
      // Konum bilgisini al
      if (!log.location) {
        try {
          const locationResult: GeolocationResult = await getLocation(false);
          if (locationResult.success && locationResult.location) {
            log.location = locationResult.location;
          } else {
            log.location = locationResult.message || 'Konum bilgisi alınamadı';
          }
        } catch (error) {
          console.error('Konum bilgisi alınamadı:', error);
          log.location = 'Konum bilgisi alınamadı';
        }
      }
      
      const response = await axiosInstance.post('/api/v1/auditlog/log-form-action', log);
      return response.data;
    } catch (error) {
      console.error('Form eylem loglanamadı:', error);
      return undefined;
    }
  },

  getUserLogs: async (userId: string, startDate?: string, endDate?: string): Promise<AuditLog[]> => {
    try {
      console.log(`Kullanıcı (${userId}) işlem logları alınıyor...`);
      
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn(`Token bulunamadı, kullanıcı (${userId}) işlem logları alınamıyor`);
        return [];
      }
      
      const params: any = { userId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      console.log('Kullanıcı logları için parametreler:', params);
      
      const response = await axiosInstance.get('/api/v1/auditlog/user-logs', { 
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Kullanıcı logları yanıtı:', response.data);
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.logs)) {
        return response.data.logs;
      }
      
      return [];
    } catch (error) {
      console.error(`Kullanıcı (${userId}) işlem logları alınırken hata:`, error);
      return [];
    }
  },

  getAllLogs: async (filter: AuditLogFilter): Promise<{ logs: AuditLog[], totalCount: number }> => {
    try {
      console.log('Audit logları alınıyor, filtre:', filter);
      
      // Token kontrolü
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        console.warn('Token bulunamadı, audit logları alınamıyor');
        return { logs: [], totalCount: 0 };
      }
      
      // API isteği
      const response = await axiosInstance.get('/api/v1/auditlog/all-logs', { 
        params: filter,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Audit logları yanıtı:', response.data);
      
      // Yanıt formatını kontrol et
      if (response.data) {
        // API yanıtı farklı formatlarda olabilir, her ikisini de kontrol et
        const logs = response.data.Logs || response.data.logs || [];
        const totalCount = response.data.TotalCount || response.data.totalCount || 0;
        
        console.log(`${logs.length} adet log alındı, toplam: ${totalCount}`);
        
        return { 
          logs: logs, 
          totalCount: totalCount 
        };
      }
      
      return { logs: [], totalCount: 0 };
    } catch (error) {
      console.error('Audit logları alınırken hata oluştu:', error);
      return { logs: [], totalCount: 0 };
    }
  },

  /**
   * API çağrılarını loglar, büyük payload'ları akıllıca kırpar
   * @param log API çağrı log bilgileri
   * @returns Log ID veya undefined
   */
  logApiCall: async (log: ApiCallLog): Promise<{ logId: number } | undefined> => {
    try {
      // Detayları sınırlandır - çok büyük istekleri önle
      if (log.details) {
        // Detay boyutunu kontrol et
        const detailsSize = new Blob([log.details]).size;
        
        // 1MB'dan büyükse kırp
        if (detailsSize > 1024 * 1024) {
          console.warn(`Büyük API log payload tespit edildi: ${(detailsSize / (1024 * 1024)).toFixed(2)}MB. Kırpılıyor...`);
          
          try {
            // JSON ise akıllıca kırp
            const detailsObj = JSON.parse(log.details);
            
            // Büyük alanları kırp
            const truncateField = (obj: any, field: string, maxLength: number = 1000) => {
              if (obj[field] && typeof obj[field] === 'string' && obj[field].length > maxLength) {
                obj[field] = obj[field].substring(0, maxLength) + '... [TRUNCATED]';
              } else if (obj[field] && typeof obj[field] === 'object') {
                obj[field] = '[TRUNCATED OBJECT]';
              }
            };
            
            // Request/response data alanlarını kırp
            if (detailsObj.data) truncateField(detailsObj, 'data', 500);
            if (detailsObj.response) truncateField(detailsObj, 'response', 500);
            if (detailsObj.result) truncateField(detailsObj, 'result', 500);
            if (detailsObj.items) truncateField(detailsObj, 'items', 500);
            if (detailsObj.records) truncateField(detailsObj, 'records', 500);
            
            // Headers ve params için daha az kırp
            if (detailsObj.headers) truncateField(detailsObj, 'headers', 200);
            if (detailsObj.params) truncateField(detailsObj, 'params', 200);
            
            // Kırpılmış JSON'u kullan
            log.details = JSON.stringify(detailsObj);
          } catch (e) {
            // JSON değilse basitçe kırp
            log.details = log.details.substring(0, 1000) + '... [TRUNCATED]';
          }
          
          // Son kontrol - hala çok büyükse daha agresif kırp
          const finalSize = new Blob([log.details]).size;
          if (finalSize > 500 * 1024) { // 500KB'dan büyükse
            log.details = log.details.substring(0, 500) + '... [SEVERELY TRUNCATED DUE TO SIZE]';
          }
        }
      }
      
      const response = await axiosInstance.post('/api/v1/auditlog/log-api-call', log);
      return response.data;
    } catch (error) {
      console.error('API çağrısı loglanamadı:', error);
      return undefined;
    }
  }
};

export default auditLogService;
