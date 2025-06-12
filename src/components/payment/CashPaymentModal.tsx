import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import CashPaymentForm from './CashPaymentForm';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../../contexts/AuthContext';

// Modal için root element ve root instance
let modalRoot: HTMLElement | null = null;
let rootInstance: any = null;

// CashPaymentModal Props
interface CashPaymentModalProps {
  invoiceHeaderID: string;
  invoiceNumber: string;
  invoiceAmount: number;       // Genel Toplam
  invoiceAmountTRY?: number;   // TL Karşılığı
  exchangeRate?: number;       // Döviz Kuru
  currencyCode: string;
  currAccCode: string;
  currAccTypeCode: string;
  officeCode: string;
  onSuccess?: (response: any) => void;
  buttonText?: string;
  buttonType?: "primary" | "default" | "dashed" | "link" | "text";
  buttonSize?: "large" | "middle" | "small";
}

// Document hazır olduğunda modal root oluştur
if (typeof document !== 'undefined') {
  modalRoot = document.getElementById('cash-payment-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'cash-payment-modal-root';
    // modalRoot'u doğru şekilde ayarlıyoruz
    modalRoot.style.position = 'fixed';
    modalRoot.style.top = '0';
    modalRoot.style.left = '0';
    modalRoot.style.width = '100%';
    modalRoot.style.height = '100%';
    modalRoot.style.zIndex = '-1'; // Başlangıçta görünmez olması için z-index'i düşük ayarla
    modalRoot.style.pointerEvents = 'none'; // Tıklama olaylarını devre dışı bırak
    modalRoot.style.display = 'none'; // Başlangıçta gizle
    document.body.appendChild(modalRoot);
    console.log('Modal root oluşturuldu ve gizlendi');
  }
  
  // Sayfa kapatıldığında veya yenilendiğinde temizlik yap
  window.addEventListener('beforeunload', () => {
    if (rootInstance) {
      try {
        rootInstance.render(<></>);
      } catch (error) {
        console.error('Modal unmount hatası:', error);
      }
    }
  });
}

// Bağımsız modal bileşeni
const StandaloneModal: React.FC<any> = (props) => {
  const [visible, setVisible] = useState(true);
  
  const handleClose = () => {
    setVisible(false);
    if (props.onCancel) {
      props.onCancel();
    }
  };
  
  const handleSuccess = (response: any) => {
    setVisible(false);
    if (props.onSuccess) {
      props.onSuccess(response);
    }
  };
  
  return (
    <Modal
      title="Nakit Tahsilat"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose={false}
      maskClosable={false}
      keyboard={false}
      zIndex={1050}
      style={{ top: 20 }}
    >
      <CashPaymentForm
        invoiceHeaderID={props.id || props.invoiceHeaderID || ''}
        invoiceNumber={props.invoiceNumber || ''}
        invoiceAmount={props.amount || props.invoiceAmount || 0}
        invoiceAmountTRY={props.invoiceAmountTRY}
        exchangeRate={props.exchangeRate}
        currencyCode={props.currencyCode || 'TRY'}
        currAccCode={props.currAccCode || ''}
        currAccTypeCode={props.currAccTypeCode || ''}
        officeCode={props.officeCode || ''}
        onSuccess={handleSuccess}
        onCancel={handleClose}
      />
    </Modal>
  );
};

// Modal için unmount fonksiyonu - temizlik için kullanılır
function unmountModalRoot() {
  if (rootInstance) {
    try {
      rootInstance.render(<></>);
      console.log('Modal unmount edildi');
    } catch (error) {
      console.error('Modal unmount hatası:', error);
    }
  }
}

// Doğrudan modal render fonksiyonu
function renderStandaloneModal(props: any) {
  if (modalRoot) {
    try {
      // Eğer önceden bir root instance oluşturulmuşsa onu kullan
      if (!rootInstance) {
        // React 18 createRoot API'si ile yeni bir root instance oluştur
        rootInstance = createRoot(modalRoot);
        console.log('Yeni root instance oluşturuldu');
      }
      
      // Modal içeriğini render et
      rootInstance.render(
        <AuthProvider>
          <StandaloneModal {...props} />
        </AuthProvider>
      );
      
      console.log('Modal başarıyla render edildi');
    } catch (error) {
      console.error('Modal render hatası:', error);
      
      // Hata durumunda root instance'i sıfırla ve yeniden dene
      try {
        if (rootInstance) {
          rootInstance.render(<></>);
        }
        rootInstance = createRoot(modalRoot);
        rootInstance.render(
          <AuthProvider>
            <StandaloneModal {...props} />
          </AuthProvider>
        );
        console.log('Modal hata sonrası yeniden render edildi');
      } catch (retryError) {
        console.error('Modal yeniden render hatası:', retryError);
      }
    }
  } else {
    console.error('modalRoot bulunamadı');
  }
}

