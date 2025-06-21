import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isScanning: boolean;
  onScanComplete: () => void;
  height?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  isScanning, 
  onScanComplete,
  height = '200px' 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Barkod tarama fonksiyonu
  const scanBarcode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    
    setIsProcessing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Video boyutlarını al
    const { videoWidth, videoHeight } = video;
    
    if (videoWidth === 0 || videoHeight === 0) {
      setIsProcessing(false);
      return;
    }
    
    // Canvas boyutlarını ayarla
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Video frame'ini canvas'a çiz
    context.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    // Canvas'tan görüntü verilerini al
    const imageData = context.getImageData(0, 0, videoWidth, videoHeight);
    
    // jsQR ile QR/barkod taraması yap
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    
    if (code) {
      // Barkod bulundu
      console.log('Barkod bulundu:', code.data);
      onScan(code.data);
      
      // Kamerayı kapat ve taramayı durdur
      stopCamera();
      onScanComplete();
    }
    
    setIsProcessing(false);
  };

  // Kamera durdurma fonksiyonu
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Kamera başlatma fonksiyonu - useEffect dışında tanımlandı ki yeniden deneme butonundan çağrılabilsin
  const startCamera = async () => {
    try {
      if (!isScanning) return;
      
      // Kamera erişimini kontrol et
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Bu tarayıcı kamera erişimini desteklemiyor');
        setHasCamera(false);
        return;
      }
      
      // Kamerayı başlat - önce arka kamerayı dene, hata alırsa ön kamerayı dene
      let stream;
      try {
        // Önce arka kamera ile dene
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (backCameraError) {
        console.warn('Arka kamera erişimi başarısız, ön kamera deneniyor:', backCameraError);
        try {
          // Arka kamera başarısız olursa ön kamera ile dene
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        } catch (frontCameraError) {
          console.error('Ön kamera erişimi de başarısız:', frontCameraError);
          throw frontCameraError; // Yeniden fırlat
        }
      }
      
      let videoStream = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => {
          console.error('Video oynatma hatası:', e);
          throw e;
        });
      }
      
      setHasCamera(true);
      
      // Barkod tarama işlemini başlat
      const scanInterval = setInterval(() => {
        if (!isProcessing) {
          scanBarcode();
        }
      }, 500); // Her 500ms'de bir tarama yap
      
      return { videoStream, scanInterval };
      
    } catch (error) {
      console.error('Kamera erişim hatası:', error);
      setHasCamera(false);
      return { videoStream: null, scanInterval: undefined };
    }
  };

  useEffect(() => {
    let videoStream: MediaStream | null = null;
    let animationFrameId: number = 0;
    let scanInterval: NodeJS.Timeout;

    // useEffect içindeki stopCamera - global stopCamera'dan farklı olarak interval ve animation frame'i de temizler
    const cleanupResources = () => {
      stopCamera();
      
      if (scanInterval) {
        clearInterval(scanInterval);
      }
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    if (isScanning) {
      startCamera().then(result => {
        if (result) {
          videoStream = result.videoStream;
          if (result.scanInterval) scanInterval = result.scanInterval;
        }
      });
    }

    return () => {
      cleanupResources();
    };
  }, [isScanning, onScan, onScanComplete]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: height,
      overflow: 'hidden',
      backgroundColor: '#000',
      borderRadius: '4px'
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
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'none',
          position: 'absolute',
          top: 0,
          left: 0
        }} 
      />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        height: '40%',
        border: '2px solid #fff',
        borderRadius: '10px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        zIndex: 10
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#fff',
        fontSize: '14px'
      }}>
        Barkodu çerçeve içine yerleştirin
      </div>
    </div>
  );
};

export default BarcodeScanner;
