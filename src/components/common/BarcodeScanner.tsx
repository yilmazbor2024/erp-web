import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';

// @ts-ignore - Quagga için tip tanımlamaları yok, bu yüzden hata görmezden geliniyor
import Quagga from 'quagga';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isScanning: boolean;
  onScanComplete?: () => void;
  height?: string;
  clearInput?: boolean;
  initialScanMode?: 'barcode' | 'qr';
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  isScanning, 
  onScanComplete = () => {},
  height = '150x',
  clearInput = true, // Varsayılan olarak input alanını temizle
  initialScanMode = 'barcode'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const quaggaContainerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  // Son algılanan barkodu ve zamanını saklamak için ref
  const lastDetectedRef = useRef<{barcode: string, timestamp: number}>({barcode: '', timestamp: 0});
  
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'qr' | 'barcode'>(initialScanMode); // Dışarıdan gelen başlangıç modunu kullan
  const [cameraFocused, setCameraFocused] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false); // Barkod başarılı okuma göstergesi
  
  // CSS keyframes animasyonu için stil
  const pulseKeyframes = `
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 0.9; }
      100% { opacity: 0.6; }
    }
  `;

  // Geliştirilmiş kamera odaklama fonksiyonu
  const focusCamera = async () => {
    try {
      if (!streamRef.current) return;
      
      const track = streamRef.current.getVideoTracks()[0];
      if (!track) return;
      
      // TypeScript hatalarını önlemek için any tipini kullan
      const capabilities = track.getCapabilities() as any;
      
      // Tüm odaklama modlarını dene
      const focusModes = ['continuous', 'single-shot', 'manual', 'auto'];
      
      // Eğer kamera odaklama özelliğini destekliyorsa
      if (capabilities && capabilities.focusMode) {
        for (const mode of focusModes) {
          if (capabilities.focusMode.includes(mode)) {
            try {
              // TypeScript hatalarını önlemek için any tipini kullan
              await (track as any).applyConstraints({
                advanced: [{ 
                  focusMode: mode,
                  // Odak mesafesini yakın ayarla (barkod okuma için)
                  focusDistance: mode === 'manual' ? 0.3 : undefined
                }]
              });
              
              // Odaklama başarılı
              setCameraFocused(true);
              break;
            } catch (e) {}
          }
        }
      }
      
      // Ek olarak, maksimum çözünürlük ve kare hızı ayarla
      try {
        await track.applyConstraints({
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        });
      } catch (e) {}
      
    } catch (error) {}
  };

  // Barkod tarama fonksiyonu - QR kod için jsQR kullanır
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    
    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setIsProcessing(false);
      return;
    }
    
    // Video boyutlarını canvas'a ayarla
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Video frame'ini canvas'a çiz
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Canvas'tan görüntü verilerini al
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // jsQR ile QR kodu tara
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    
    if (code) {
      const now = Date.now();
      
      // Aynı barkodu kısa süre içinde tekrar taramayı önle (300ms - daha hızlı tarama için)
      if (!lastDetectedRef.current.barcode || 
          lastDetectedRef.current.barcode !== code.data || 
          (now - lastDetectedRef.current.timestamp) > 300) {
        
        lastDetectedRef.current = {barcode: code.data, timestamp: now};
        
        // Barkod bulunduğunda ses çal ve başarı efekti göster
        playSuccessSound();
        showSuccessEffect();
        
        // Barkod değerini gönder
        onScan(code.data);
        onScanComplete();
        
        // QR kod tarama işlemi tamamlandıktan sonra kısa bir duraklama
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
        }, 50);
      }
    }
    
    setIsProcessing(false);
  };
  
  // Ses çalma fonksiyonu - 0.2 saniyeden kısa sürecek şekilde optimize edildi
  const playSuccessSound = () => {
    try {
      // Eğer önceki bir AudioContext varsa ve aktifse, onu kullan
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        // Eğer AudioContext askıya alınmışsa, devam ettir
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      } else {
        // Yeni bir AudioContext oluştur
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          return; // Ses çalamıyorsak fonksiyondan çık
        }
      }
      
      const audioContext = audioContextRef.current;
      if (!audioContext) return; // Güvenlik kontrolü
      
      // Oscillator ve gain node oluştur
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1200; // Daha yüksek ton - daha iyi duyulabilir
      gainNode.gain.value = 0.05; // Ses seviyesi
      
      // Ses çal
      oscillator.start();
      
      // Kısa süre sonra durdur - 0.2 saniyeden kısa
      setTimeout(() => {
        try {
          oscillator.stop();
        } catch (e) {}
      }, 150); // 150ms - 0.15 saniye
    } catch (error) {}
  };

  // Başarı efekti gösterme fonksiyonu - 0.2 saniyeden kısa sürecek şekilde optimize edildi
  const showSuccessEffect = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 200); // 200ms - 0.2 saniye
  };

  // Geleneksel barkod tarama fonksiyonu - Quagga kullanır (EAN, UPC, Code128 vb.)
  const startBarcodeScanner = () => {
    if (!quaggaContainerRef.current || !isScanning) return;
    
    Quagga.init({
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: quaggaContainerRef.current,
        constraints: {
          facingMode: 'environment', // Arka kamera
          width: { min: 640 },
          height: { min: 480 },
          aspectRatio: { min: 1, max: 2 }
        },
      },
      locator: {
        patchSize: 'medium',
        halfSample: true
      },
      numOfWorkers: 2,
      frequency: 10,
      decoder: {
        readers: [
          'ean_reader',  // EAN-13 barkodları için
          'ean_8_reader', // EAN-8 barkodları için
        ]
      },
      locate: true,
      debug: false,
      multiple: false
      // @ts-ignore - Quagga callback tiplerini görmezden gel
    }, (err) => {
      if (err) {
        console.error('Quagga başlatma hatası:', err);
        setScanMode('qr'); // Quagga başarısız olursa QR moduna geç
        return;
      }
      
      console.log('Quagga başlatıldı');
      
      Quagga.onDetected((result: any) => {
        const barcode = result.codeResult.code;
        const format = result.codeResult.format;
        
        // Barkod formatını ve uzunluğunu kontrol et
        const isValidFormat = ['ean_13', 'ean_8', 'upc', 'upc_e', 'code_128'].includes(format);
        const isValidLength = (format === 'ean_13' && barcode.length === 13) || 
                            (format === 'ean_8' && barcode.length === 8) || 
                            ((format === 'upc' || format === 'upc_e') && barcode.length >= 11) ||
                            (format === 'code_128' && barcode.length >= 8);
        const isNumeric = /^\d+$/.test(barcode);
        
        if ((isValidFormat && isValidLength) || (isNumeric && barcode.length >= 8)) {
          // Aynı barkod için tekrar algılama kontrolü
          const now = Date.now();
          
          // Aynı barkodu kısa süre içinde tekrar taramayı önle (300ms - daha hızlı tarama için)
          if (!lastDetectedRef.current.barcode || 
              lastDetectedRef.current.barcode !== barcode || 
              (now - lastDetectedRef.current.timestamp) > 300) {
            
            lastDetectedRef.current = {barcode: barcode, timestamp: now};
            
            // Barkod bulunduğunda ses çal ve başarı efekti göster
            playSuccessSound();
            showSuccessEffect();
            
            // Quagga'yı durdur ve yeniden başlatmadan önce kısa bir süre bekle
            Quagga.stop();
            
            // Barkod değerini gönder
            setTimeout(() => {
              if (isScanning) { // Eğer hala tarama modundaysak
                onScan(barcode);
                onScanComplete();
                
                // Quagga'yı yeniden başlat - daha hızlı yeniden başlatma
                setTimeout(() => {
                  if (isScanning && scanMode === 'barcode') {
                    startBarcodeScanner();
                  }
                  
                }, 300); // 300ms - 0.3 saniye
              }
            }, 50); // 50ms - daha hızlı işlem
          }
        }
      });
      
      // Quagga'yı başlat
      Quagga.start();
    });
  };
  
  // Tarama moduna göre uygun tarama fonksiyonunu çağır
  const scanBarcode = () => {
    if (scanMode === 'qr') {
      // QR kod tarama işlemi için doğrudan fonksiyonu çağır
      scanQRCode();
    } else {
      // Quagga zaten kendi içinde tarama yapıyor
    }
  };

  // Kamera durdurma fonksiyonu
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      // Stream referansını temizle
      if (streamRef) {
        streamRef.current = null;
      }
    }
    
    if (scanMode === 'barcode') {
      try {
        Quagga.stop();
      } catch (error) {
        // Quagga zaten durdurulmuş olabilir
      }
    }
    
    setCameraFocused(false); // Odaklanma durumunu sıfırla
    setIsProcessing(false);
  };

  // Kamera başlatma fonksiyonu - useEffect dışında tanımlandı ki yeniden deneme butonundan çağrılabilsin
  const startCamera = async () => {
    try {
      if (!isScanning) return { videoStream: null, scanInterval: undefined };
      
      // Tarama moduna göre farklı işlem yap
      if (scanMode === 'barcode') {
        // Barkod modu için Quagga kullan
        console.log('Barkod tarama modu başlatılıyor...');
        startBarcodeScanner();
        return { videoStream: null, scanInterval: undefined };
      }
      
      // QR kod modu için getUserMedia kullan
      console.log('QR kod tarama modu başlatılıyor...');
      
      // Tarayıcı kamera erişimini desteklemiyor
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Bu tarayıcı kamera erişimini desteklemiyor');
        setHasCamera(false);
        return { videoStream: null, scanInterval: undefined };
      }
      
      // Kamera erişimi iste
      // @ts-ignore - focusMode MediaTrackConstraints'te tanımlı değil, bu yüzden tüm constraints nesnesini görmezden geliyoruz
      const constraints = {
        video: {
          facingMode: 'environment', // Arka kamera
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          advanced: [
            {
              focusMode: 'continuous' // Sürekli odaklama modu
            }
          ]
        },
        audio: false
      };
      
      // @ts-ignore - TypeScript hatalarını görmezden geliyoruz
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      let videoStream = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream; // Stream'i referansta sakla
        videoRef.current.play();
        
        // Kamera başladıktan sonra odaklanma işlemini çağır
        setTimeout(() => {
          focusCamera();
        }, 1000);
      }

      // Tarama aralığını başlat
      const scanInterval = setInterval(() => {
        if (isScanning) {
          scanQRCode();
        } else {
          clearInterval(scanInterval);
        }
      }, 500);
      
      return { videoStream, scanInterval };
    } catch (error) {
      console.error('Kamera erişim hatası:', error);
      setHasCamera(false);
      return { videoStream: null, scanInterval: undefined };
    }
  };

  // Kamera ve tarama işlemlerini başlat/durdur
  useEffect(() => {
    let videoStream: MediaStream | null = null;
    let scanInterval: NodeJS.Timeout | undefined;
    let mounted = true; // Bileşenin hala mount edilmiş olup olmadığını takip et
    
    // Kaynakları temizleme fonksiyonu
    const cleanupResources = () => {
      if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = undefined;
      }
      
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
      }
      
      // Quagga'yı durdur
      try {
        Quagga.stop();
      } catch (e) {
        console.log('Quagga durdurma hatası:', e);
      }
      
      stopCamera();
      
      // lastDetectedRef'i sıfırla
      lastDetectedRef.current = {barcode: '', timestamp: 0};
    };

    if (isScanning && mounted) {
      startCamera().then(result => {
        if (result && mounted) { // Eğer bileşen hala mount edilmişse
          videoStream = result.videoStream;
          scanInterval = result.scanInterval;
        }
      });
    } else {
      cleanupResources();
    }
    
    // Component unmount olduğunda kaynakları temizle
    return () => {
      mounted = false; // Bileşen unmount edildi
      cleanupResources();
      
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
  }, [isScanning, onScan, onScanComplete, scanMode]);
  
  // Tarama modunu değiştirme fonksiyonu
  const toggleScanMode = () => {
    // Önce kamerayı durdur
    stopCamera();
    
    // Modu değiştir
    setScanMode(scanMode === 'qr' ? 'barcode' : 'qr');
    
    // Kısa bir süre sonra yeni modda başlat
    setTimeout(() => {
      if (isScanning) {
        startCamera();
      }
    }, 500);
  };
  
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: height, 
      overflow: 'hidden',
      backgroundColor: '#000' 
    }}>
      <style>{pulseKeyframes}</style>
      
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
              setTimeout(() => startCamera(), 500);
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
      
      {/* QR kod modu için video elementi */}
      {scanMode === 'qr' && (
        <video 
          ref={videoRef} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: isScanning ? 'block' : 'none'
          }} 
          muted 
          playsInline
        />
      )}
      
      {/* Barkod modu için Quagga container */}
      {scanMode === 'barcode' && (
        <div 
          ref={quaggaContainerRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
          }}
        />
      )}
      
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'none',
          position: 'absolute',
          top: 0,
          left: 0
        }} 
      />
      
      {/* Butonlar BarcodeModal bileşenine taşındı */}
      
      {/* Başarılı tarama göstergesi - daha parlak ve kısa süreli */}
      {showSuccess && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 255, 0, 0.15)', // %15 şeffaflık
          animation: 'pulse 0.2s ease-in-out',
          pointerEvents: 'none',
          zIndex: 10,
          border: '2px solid rgba(0, 255, 0, 0.5)' // Yeşil çerçeve
        }} />
      )}
    </div>
  );
};

export default BarcodeScanner;