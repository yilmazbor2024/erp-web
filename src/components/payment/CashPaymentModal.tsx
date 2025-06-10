import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import CashPaymentForm from './CashPaymentForm';

interface CashPaymentModalProps {
  invoiceHeaderID: string;
  invoiceNumber: string;
  invoiceAmount: number;
  currencyCode: string;
  currAccCode: string;
  currAccTypeCode: string;
  officeCode: string;
  onSuccess?: (response: any) => void;
  buttonText?: string;
  buttonType?: "primary" | "default" | "dashed" | "link" | "text";
  buttonSize?: "large" | "middle" | "small";
  isVisible?: boolean;
  onClose?: () => void;
}

// Global modal instance - React dışında modal kontrolü için
let globalModalInstance: any = null;
let globalModalProps: any = {};

// Global fonksiyon - doğrudan modalı açmak için
export const openCashPaymentModal = (props: any) => {
  console.log('openCashPaymentModal çağrıldı:', props);
  if (globalModalInstance) {
    globalModalProps = props;
    globalModalInstance.openModal(props);
    return true;
  }
  console.log('Modal instance bulunamadı!');
  return false;
};

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
    buttonSize = "middle",
    isVisible,
    onClose
  } = props;
  
  // Modal görünürlüğü için state
  const [modalVisible, setModalVisible] = useState(false);
  const [formProps, setFormProps] = useState(props);
  
  // Global instance'a referansı kaydet
  const modalRef = useRef<any>(null);
  
  // Component mount olduğunda global instance'a kaydet
  useEffect(() => {
    console.log('CashPaymentModal mount oldu, global instance kaydediliyor');
    globalModalInstance = {
      openModal: (newProps: any) => {
        console.log('openModal çağrıldı:', newProps);
        setFormProps({ ...props, ...newProps });
        setModalVisible(true);
      }
    };
    
    // Component unmount olduğunda temizle
    return () => {
      globalModalInstance = null;
    };
  }, []);
  
  // isVisible prop'u değiştiğinde
  useEffect(() => {
    console.log('isVisible değişti:', isVisible);
    if (isVisible !== undefined) {
      setModalVisible(isVisible);
    }
  }, [isVisible]);
  
  // Buton tıklandığında modalı göster
  const showModal = () => {
    console.log('showModal çağrıldı');
    setModalVisible(true);
  };

  // Modal kapandığında
  const handleCancel = () => {
    console.log('Modal kapanıyor...');
    setModalVisible(false);
    if (onClose) {
      onClose();
    }
  };

  // Ödeme başarılı olduğunda
  const handleSuccess = (response: any) => {
    console.log('Nakit tahsilat başarılı:', response);
    setModalVisible(false);
    if (onSuccess) {
      onSuccess(response);
    }
  };

  // Buton modu için render (isVisible prop'u yoksa)
  if (isVisible === undefined) {
    return (
      <>
        <Button 
          type={buttonType} 
          icon={<DollarOutlined />} 
          onClick={showModal}
          size={buttonSize}
        >
          {buttonText}
        </Button>
        
        <Modal
          title="Nakit Tahsilat"
          open={modalVisible}
          onCancel={handleCancel}
          width={800}
          footer={null}
          destroyOnClose={true}
          style={{ zIndex: 1050 }}
        >
          {modalVisible && (
            <CashPaymentForm
              invoiceHeaderID={formProps.invoiceHeaderID || ''}
              invoiceNumber={formProps.invoiceNumber || ''}
              invoiceAmount={formProps.invoiceAmount || 0}
              currencyCode={formProps.currencyCode || 'TRY'}
              currAccCode={formProps.currAccCode || ''}
              currAccTypeCode={formProps.currAccTypeCode || ''}
              officeCode={formProps.officeCode || ''}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </Modal>
      </>
    );
  }
  
  // isVisible prop'u ile kontrol edilen mod için render
  return (
    <Modal
      title="Nakit Tahsilat"
      open={modalVisible}
      onCancel={handleCancel}
      width={800}
      footer={null}
      destroyOnClose={true}
      style={{ zIndex: 1050 }}
    >
      {modalVisible && (
        <CashPaymentForm
          invoiceHeaderID={formProps.invoiceHeaderID || ''}
          invoiceNumber={formProps.invoiceNumber || ''}
          invoiceAmount={formProps.invoiceAmount || 0}
          currencyCode={formProps.currencyCode || 'TRY'}
          currAccCode={formProps.currAccCode || ''}
          currAccTypeCode={formProps.currAccTypeCode || ''}
          officeCode={formProps.officeCode || ''}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </Modal>
  );
};

export default CashPaymentModal;
