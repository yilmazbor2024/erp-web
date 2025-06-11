import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import CashPaymentForm from './CashPaymentForm';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../../contexts/AuthContext';

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

// Modal için root element
let modalRoot: HTMLElement | null = null;

// Document hazır olduğunda modal root oluştur
if (typeof document !== 'undefined') {
  modalRoot = document.getElementById('cash-payment-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'cash-payment-modal-root';
    // modalRoot'u tüm ekranı kaplamayacak şekilde ayarlıyoruz
    modalRoot.style.position = 'absolute'; // fixed yerine absolute kullanıyoruz
    modalRoot.style.zIndex = '1000'; // z-index değerini düşürüyoruz
    modalRoot.style.pointerEvents = 'none'; // Tıklama olaylarını arkaya geçirir
    document.body.appendChild(modalRoot);
    console.log('Modal root oluşturuldu');
  }
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

// Modal root için referans tutacak değişken
let rootInstance: any = null;

// Doğrudan modal render fonksiyonu
function renderStandaloneModal(props: any) {
  if (modalRoot) {
    // Eğer önceden bir root instance oluşturulmuşsa onu kullan
    if (!rootInstance) {
      rootInstance = createRoot(modalRoot);
    }
    
    rootInstance.render(
      <AuthProvider>
        <StandaloneModal {...props} />
      </AuthProvider>
    );
  }
}

// Global modal API
export const CashPaymentModalAPI = {
  open: (props: any) => {
    console.log('CashPaymentModalAPI.open çağrıldı:', props);
    
    // Modal'i doğrudan render et
    renderStandaloneModal(props);
    
    // Modal'i açmak için event yayınla
    if (typeof document !== 'undefined') {
      const event = new CustomEvent('cash-payment-modal-update', { 
        detail: { visible: true, props } 
      });
      document.dispatchEvent(event);
      console.log('cash-payment-modal-update eventi yayınlandı');
    }
    
    return true;
  },
  
  close: () => {
    console.log('CashPaymentModalAPI.close çağrıldı');
    
    // Modal'i temizle
    if (modalRoot) {
      ReactDOM.unmountComponentAtNode(modalRoot);
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
