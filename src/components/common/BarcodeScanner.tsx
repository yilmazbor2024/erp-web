import React, { useRef, useState, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeResult, QrcodeSuccessCallback, QrcodeErrorCallback } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isScanning: boolean;
  onScanComplete?: () => void;
  height?: string;
  clearInput?: boolean;
  initialScanMode?: 'barcode' | 'qr';
  inputRef?: React.RefObject<HTMLInputElement>;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  isScanning, 
  onScanComplete = () => {},
  height = '150px',
  clearInput = true,
  initialScanMode = 'barcode',
  inputRef
}) => {
  // State ve ref tanımlamaları
  const [showSuccessAnimation, setShowSuccessAnimation] = useState<boolean>(false);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastDetectedRef = useRef<{barcode: string, timestamp: number}>({barcode: '', timestamp: 0});
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  
  // Tarayıcı başlatma fonksiyonu
  const startScanner = async () => {
    if (!scannerContainerRef.current) return;
    
    try {
      // Mevcut tarayıcıyı temizle
      if (html5QrCodeRef.current) {
        await stopScanner();
      }
      
      // Kamera listesini al
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        // Arka kamera varsa onu kullan, yoksa ilk kamerayı kullan
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('arka') ||
          device.label.toLowerCase().includes('rear')
        );
        
        const selectedCameraId = backCamera ? backCamera.id : devices[0].id;
        
        // HTML5 QR Code tarayıcısını başlat
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;
        
        // Html5Qrcode için yapılandırma
        const config = {
          fps: 10,
          qrbox: { width: 400, height: 200 },
          aspectRatio: 1.0,
          // BarcodeFormat türünü kullanmadan string olarak belirtiyoruz
          formatsToSupport: [
            'EAN_13',
            'CODE_39',
            'CODE_128',
            'QR_CODE',
          ] as any,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };
        
        await html5QrCode.start(
          selectedCameraId, 
          config, 
          (decodedText, decodedResult) => {
            handleScan(decodedText, decodedResult);
          },
          (errorMessage) => {
            // Hata mesajlarını filtreleme
            // Sadece gerçek hatalar için loglama yapıyoruz
            if (!(errorMessage.includes('No MultiFormat Readers') || errorMessage.includes('No barcode or QR code detected'))) {
              console.error('QR tarama hatası:', errorMessage);
            }
          }
        );
        
        // Kamera odaklama ayarları
        setTimeout(() => {
          focusCamera();
        }, 1000);
        
      } else {
        console.error('Kamera bulunamadı');
        setHasCamera(false);
      }
    } catch (error) {
      console.error('Tarayıcı başlatma hatası:', error);
      setHasCamera(false);
    }
  };
  
  // Tarayıcıyı durdurma fonksiyonu
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          await html5QrCodeRef.current.stop();
          console.log('Tarayıcı durduruldu');
        }
      } catch (error) {
        console.error('Tarayıcı durdurma hatası:', error);
      }
    }
  };
  
  // Kamera odaklama fonksiyonu - 5-10 cm mesafe için optimize edildi
  const focusCamera = async () => {
    try {
      const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
      if (!videoElement) {
        console.warn('Video elementi bulunamadı');
        return;
      }
      
      // MediaStream'i al
      const stream = videoElement.srcObject as MediaStream;
      if (!stream) {
        console.warn('Video stream bulunamadı');
        return;
      }
      
      const track = stream.getVideoTracks()[0];
      if (!track) {
        console.warn('Video track bulunamadı');
        return;
      }
      
      // Kamera özelliklerini al
      const capabilities = track.getCapabilities();
      
      // Eğer kamera manuel odaklama destekliyorsa
      if (capabilities && 
          'focusMode' in capabilities && 
          Array.isArray(capabilities.focusMode) && 
          capabilities.focusMode.includes('manual') && 
          'focusDistance' in capabilities) {
        
        // Kamera ayarlarını yapılandır - 5-10 cm mesafe için
        const constraints = {
          advanced: [{
            focusMode: 'manual',
            focusDistance: 0.07, // 7cm mesafe için sabit odak (5-10cm aralığının ortası)
            zoom: 1.0
          }]
        };
        
        await track.applyConstraints(constraints as MediaTrackConstraints);
        console.log('Manuel odaklama ayarlandı: 7cm (5-10cm aralığı)');
        return true;
      }
      
      // Ek olarak, maksimum çözünürlük ve kare hızı ayarla - yakın mesafe için optimize
      try {
        await track.applyConstraints({
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 25, max: 30 }
        });
        console.log('Kamera çözünürlük ve kare hızı optimize edildi');
      } catch (err) {
        console.warn('Kamera çözünürlük ayarı yapılamadı:', err);
      }
      
      // Alternatif odaklama modu dene
      try {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as any]
        });
        console.log('Alternatif odaklama modu ayarlandı');
        return true;
      } catch (err) {
        console.warn('Alternatif odaklama ayarlanamadı:', err);
      }
      
      console.log('Kamera odaklama ayarlanamadı, varsayılan ayarlar kullanılıyor');
      return false;
    } catch (error) {
      console.error('Kamera odaklama hatası:', error);
      return false;
    }
  };
  
  // Barkod tarama başarılı olduğunda çağrılacak fonksiyon
  const handleScan = (decodedText: string, decodedResult: Html5QrcodeResult) => {
    const now = Date.now();
    const lastDetected = lastDetectedRef.current;
    
    // Aynı barkodu tekrar okumamak için kontrol - 5 saniye bekleme süresi
    if (lastDetected.barcode === decodedText && now - lastDetected.timestamp < 5000) {
      return;
    }
    
    lastDetectedRef.current = { barcode: decodedText, timestamp: now };
    
    // Başarılı tarama efektleri
    setShowSuccessAnimation(true);
    setTimeout(() => setShowSuccessAnimation(false), 1500);
    
    // Bip sesi çal
    playBipSound();
    
    // Barkodu input alanına yaz ve enter tuşuna bas
    writeToInputAndPressEnter(decodedText);
    
    // Callback fonksiyonlarını çağır
    onScan(decodedText);
    onScanComplete();
  };
  
  // Barkod okunduğunda belirgin bir bip sesi çalma fonksiyonu
  const playBipSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1500; // Yüksek frekanslı bip sesi
      gainNode.gain.value = 0.1; // Ses seviyesi
      
      oscillator.start();
      
      // Kısa bir bip sesi
      setTimeout(() => {
        oscillator.stop();
      }, 150);
      
    } catch (error) {
      console.error('Ses çalma hatası:', error);
    }
  };
  
  // Input alanına barkod yazma ve enter tuşuna basma fonksiyonu
  const writeToInputAndPressEnter = (barcode: string) => {
    if (inputRef && inputRef.current) {
      // Input alanı doluysa yeni barkod okuma yapma
      if (inputRef.current.value && inputRef.current.value.trim() !== '') {
        console.log('Input alanı dolu olduğu için yeni barkod yazılmadı:', barcode);
        return;
      }
      
      try {
        console.log('Barkod input alanına yazılıyor:', barcode);
        
        // Barkodu input alanına yaz
        inputRef.current.value = barcode;
        inputRef.current.focus();
        
        // Input event'lerini tetikle
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        inputRef.current.dispatchEvent(inputEvent);
        inputRef.current.dispatchEvent(changeEvent);
        
        // Enter tuşu olaylarını tetikle - biraz gecikme ile
        setTimeout(() => {
          console.log('Enter tuşu olayları tetikleniyor');
          if (inputRef.current) {
            // Enter tuşu olaylarını tetikle
            const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
            const keypressEvent = new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
            const keyupEvent = new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
            
            inputRef.current.dispatchEvent(keydownEvent);
            inputRef.current.dispatchEvent(keypressEvent);
            inputRef.current.dispatchEvent(keyupEvent);
            
            // Arama butonunu bul ve tıkla
            const searchButton = document.querySelector('button[type="submit"]');
            if (searchButton) {
              console.log('Arama butonu bulundu ve tıklanıyor');
              (searchButton as HTMLElement).click();
            } else {
              console.log('Arama butonu bulunamadı');
            }
            
            // Form submit olayını tetikle
            const form = inputRef.current?.closest('form');
            if (form) {
              console.log('Form bulundu ve submit olayı tetikleniyor');
              form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            } else {
              console.log('Form bulunamadı');
            }
            
            // Input alanını temizle (isteğe bağlı)
            if (clearInput) {
              setTimeout(() => {
                if (inputRef.current) {
                  console.log('Input alanı temizleniyor');
                  inputRef.current.value = '';
                  const inputEvent = new Event('input', { bubbles: true });
                  inputRef.current.dispatchEvent(inputEvent);
                }
              }, 500); // Daha uzun bir gecikme ekledik, böylece arama işlemi tamamlanabilir
            }
          }
        }, 100);
      } catch (error) {
        console.error('Input yazma hatası:', error);
      }
    }
  };
  
  // Kamera ve tarama işlemlerini başlat/durdur
  useEffect(() => {
    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }
    
    // Component unmount olduğunda kaynakları temizle
    return () => {
      stopScanner();
      
      // AudioContext'i temizle
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          audioContextRef.current = null;
        } catch (e) {
          console.log('AudioContext kapatma hatası:', e);
        }
      }
    };
  }, [isScanning]);
  
  // CSS animasyonu ekle
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeOut {
        0% { opacity: 0.7; }
        100% { opacity: 0; }
      }
      
      .barcode-success-animation {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 255, 0, 0.3);
        animation: fadeOut 1.5s ease-out forwards;
        pointer-events: none;
        z-index: 10;
      }
      
      #qr-reader {
        width: 100%;
        height: 100%;
        position: relative;
      }
      
      #qr-reader video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      #qr-reader__scan_region {
        position: relative;
      }
      
      #qr-reader__scan_region img {
        display: none;
      }
      
      #qr-reader__dashboard {
        position: absolute;
        bottom: 10px;
        left: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 5px;
        border-radius: 5px;
        font-size: 12px;
        display: flex;
        justify-content: center;
      }
      
      #qr-reader__dashboard_section_csr button {
        background-color: #1890ff;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        margin: 0 5px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: height, 
      overflow: 'hidden',
      backgroundColor: '#000' 
    }}>
      {!hasCamera && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          color: '#fff',
          textAlign: 'center',
          padding: '20px',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div>Kamera erişimi sağlanamadı. Lütfen kamera izinlerini kontrol edin.</div>
          <button 
            onClick={() => {
              setHasCamera(true);
              setTimeout(() => startScanner(), 500);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Kamera Erişimini Yeniden Dene
          </button>
        </div>
      )}
      
      <div 
        id="qr-reader" 
        ref={scannerContainerRef}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Başarılı barkod okuma animasyonu */}
      {showSuccessAnimation && (
        <div className="barcode-success-animation" />
      )}
    </div>
  );
};

export default BarcodeScanner;