import axios from 'axios';
import { getAuthHeader } from '../utils/authUtils';

/**
 * Push Notification için API yanıt tipi
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Push Notification servisi
 */
class NotificationService {
  private apiUrl: string;
  private pushManager: any;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.pushManager = null;
  }

  /**
   * Push Notification Manager'ı başlatır
   */
  async initializePushManager(): Promise<boolean> {
    try {
      // Service Worker ve Push API desteğini kontrol et
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push bildirimleri bu tarayıcıda desteklenmiyor.');
        return false;
      }

      // Push Manager'ı global değişkenden al
      if (window.pushNotificationManager) {
        this.pushManager = window.pushNotificationManager;
        await this.pushManager.initialize();
        return true;
      } else {
        console.warn('Push Notification Manager bulunamadı.');
        return false;
      }
    } catch (error) {
      console.error('Push Notification Manager başlatılamadı:', error);
      return false;
    }
  }

  /**
   * Bildirim izni ister ve push notification'a abone olur
   */
  async subscribeToPushNotifications(): Promise<boolean> {
    try {
      if (!this.pushManager) {
        await this.initializePushManager();
        if (!this.pushManager) {
          return false;
        }
      }

      // Bildirim izni iste
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Bildirim izni reddedildi.');
          return false;
        }
      }

      // Push notification'a abone ol
      const result = await this.pushManager.subscribe();
      return result;
    } catch (error) {
      console.error('Push notification aboneliği sırasında hata oluştu:', error);
      return false;
    }
  }

  /**
   * Push notification aboneliğini iptal eder
   */
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      if (!this.pushManager) {
        await this.initializePushManager();
        if (!this.pushManager) {
          return false;
        }
      }

      const result = await this.pushManager.unsubscribe();
      return result;
    } catch (error) {
      console.error('Push notification aboneliği iptal edilirken hata oluştu:', error);
      return false;
    }
  }

  /**
   * Mevcut abonelik durumunu kontrol eder
   */
  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      if (!this.pushManager) {
        await this.initializePushManager();
        if (!this.pushManager) {
          return false;
        }
      }

      return await this.pushManager.checkSubscription();
    } catch (error) {
      console.error('Abonelik durumu kontrol edilirken hata oluştu:', error);
      return false;
    }
  }

  /**
   * Test bildirimi gönderir (sadece admin kullanıcıları için)
   */
  async sendTestNotification(): Promise<ApiResponse<boolean>> {
    try {
      const response = await axios.post<ApiResponse<boolean>>(
        `${this.apiUrl}/api/v1/notification/send-test`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Test bildirimi gönderilirken hata oluştu:', error);
      return {
        success: false,
        message: 'Test bildirimi gönderilirken hata oluştu',
        data: false
      };
    }
  }

  /**
   * VAPID public key'i alır
   */
  async getVapidPublicKey(): Promise<string | null> {
    try {
      const response = await axios.get<ApiResponse<string>>(
        `${this.apiUrl}/api/v1/notification/vapid-public-key`,
        { headers: getAuthHeader() }
      );
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('VAPID public key alınırken hata oluştu:', error);
      return null;
    }
  }
}

// Global değişken tanımlaması için TypeScript'e window nesnesini genişlet
declare global {
  interface Window {
    pushNotificationManager: any;
    isAuthenticated?: boolean;
  }
}

export default new NotificationService();
