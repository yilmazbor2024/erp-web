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
  const [isModalVisible, setIsModalVisible] = useState<boolean>(isVisible || false);
  
  // Component mount olduğunda ve isVisible prop değiştiğinde çalışacak
  useEffect(() => {
    console.log('CashPaymentModal useEffect çalıştı, isVisible:', isVisible, 'invoiceHeaderID:', invoiceHeaderID);
    
    // isVisible true ise modalı aç
    if (isVisible === true) {
      console.log('Modal açılıyor, isVisible:', isVisible, 'invoiceHeaderID:', invoiceHeaderID);
      setIsModalVisible(true);
    } else {
      console.log('Modal kapalı kalıyor, isVisible:', isVisible);
      setIsModalVisible(false);
    }
  }, [isVisible, invoiceHeaderID]); // isVisible veya invoiceHeaderID değiştiğinde tetikle

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      setIsModalVisible(false);
    }
  };

  const handleSuccess = (response: any) => {
    console.log('CashPaymentModal: handleSuccess çağrıldı');
    
    // Modalı kapat (timeout ile garantiye al)
    setIsModalVisible(false);
    
    // Eğer onSuccess callback'i varsa çağır
    if (onSuccess) {
      // Kısa bir gecikme ile callback'i çağır
      setTimeout(() => {
        onSuccess(response);
      }, 100);
    }
  };

  // İki farklı render modu: isVisible prop'u varsa sadece modal göster, yoksa buton + modal göster
  return (
    <>
      {/* isVisible prop'u yoksa buton göster */}
      {isVisible === undefined && (
        <Button 
          type={buttonType} 
          icon={<DollarOutlined />} 
          onClick={showModal}
          size={buttonSize}
        >
          {buttonText}
        </Button>
      )}
      
      {/* Modal her durumda render edilir, ancak görünürlüğü isModalVisible ile kontrol edilir */}
      <Modal
        title="Nakit Tahsilat"
        open={isModalVisible}
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
  );
};

export default CashPaymentModal;
