import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';

// @ts-ignore - Quagga için tip tanımlamaları yok
import Quagga from 'quagga';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const quaggaContainerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const quaggaInitializedRef = useRef<boolean>(false);
  const lastDetectedRef = useRef<{barcode: string, timestamp: number}>({barcode: '', timestamp: 0});
  
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'qr' | 'barcode'>(initialScanMode);
  const [cameraFocused, setCameraFocused] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  
  // CSS keyframes animasyonu için stil
  const pulseKeyframes = `
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 0.9; }
      100% { opacity: 0.6; }
    }
  `;

  // Geliştirilmiş kamera odaklama fonksiyonu - 10-13 cm mesafe için optimize edildi
  const focusCamera = async () => {
    try {
      if (!streamRef.current) return;
      
      const track = streamRef.current.getVideoTracks()[0];
      if (!track) return;
      
      // TypeScript hatalarını önlemek için any tipini kullan
      const capabilities = track.getCapabilities() as any;
      
      // Tüm odaklama modlarını dene - yakın mesafe için optimize
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
                  // Odak mesafesini yakın ayarla (10-13 cm için)
                  focusDistance: mode === 'manual' ? 0.11 : undefined // 0.11 yaklaşık 11cm'ye denk gelir
                }]
              });
              
              console.log(`Kamera odaklama modu ayarlandı: ${mode}`);
              
              // Odaklama başarılı
              setCameraFocused(true);
              break;
            } catch (e) {
              console.log(`Odaklama modu ayarlama hatası (${mode}):`, e);
            }
          }
        }
      } else {
        console.log('Bu kamera odaklama özelliğini desteklemiyor');
      }
      
      // Ek olarak, maksimum çözünürlük ve kare hızı ayarla - yakın mesafe için optimize
      try {
        await track.applyConstraints({
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        });
        console.log('Kamera çözünürlük ve kare hızı ayarlandı');
      } catch (e) {
        console.log('Kamera çözünürlük ayarlama hatası:', e);
      }
      
    } catch (error) {
      console.error('Kamera odaklama hatası:', error);
    }
  };

  // QR kod tarama fonksiyonu - jsQR kullanır
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    
    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    // willReadFrequently özelliğini ekleyerek canvas performansını artır
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
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
      
      // Aynı barkodu kısa süre içinde tekrar taramayı önle
      if (!lastDetectedRef.current.barcode || 
          lastDetectedRef.current.barcode !== code.data || 
          (now - lastDetectedRef.current.timestamp) > 300) {
        
        lastDetectedRef.current = {barcode: code.data, timestamp: now};
        
        // Barkod bulunduğunda ses çal ve başarı efekti göster
        playSuccessSound();
        showSuccessEffect();
        
        // Barkod değerini gönder ve input'a yaz
        onScan(code.data);
        writeToInputAndPressEnter(code.data);
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
  
  // Barkod okunduğunda belirgin bir bip sesi çalma fonksiyonu
  const playSuccessSound = () => {
    try {
      // Web Audio API kullanarak ses oluştur
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.log('AudioContext oluşturulamadı:', e);
          return; // Ses oluşturulamadı, sessiz devam et
        }
      }
      
      // Eğer ses bağlamı kapalıysa, yeni bir tane oluştur
      if (audioContextRef.current.state === 'closed') {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.log('AudioContext yeniden oluşturulamadı:', e);
          return; // Ses oluşturulamadı, sessiz devam et
        }
      }
      
      // Eğer ses bağlamı askıya alınmışsa, devam ettir
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => {
          console.log('AudioContext devam ettirilemedi:', e);
        });
      }
      
      // İlk ses - 1800 Hz kare dalga
      const oscillator1 = audioContextRef.current.createOscillator();
      oscillator1.type = 'square';
      oscillator1.frequency.setValueAtTime(1800, audioContextRef.current.currentTime);
      
      // Ses seviyesi kontrolü
      const gainNode1 = audioContextRef.current.createGain();
      gainNode1.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.08);
      
      // Bağlantıları kur ve sesi başlat
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContextRef.current.destination);
      oscillator1.start();
      oscillator1.stop(audioContextRef.current.currentTime + 0.08);
      
      // Kısa bir gecikme sonra ikinci ses - 2200 Hz kare dalga
      setTimeout(() => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          const oscillator2 = audioContextRef.current.createOscillator();
          oscillator2.type = 'square';
          oscillator2.frequency.setValueAtTime(2200, audioContextRef.current.currentTime);
          
          const gainNode2 = audioContextRef.current.createGain();
          gainNode2.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
          
          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContextRef.current.destination);
          oscillator2.start();
          oscillator2.stop(audioContextRef.current.currentTime + 0.1);
        }
      }, 100); // 100ms - ilk ses süresi
      
    } catch (error) {
      console.error('Ses çalma hatası:', error);
    }
  };

  // Başarı efekti gösterme fonksiyonu
  const showSuccessEffect = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 300);
  };
  
  // Input alanına barkod yazma ve enter tuşuna basma fonksiyonu - daha seri çalışacak şekilde optimize edildi
  const writeToInputAndPressEnter = (barcode: string) => {
    if (inputRef && inputRef.current) {
      try {
        // Input alanına barkodu yaz
        inputRef.current.value = barcode;
        
        // Input alanına odaklan
        inputRef.current.focus();
        
        // Input değerini değiştir (React state güncellemesi için)
        const inputEvent = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(inputEvent);
        
        // Change event tetikle
        const changeEvent = new Event('change', { bubbles: true });
        inputRef.current.dispatchEvent(changeEvent);
        
        // Enter tuşuna basma olayını simüle et - daha hızlı çalışması için gecikmeyi azalt
        setTimeout(() => {
          try {
            // KeyDown
            const keydownEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            inputRef.current?.dispatchEvent(keydownEvent);
            
            // KeyPress
            const keypressEvent = new KeyboardEvent('keypress', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            inputRef.current?.dispatchEvent(keypressEvent);
            
            // KeyUp
            const keyupEvent = new KeyboardEvent('keyup', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            inputRef.current?.dispatchEvent(keyupEvent);
            
            // Arama butonunu bul ve tıkla
            const parentElement = inputRef.current?.parentElement;
            if (parentElement) {
              const searchButton = parentElement.querySelector('button[type="button"]') as HTMLElement;
              if (searchButton) {
                searchButton.click();
              }
            }
          } catch (eventError) {
            console.error('Enter tuşu simülasyon hatası:', eventError);
          }
        }, 50);
        
        // Eğer input temizlenecekse, kısa bir gecikme sonrasında temizle
        if (clearInput) {
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.value = '';
              const inputEvent = new Event('input', { bubbles: true });
              inputRef.current.dispatchEvent(inputEvent);
            }
          }, 500); // Daha uzun bir gecikme ekledik, böylece arama işlemi tamamlanabilir
        }
      } catch (error) {
        console.error('Input yazma hatası:', error);
      }
    }
  };
  
  // Geleneksel barkod tarama fonksiyonu - Quagga kullanır (EAN, UPC, Code128 vb.)
  const startBarcodeScanner = () => {
    if (!quaggaContainerRef.current || !isScanning) return;
    
    // Eğer Quagga zaten başlatıldıysa, tekrar başlatma
    if (quaggaInitializedRef.current) {
      console.log('Quagga zaten başlatılmış, tekrar başlatma atlatılıyor');
      return;
    }
    
    Quagga.init({
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: quaggaContainerRef.current,
        constraints: {
          facingMode: 'environment',
          width: { min: 640, ideal: 1024 },
          height: { min: 480, ideal: 768 },
          aspectRatio: { min: 1, max: 2 }
        },
        area: {
          top: "0%",
          right: "0%",
          left: "0%",
          bottom: "0%"
        },
        singleChannel: false,
        willReadFrequently: true
      },
      locator: {
        patchSize: 'medium', // 10-13 cm mesafe için orta boy uygun
        halfSample: false    // Yakın mesafe için false daha iyi sonuç veriyor
      },
      numOfWorkers: Math.max(2, navigator.hardwareConcurrency ? Math.min(navigator.hardwareConcurrency - 1, 4) : 2),
      frequency: 5,
      decoder: {
        readers: [
          'ean_reader',
          'ean_8_reader',
          'code_128_reader',
          'code_39_reader',
        ],
        multiple: false
      },
      debug: {
        drawBoundingBox: false,
        showFrequency: false,
        drawScanline: false,
        showPattern: false
      },
      locate: true,
      multiple: false
    }, (err: Error | null | undefined) => {
      if (err) {
        console.error('Quagga başlatma hatası:', err);
        setScanMode('qr');
        return;
      }
      
      console.log('Quagga başlatıldı');
      quaggaInitializedRef.current = true;
      
      // Performans için throttling uygula
      let lastProcessedTimestamp = 0;
      const THROTTLE_MS = 150;
      
      // Barkod algılama kalitesini izle - throttled
      Quagga.onProcessed((result: any) => {
        const now = Date.now();
        if (now - lastProcessedTimestamp < THROTTLE_MS) {
          return;
        }
        
        lastProcessedTimestamp = now;
        
        if (result && result.codeResult && result.codeResult.code && typeof result.codeResult.confidence !== 'undefined') {
          const confidence = result.codeResult.confidence;
          if (confidence > 0.9) {
            console.log(`Yüksek güvenilirlik: ${confidence.toFixed(2)}, Kod: ${result.codeResult.code}`);
          }
        }
      });
      
      // Performans için son algılama zamanını takip et
      let lastDetectionTime = 0;
      const DETECTION_THROTTLE_MS = 300;
      
      Quagga.onDetected((result: any) => {
        const now = Date.now();
        if (now - lastDetectionTime < DETECTION_THROTTLE_MS) {
          return;
        }
        lastDetectionTime = now;
        
        if (!result || !result.codeResult) {
          console.error('Geçersiz barkod sonucu:', result);
          return;
        }
        
        const barcode = result.codeResult.code;
        const format = result.codeResult.format;
        const confidence = result.codeResult.confidence;
        
        if (!barcode || !format) {
          console.error('Eksik barkod bilgisi:', { barcode, format });
          return;
        }
        
        if (typeof confidence === 'undefined') {
          console.log('Confidence değeri eksik, ancak barkod işleniyor:', { barcode, format });
        }
        
        const confidenceDisplay = typeof confidence === 'number' ? confidence.toFixed(2) : 'N/A';
        console.log(`Barkod bulundu: ${barcode}, Format: ${format}, Güvenilirlik: ${confidenceDisplay}`);
        
        // Barkod formatını, uzunluğunu ve güvenilirliğini kontrol et
        const isValidFormat = ['ean_13', 'ean_8', 'upc', 'upc_e', 'code_128', 'code_39'].includes(format);
        const isValidLength = (format === 'ean_13' && barcode.length === 13) || 
                            (format === 'ean_8' && barcode.length === 8) || 
                            ((format === 'upc' || format === 'upc_e') && barcode.length >= 11) ||
                            ((format === 'code_128' || format === 'code_39') && barcode.length >= 4);
        const isNumeric = /^\d+$/.test(barcode);
        
        // Güvenilirlik eşiği - formatına göre farklı eşikler kullan
        const confidenceThreshold = format === 'ean_13' || format === 'ean_8' ? 0.7 : 0.6;
        const confidenceValue = typeof confidence === 'number' ? confidence : 0;
        
        if ((isValidFormat && isValidLength) || (isNumeric && barcode.length >= 4)) {
          if (typeof confidence === 'number' && confidence <= confidenceThreshold) {
            console.log(`Düşük güvenilirlik ancak barkod işleniyor: ${confidence.toFixed(2)}`);
          }
          
          if (!lastDetectedRef.current.barcode || 
              lastDetectedRef.current.barcode !== barcode || 
              (now - lastDetectedRef.current.timestamp) > 1000) {
            
            lastDetectedRef.current = {barcode: barcode, timestamp: now};
            
            setTimeout(() => {
              playSuccessSound();
              showSuccessEffect();
            }, 0);
            
            try {
              Quagga.stop();
              quaggaInitializedRef.current = false;
              console.log('Quagga durduruldu');
            } catch (e) {
              console.error('Quagga durdurma hatası:', e);
            }
            
            // Barkod değerini gönder ve input'a yaz
            onScan(barcode);
            writeToInputAndPressEnter(barcode);
            onScanComplete();
            
            setTimeout(() => {
              if (isScanning && scanMode === 'barcode') {
                startBarcodeScanner();
              }
            }, 1000);
          }
        }
      });
      
      Quagga.start();
    });
  };
  
  // Tarama moduna göre uygun tarama fonksiyonunu çağır
  const scanBarcode = () => {
    if (scanMode === 'qr') {
      scanQRCode();
    }
  };

  // Kamera durdurma fonksiyonu
  const stopCamera = () => {
    // Video akışını durdur
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    
    // Stream'i durdur
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Quagga'yı durdur
    if (quaggaInitializedRef.current) {
      try {
        Quagga.stop();
        quaggaInitializedRef.current = false;
        console.log('Quagga durduruldu (stopCamera)');
      } catch (e) {
        console.log('Quagga durdurma hatası:', e);
      }
    }
    
    setCameraFocused(false);
    setIsProcessing(false);
  };

  // Kamera başlatma fonksiyonu
  const startCamera = async () => {
    try {
      if (!isScanning) return { videoStream: null, scanInterval: undefined };
      
      // Tarama moduna göre farklı işlem yap
      if (scanMode === 'barcode') {
        console.log('Barkod tarama modu başlatılıyor...');
        startBarcodeScanner();
        return { videoStream: null, scanInterval: undefined };
      }
      
      // QR kod modu için getUserMedia kullan
      console.log('QR kod tarama modu başlatılıyor...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Bu tarayıcı kamera erişimini desteklemiyor');
        setHasCamera(false);
        return { videoStream: null, scanInterval: undefined };
      }
      
      // Kamera erişimi iste - 10-13 cm mesafe için optimize edilmiş
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          advanced: [
            {
              focusMode: 'continuous'
            }
          ]
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);
      let videoStream = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.play();
        
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

  // Kaynakları temizleme fonksiyonu
  const cleanupResources = () => {
    // Video akışını durdur
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    
    // Stream'i durdur
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Quagga'yı durdur
    if (quaggaInitializedRef.current) {
      try {
        Quagga.stop();
        quaggaInitializedRef.current = false;
        console.log('Quagga durduruldu (cleanupResources)');
      } catch (e) {
        console.log('Quagga durdurma hatası:', e);
      }
    }
    
    // lastDetectedRef'i sıfırla
    lastDetectedRef.current = {barcode: '', timestamp: 0};
  };
  
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
  
  // Kamera ve tarama işlemlerini başlat/durdur
  useEffect(() => {
    let videoStream: MediaStream | null = null;
    let scanInterval: NodeJS.Timeout | undefined;
    let mounted = true; // Bileşenin hala mount edilmiş olup olmadığını takip et

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
      
      
      {/* Başarılı tarama göstergesi */}
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