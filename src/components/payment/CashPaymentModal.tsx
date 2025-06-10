import React, { useState, useEffect } from 'react';
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

const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
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
}) => {
  // Buton modu için local state
  const [buttonModalVisible, setButtonModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Debug için her render'da log ekleyelim
  console.log('CashPaymentModal RENDER - isVisible:', isVisible, 'invoiceHeaderID:', invoiceHeaderID, 'modalVisible:', modalVisible);
  
  // isVisible prop'u değiştiğinde modalVisible state'ini güncelle
  useEffect(() => {
    console.log('CashPaymentModal useEffect - isVisible değişti:', isVisible);
    if (isVisible !== undefined) {
      setModalVisible(isVisible);
    }
  }, [isVisible]);
  
  // Buton tıklandığında modalı göster (sadece buton modu için)
  const showModal = () => {
    setButtonModalVisible(true);
  };

  // Modal kapandığında
  const handleCancel = () => {
    console.log('Modal kapanıyor...');
    // Buton modu için
    if (isVisible === undefined) {
      setButtonModalVisible(false);
    } 
    // isVisible prop'u ile kontrol edilen mod için
    else {
      setModalVisible(false);
      if (onClose) {
        onClose();
      }
    }
  };

  // Ödeme başarılı olduğunda
  const handleSuccess = (response: any) => {
    console.log('Nakit tahsilat başarılı:', response);
    
    // Buton modu için
    if (isVisible === undefined) {
      setButtonModalVisible(false);
    } else {
      setModalVisible(false);
    }
    
    // Eğer onSuccess callback'i varsa çağır
    if (onSuccess) {
      onSuccess(response);
    }
  };

  // Buton modu için render
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
          open={buttonModalVisible}
          onCancel={handleCancel}
          width={800}
          footer={null}
          destroyOnClose={true}
        >
          {buttonModalVisible && (
            <CashPaymentForm
              invoiceHeaderID={invoiceHeaderID}
              invoiceNumber={invoiceNumber}
              invoiceAmount={invoiceAmount}
              currencyCode={currencyCode}
              currAccCode={currAccCode}
              currAccTypeCode={currAccTypeCode}
              officeCode={officeCode}
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
    >
      {modalVisible && (
        <CashPaymentForm
          invoiceHeaderID={invoiceHeaderID}
          invoiceNumber={invoiceNumber}
          invoiceAmount={invoiceAmount}
          currencyCode={currencyCode}
          currAccCode={currAccCode}
          currAccTypeCode={currAccTypeCode}
          officeCode={officeCode}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </Modal>
  );
};

export default CashPaymentModal;