// Global modal API
export const CashPaymentModalAPI = {
  open: (props: any) => {
    console.log('CashPaymentModalAPI.open çağrıldı', props);
    
    // Modal root elementini görünür yap ve etkileşimi etkinleştir
    if (modalRoot) {
      modalRoot.style.display = 'block';
      modalRoot.style.pointerEvents = 'auto';
      modalRoot.style.zIndex = '1050';
      console.log('Modal görünür yapıldı ve etkileşim etkinleştirildi');
    }
    
    // Modal'i açmak için event yayınla
    if (typeof document !== 'undefined') {
      const event = new CustomEvent('cash-payment-modal-update', { 
        detail: { visible: true, props } 
      });
      document.dispatchEvent(event);
      console.log('cash-payment-modal-update eventi yayınlandı (aç)');
    }
    
    // Modal'i render et
    renderStandaloneModal(props);
    
    return true;
  },
  
  close: () => {
    console.log('CashPaymentModalAPI.close çağrıldı');
    
    // Modal'i temizle - createRoot API'si ile uyumlu şekilde
    if (rootInstance) {
      try {
        // React 18 ile null yerine boş bir fragment render etmek daha güvenli
        rootInstance.render(<></>);
        
        // Temizlik için bir timeout kullan
        setTimeout(() => {
          try {
            // Modal root elementini gizle
            if (modalRoot) {
              modalRoot.style.display = 'none';
              modalRoot.style.pointerEvents = 'none';
              modalRoot.style.zIndex = '-1';
              
              // Ek olarak, body'deki tüm antd modal masklarını temizle
              const masks = document.querySelectorAll('.ant-modal-mask');
              masks.forEach(mask => {
                (mask as HTMLElement).style.display = 'none';
              });
              
              // Ant Design'ın modal-root elementlerini de kontrol et
              const antdRoots = document.querySelectorAll('.ant-modal-root');
              antdRoots.forEach(root => {
                (root as HTMLElement).style.display = 'none';
              });
              
              console.log('Modal tamamen temizlendi ve gizlendi');
            }
          } catch (error) {
            console.error('Modal temizleme hatası:', error);
          }
        }, 100);
        
        console.log('Modal temizlendi');
      } catch (error) {
        console.error('Modal render hatası:', error);
      }
    }
    
    // Modal'i kapatmak için event yayınla
    if (typeof document !== 'undefined') {
      const event = new CustomEvent('cash-payment-modal-update', { 
        detail: { visible: false } 
      });
      document.dispatchEvent(event);
      console.log('cash-payment-modal-update eventi yayınlandı (kapat)');
    }
    
    return true;
  },
  
  isVisible: () => false,
  getProps: () => ({})
};

// Normal CashPaymentModal bileşeni - artık sadece buton göstermek için kullanılıyor
const CashPaymentModal: React.FC<CashPaymentModalProps> = (props) => {
  const {
    invoiceHeaderID,
    invoiceNumber,
    invoiceAmount,
    currencyCode,
    currAccCode,
    currAccTypeCode,
    officeCode,
    onSuccess,
    buttonText = "Nakit Tahsilat",
    buttonType = "primary",
    buttonSize = "middle"
  } = props;

  // Buton tıklandığında modalı göster
  const showModal = () => {
    console.log('showModal çağrıldı');
    
    // Global API ile modalı aç
    CashPaymentModalAPI.open({
      id: invoiceHeaderID,
      invoiceNumber,
      amount: invoiceAmount,
      currencyCode,
      currAccCode,
      currAccTypeCode,
      officeCode,
      onSuccess,
      onCancel: () => {}
    });
  };

  // Sadece buton render et
  return (
    <Button
      type={buttonType}
      icon={<DollarOutlined />}
      size={buttonSize}
      onClick={showModal}
    >
      {buttonText}
    </Button>
  );
};

// Global fonksiyonları window nesnesine ekle
if (typeof window !== 'undefined') {
  (window as any).openCashPaymentModal = CashPaymentModalAPI.open;
  (window as any).closeCashPaymentModal = CashPaymentModalAPI.close;
}

export default CashPaymentModal;
