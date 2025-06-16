import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Token'ı farklı formatlarda deneme fonksiyonu
const tryDifferentTokenFormats = async (url: string, data: any, token: string) => {
  const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
  const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  // Farklı token formatlarını dene
  const formats = [
    // Format 1: Query parameter olarak token
    {
      url: `${url}?token=${encodeURIComponent(cleanToken)}`,
      headers: { 'Content-Type': 'application/json' }
    },
    // Format 2: Authorization header olarak Bearer token
    {
      url: url,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': bearerToken
      }
    },
    // Format 3: Hem query parameter hem de Authorization header
    {
      url: `${url}?token=${encodeURIComponent(cleanToken)}`,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': bearerToken
      }
    },
    // Format 4: X-Auth-Token header
    {
      url: url,
      headers: { 
        'Content-Type': 'application/json',
        'X-Auth-Token': cleanToken
      }
    }
  ];
  
  // Her formatı sırayla dene
  for (let i = 0; i < formats.length; i++) {
    try {
      console.log(`Token format ${i+1} deneniyor:`, formats[i]);
      const response = await axios.post(formats[i].url, data, { headers: formats[i].headers });
      console.log(`Token format ${i+1} başarılı!`, response.data);
      return response;
    } catch (error) {
      console.error(`Token format ${i+1} başarısız:`, error);
      // Son format değilse devam et, son formatsa hatayı fırlat
      if (i === formats.length - 1) {
        throw error;
      }
    }
  }
  
  // Buraya asla ulaşılmamalı, ama TypeScript için gerekli
  throw new Error('Tüm token formatları başarısız oldu');
};

// ApiResponse tipini tanımlıyoruz
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Bağlantılı kişi iletişim bilgilerini ekle (yardımcı metod)
async function addContactCommunications(customerCode: string, contactData: any, token: string): Promise<void> {
  const communicationPromises = [];
  
  // Telefon bilgisi ekle
  if (contactData.Phone && contactData.Phone.trim() !== "") {
    const phoneData = {
      CustomerCode: customerCode,
      CommunicationTypeCode: "1", // 1: Telefon
      Communication: contactData.Phone,
      IsDefault: !contactData.Email // Eğer e-posta yoksa telefonu varsayılan yap
    };
    
    try {
      // Farklı token formatlarını dene
      const url = `${API_BASE_URL}/api/v1/CustomerCommunication/${customerCode}/communications`;
      const response = await tryDifferentTokenFormats(url, phoneData, token);
      console.log('Telefon bilgisi eklendi:', response.data);
    } catch (err) {
      console.error('QR Code telefon bilgisi eklenirken hata:', err);
    }
  }
  
  // E-posta bilgisi ekle
  if (contactData.Email && contactData.Email.trim() !== "") {
    const emailData = {
      CustomerCode: customerCode,
      CommunicationTypeCode: "3", // 3: E-posta
      Communication: contactData.Email,
      IsDefault: !contactData.Phone // Eğer telefon yoksa e-postayı varsayılan yap
    };
    
    try {
      // Farklı token formatlarını dene
      const url = `${API_BASE_URL}/api/v1/CustomerCommunication/${customerCode}/communications`;
      const response = await tryDifferentTokenFormats(url, emailData, token);
      console.log('E-posta bilgisi eklendi:', response.data);
    } catch (err) {
      console.error('QR Code e-posta bilgisi eklenirken hata:', err);
    }
  }
  
  console.log('QR Code bağlantılı kişi iletişim bilgileri işlemi tamamlandı');
}

// QR code müşteri kaydı için özel servis
// Normal müşteri oluşturma akışını etkilemeden QR code akışı için token desteği sağlar
export const qrCustomerService = {
  // QR code token ile adres ekleme
  createCustomerAddress: async (customerCode: string, addressData: any, token: string): Promise<ApiResponse<any>> => {
    try {
      console.log('QR Code akışı: Adres eklemede özel token kullanılıyor');
      console.log('Gönderilen adres verisi:', addressData);
      
      // Farklı token formatlarını dene
      const url = `${API_BASE_URL}/api/v1/CustomerAddress/${customerCode}/addresses`;
      const response = await tryDifferentTokenFormats(url, addressData, token);
      
      console.log('QR Code adres ekleme yanıtı:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('QR Code adres eklerken hata:', error);
      console.error('Hata detayı:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },
  
  // QR code token ile iletişim bilgisi ekleme
  createCustomerCommunication: async (customerCode: string, communicationData: any, token: string): Promise<ApiResponse<any>> => {
    try {
      console.log('QR Code akışı: İletişim eklemede özel token kullanılıyor');
      console.log('Gönderilen iletişim verisi:', communicationData);
      
      // Farklı token formatlarını dene
      const url = `${API_BASE_URL}/api/v1/CustomerCommunication/${customerCode}/communications`;
      const response = await tryDifferentTokenFormats(url, communicationData, token);
      
      console.log('QR Code iletişim ekleme yanıtı:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('QR Code iletişim eklerken hata:', error);
      console.error('Hata detayı:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },
  
  // QR code token ile bağlantılı kişi ekleme
  createCustomerContact: async (customerCode: string, contactData: any, token: string): Promise<ApiResponse<any>> => {
    try {
      console.log('QR Code akışı: Bağlantılı kişi eklemede özel token kullanılıyor');
      console.log('Gönderilen bağlantılı kişi verisi:', contactData);
      
      // Farklı token formatlarını dene
      const url = `${API_BASE_URL}/api/v1/CustomerContact/${customerCode}/contacts`;
      const response = await tryDifferentTokenFormats(url, contactData, token);
      
      console.log('QR Code bağlantılı kişi ekleme yanıtı:', response.data);
      
      // Bağlantılı kişi başarıyla eklendiyse ve iletişim bilgileri varsa, iletişim bilgilerini ekle
      if (response.data.success && (contactData.Phone || contactData.Email)) {
        try {
          // Telefon ve e-posta bilgilerini ekle
          await addContactCommunications(customerCode, contactData, token);
        } catch (commError) {
          console.error('Bağlantılı kişi iletişim bilgileri eklenirken hata:', commError);
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('QR Code bağlantılı kişi eklerken hata:', error);
      console.error('Hata detayı:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }
};
