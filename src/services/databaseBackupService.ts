import axios from 'axios';
import { getAuthHeader } from '../utils/authUtils';

// API yanıt tipi
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Yedek tipi
export interface DatabaseBackup {
  id: string;
  databaseId: string;
  backupType: string;
  backupFileName: string;
  backupPath: string;
  fileSizeInMB: number;
  createdAt: string;
  createdBy: string;
}

// Yedekleme sonucu tipi
export interface BackupResult {
  success: boolean;
  message: string;
  backupFileName: string;
  backupPath: string;
  backupType: string;
  createdAt: string;
}

// Tablo tipi
export interface DatabaseTable {
  tableName: string;
  schema: string;
  columnCount: number;
  rowCount: number;
  objectType?: 'TABLE' | 'VIEW'; // Nesne tipi: Tablo veya View
}

// Sorgu sonucu tipi
export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTime: number;
}

// Yedekleme isteği tipi
export interface BackupRequest {
  databaseId: string;
}

// Geri yükleme isteği tipi
export interface RestoreRequest {
  databaseId: string;
  backupId: string;
}

// Sorgu isteği tipi
export interface QueryRequest {
  databaseId: string;
  query: string;
}

/**
 * Veritabanı yedekleme ve SQL işlemleri için API servisi
 */
class DatabaseBackupService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  /**
   * Sistemdeki veritabanlarını listeler
   * @returns Veritabanı listesi
   */
  async listDatabases(): Promise<ApiResponse<any[]>> {
    try {
      const response = await axios.get<ApiResponse<any[]>>(
        `${this.apiUrl}/api/v1/DatabaseBackup/databases`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Veritabanları alınırken hata oluştu:', error);
      return {
        success: false,
        message: 'Veritabanları alınırken hata oluştu',
        data: []
      };
    }
  }

  /**
   * Bir veritabanı için yedekleri listeler
   * @param databaseId Veritabanı ID
   * @returns Yedek listesi
   */
  async getBackups(databaseId: string): Promise<ApiResponse<DatabaseBackup[]>> {
    try {
      const response = await axios.get<ApiResponse<DatabaseBackup[]>>(
        `${this.apiUrl}/api/v1/DatabaseBackup/${databaseId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Yedekler alınırken hata oluştu:', error);
      return {
        success: false,
        message: 'Yedekler alınırken hata oluştu',
        data: []
      };
    }
  }

  /**
   * Tam yedekleme işlemi yapar
   * @param databaseId Veritabanı ID
   * @returns Yedekleme sonucu
   */
  async createFullBackup(databaseId: string): Promise<ApiResponse<BackupResult>> {
    try {
      // databaseId'nin boş olup olmadığını kontrol et
      if (!databaseId || databaseId.trim() === '') {
        console.error('Geçersiz veritabanı ID: Boş değer');
        return {
          success: false,
          message: 'Geçersiz veritabanı ID',
          data: {} as BackupResult
        };
      }

      // GUID formatı kontrolü (basit bir kontrol)
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(databaseId)) {
        console.error('Geçersiz veritabanı ID formatı:', databaseId);
        return {
          success: false,
          message: 'Geçersiz veritabanı ID formatı',
          data: {} as BackupResult
        };
      }

      const response = await axios.post<ApiResponse<BackupResult>>(
        `${this.apiUrl}/api/v1/DatabaseBackup/full-backup`,
        { databaseId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Tam yedekleme sırasında hata oluştu:', error);
      return {
        success: false,
        message: 'Tam yedekleme sırasında hata oluştu',
        data: {} as BackupResult
      };
    }
  }

  /**
   * Diferansiyel yedekleme işlemi yapar
   * @param databaseId Veritabanı ID
   * @returns Yedekleme sonucu
   */
  async createDifferentialBackup(databaseId: string): Promise<ApiResponse<BackupResult>> {
    try {
      const response = await axios.post<ApiResponse<BackupResult>>(
        `${this.apiUrl}/api/v1/DatabaseBackup/differential-backup`,
        { databaseId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Diferansiyel yedekleme sırasında hata oluştu:', error);
      return {
        success: false,
        message: 'Diferansiyel yedekleme sırasında hata oluştu',
        data: {} as BackupResult
      };
    }
  }

  /**
   * Yedek geri yükleme işlemi yapar
   * @param databaseId Veritabanı ID
   * @param backupId Yedek ID
   * @returns Geri yükleme sonucu
   */
  async restoreBackup(databaseId: string, backupId: string): Promise<ApiResponse<BackupResult>> {
    try {
      const response = await axios.post<ApiResponse<BackupResult>>(
        `${this.apiUrl}/api/v1/DatabaseBackup/restore`,
        { databaseId, backupId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Geri yükleme sırasında hata oluştu:', error);
      return {
        success: false,
        message: 'Geri yükleme sırasında hata oluştu',
        data: {} as BackupResult
      };
    }
  }

  /**
   * Yedek indirme URL'sini oluşturur
   * @param backupId Yedek ID
   * @returns İndirme URL'si
   */
  getDownloadUrl(backupId: string): string {
    return `${this.apiUrl}/api/v1/DatabaseBackup/download/${backupId}`;
  }

  /**
   * Veritabanı tablolarını listeler
   * @param databaseId Veritabanı ID
   * @returns Tablo listesi
   */
  async getTables(databaseId: string): Promise<ApiResponse<DatabaseTable[]>> {
    try {
      console.log(`Tabloları getirme isteği: ${this.apiUrl}/api/v1/DatabaseBackup/tables/${databaseId}`);
      
      // Alternatif endpoint'i de deneyelim
      const endpoint = `${this.apiUrl}/api/v1/DatabaseBackup/tables/${databaseId}`;
      const alternativeEndpoint = `${this.apiUrl}/api/v1/SqlOperations/tables/${databaseId}`;
      
      let response;
      try {
        console.log('Ana endpoint deneniyor:', endpoint);
        response = await axios.get<ApiResponse<DatabaseTable[]>>(
          endpoint,
          { headers: getAuthHeader() }
        );
      } catch (primaryError) {
        console.log('Ana endpoint başarısız, alternatif endpoint deneniyor:', alternativeEndpoint);
        response = await axios.get<ApiResponse<DatabaseTable[]>>(
          alternativeEndpoint,
          { headers: getAuthHeader() }
        );
      }
      
      console.log('API yanıtı:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Tablolar alınırken hata oluştu:', error);
      console.error('Hata detayları:', error?.response?.data || error?.message || 'Bilinmeyen hata');
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Tablolar alınırken hata oluştu',
        data: []
      };
    }
  }

  /**
   * SQL sorgusu çalıştırır
   * @param databaseId Veritabanı ID
   * @param query SQL sorgusu
   * @returns Sorgu sonucu
   */
  async executeQuery(databaseId: string, query: string): Promise<ApiResponse<QueryResult>> {
    try {
      const response = await axios.post<ApiResponse<QueryResult>>(
        `${this.apiUrl}/api/v1/DatabaseBackup/query`,
        { databaseId, query },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Sorgu çalıştırılırken hata oluştu:', error);
      return {
        success: false,
        message: 'Sorgu çalıştırılırken hata oluştu',
        data: {
          columns: [],
          rows: [],
          rowCount: 0,
          executionTime: 0
        }
      };
    }
  }

  /**
   * Veritabanı tablolarını ve viewlerini listeler
   * @param databaseId Veritabanı ID
   * @returns Tablo ve view listesi
   */
  async getTablesAndViews(databaseId: string): Promise<ApiResponse<DatabaseTable[]>> {
    try {
      console.log(`Tablolar ve viewler getiriliyor, databaseId: ${databaseId}`);
      
      // Önce tabloları alalım
      const tablesResponse = await this.getTables(databaseId);
      let allObjects: DatabaseTable[] = [];
      
      if (tablesResponse.success && tablesResponse.data.length > 0) {
        // Tablolara objectType ekleyelim
        allObjects = tablesResponse.data.map(table => ({
          ...table,
          objectType: 'TABLE'
        }));
      }
      
      // Şimdi viewleri almak için özel bir sorgu çalıştıralım
      try {
        const viewQuery = `
          SELECT 
            TABLE_SCHEMA as schema, 
            TABLE_NAME as tableName,
            0 as columnCount,
            0 as rowCount
          FROM INFORMATION_SCHEMA.VIEWS
          WHERE TABLE_CATALOG = DB_NAME()
          ORDER BY TABLE_SCHEMA, TABLE_NAME
        `;
        
        const viewsResponse = await this.executeQuery(databaseId, viewQuery);
        
        if (viewsResponse.success && viewsResponse.data.rows.length > 0) {
          // Viewleri dönüştürelim ve listeye ekleyelim
          const views: DatabaseTable[] = viewsResponse.data.rows.map((row: any) => ({
            schema: row.schema,
            tableName: row.tableName,
            columnCount: row.columnCount || 0,
            rowCount: row.rowCount || 0,
            objectType: 'VIEW'
          }));
          
          allObjects = [...allObjects, ...views];
        }
      } catch (viewError) {
        console.error('Viewler alınırken hata oluştu:', viewError);
        // Viewler alınamazsa sadece tabloları döndürmeye devam edelim
      }
      
      return {
        success: true,
        message: 'Tablolar ve viewler başarıyla listelendi',
        data: allObjects
      };
    } catch (error: any) {
      console.error('Tablolar ve viewler alınırken hata oluştu:', error);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Tablolar ve viewler alınırken hata oluştu',
        data: []
      };
    }
  }
}

export default new DatabaseBackupService();
