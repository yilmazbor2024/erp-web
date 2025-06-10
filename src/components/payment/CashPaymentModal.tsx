import React, { useState } from 'react';
import { Modal, Button, message } from 'antd';
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
  
  // Debug için her render'da log ekleyelim
  console.log('CashPaymentModal RENDER - isVisible:', isVisible, 'invoiceHeaderID:', invoiceHeaderID);
  
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
    else if (onClose) {
      onClose();
    }
  };

  // Ödeme başarılı olduğunda
  const handleSuccess = (response: any) => {
    console.log('Nakit tahsilat başarılı:', response);
    
    // Buton modu için
    if (isVisible === undefined) {
      setButtonModalVisible(false);
    }
    
    // Eğer onSuccess callback'i varsa çağır
    if (onSuccess) {
      onSuccess(response);
    }
  };

  // İki farklı render modu: isVisible prop'u varsa sadece modal göster, yoksa buton + modal göster
  return (
    <>
      {/* isVisible prop'u yoksa buton göster */}
      {isVisible === undefined && (
        <>
          <Button 
            type={buttonType} 
            icon={<DollarOutlined />} 
            onClick={showModal}
            size={buttonSize}
          >
            {buttonText}
          </Button>
          
          {/* Buton modu için modal */}
          <Modal
            title="Nakit Tahsilat"
            open={buttonModalVisible}
            onCancel={handleCancel}
            width={800}
            footer={null}
            destroyOnClose={true}
          >
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
          </Modal>
        </>
      )}
      
      {/* isVisible prop'u varsa sadece modal göster */}
      {isVisible !== undefined && (
        <Modal
          title="Nakit Tahsilat"
          open={isVisible === true}
          onCancel={handleCancel}
          width={800}
          footer={null}
          destroyOnClose={true}
        >
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
        </Modal>
      )}
    </>
  );
};

export default CashPaymentModal;
