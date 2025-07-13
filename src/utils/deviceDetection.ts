/**
 * Kullanıcının tarayıcı, işletim sistemi ve cihaz bilgilerini tespit eden yardımcı fonksiyonlar
 */

/**
 * Kullanıcının tarayıcısını tespit eder
 * @returns {string} Tarayıcı adı ve versiyonu
 */
export const detectBrowser = (): string => {
  const userAgent = navigator.userAgent;
  
  // Chrome
  if (/Chrome/.test(userAgent) && !/Chromium|Edge|Edg|OPR|Opera/.test(userAgent)) {
    const match = userAgent.match(/Chrome\/(\d+)/)
    return `Chrome ${match ? match[1] : ''}`;
  }
  
  // Firefox
  if (/Firefox/.test(userAgent)) {
    const match = userAgent.match(/Firefox\/(\d+)/)
    return `Firefox ${match ? match[1] : ''}`;
  }
  
  // Edge
  if (/Edg|Edge/.test(userAgent)) {
    const match = userAgent.match(/Edg(?:e)?\/(\d+)/)
    return `Edge ${match ? match[1] : ''}`;
  }
  
  // Safari
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    const match = userAgent.match(/Version\/(\d+)/)
    return `Safari ${match ? match[1] : ''}`;
  }
  
  // Opera
  if (/OPR|Opera/.test(userAgent)) {
    const match = userAgent.match(/OPR\/(\d+)/) || userAgent.match(/Opera\/(\d+)/)
    return `Opera ${match ? match[1] : ''}`;
  }
  
  // IE
  if (/Trident/.test(userAgent)) {
    const match = userAgent.match(/rv:(\d+)/) || userAgent.match(/MSIE (\d+)/)
    return `Internet Explorer ${match ? match[1] : ''}`;
  }
  
  return 'Unknown Browser';
};

/**
 * Kullanıcının işletim sistemini tespit eder
 * @returns {string} İşletim sistemi adı ve versiyonu
 */
export const detectOS = (): string => {
  const userAgent = navigator.userAgent;
  
  // Windows
  if (/Windows/.test(userAgent)) {
    const match = userAgent.match(/Windows NT (\d+\.\d+)/)
    let version = '';
    
    if (match) {
      switch(match[1]) {
        case '10.0': version = '10'; break;
        case '6.3': version = '8.1'; break;
        case '6.2': version = '8'; break;
        case '6.1': version = '7'; break;
        case '6.0': version = 'Vista'; break;
        case '5.2': version = 'XP 64-bit'; break;
        case '5.1': version = 'XP'; break;
        default: version = match[1];
      }
    }
    
    return `Windows ${version}`;
  }
  
  // macOS
  if (/Mac OS X/.test(userAgent)) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/)
    return `macOS ${match ? match[1].replace('_', '.') : ''}`;
  }
  
  // iOS
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    const match = userAgent.match(/OS (\d+[._]\d+)/)
    return `iOS ${match ? match[1].replace('_', '.') : ''}`;
  }
  
  // Android
  if (/Android/.test(userAgent)) {
    const match = userAgent.match(/Android (\d+\.\d+)/)
    return `Android ${match ? match[1] : ''}`;
  }
  
  // Linux
  if (/Linux/.test(userAgent)) {
    return 'Linux';
  }
  
  return 'Unknown OS';
};

/**
 * Kullanıcının cihaz tipini tespit eder
 * @returns {string} Cihaz tipi (Mobile, Tablet, Desktop)
 */
export const detectDevice = (): string => {
  const userAgent = navigator.userAgent;
  
  // Mobil cihazlar
  if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) {
    return 'Mobile Android';
  }
  
  if (/iPhone|iPod/.test(userAgent)) {
    return 'Mobile iOS';
  }
  
  // Tabletler
  if (/Android/.test(userAgent) && !/Mobile/.test(userAgent)) {
    return 'Tablet Android';
  }
  
  if (/iPad/.test(userAgent)) {
    return 'Tablet iOS';
  }
  
  // Masaüstü
  return 'Desktop';
};

/**
 * Kullanıcının IP adresini almak için API çağrısı yapar
 * Not: Bu fonksiyon gerçek bir IP adresi almak için harici bir API kullanır
 * @returns {Promise<string>} IP adresi
 */
export const getIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('IP adresi alınamadı:', error);
    return 'Unknown';
  }
};

/**
 * Kullanıcının konumunu almak için Geolocation API kullanır
 * @param {boolean} userInitiated - Konum isteğinin kullanıcı tarafından başlatılıp başlatılmadığı
 * @returns {Promise<GeolocationResult>} Konum bilgisi sonuçları
 */

// Konum sonuçları için tip tanımı
export interface GeolocationResult {
  success: boolean;
  message: string;
  location?: string;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export const getLocation = async (userInitiated: boolean = false): Promise<GeolocationResult> => {
  return new Promise((resolve) => {
    // Konum isteği kullanıcı tarafından başlatılmadıysa uyarı ver ve iptal et
    if (!userInitiated) {
      console.warn('Geolocation requests should only be made in response to a user gesture to avoid browser warnings');
      resolve({
        success: false,
        message: 'Location request not initiated by user. Geolocation requests must be triggered by user interaction.'
      });
      return;
    }
    
    if (!navigator.geolocation) {
      resolve({
        success: false,
        message: 'Geolocation is not supported by this browser.'
      });
      return;
    }
    
    // Konum alma işlemi için seçenekler
    const options = {
      enableHighAccuracy: true,  // Yüksek doğruluk (GPS) kullan
      timeout: 10000,           // 10 saniye sonra zaman aşımına uğra
      maximumAge: 300000        // Son 5 dakika içinde alınmış konum kullanılabilir
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          success: true,
          message: 'Location retrieved successfully',
          location: `${latitude}, ${longitude}`,
          coords: {
            latitude,
            longitude,
            accuracy
          }
        });
      },
      (error) => {
        let errorMessage = 'Location permission denied';
        
        // Hata kodlarına göre özel mesajlar
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out';
            break;
        }
        
        resolve({
          success: false,
          message: errorMessage
        });
      },
      options
    );
  });
};
