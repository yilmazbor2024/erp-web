import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import CashPaymentForm from './CashPaymentForm';

interface CashPaymentModalProps {
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  currencyCode: string;
  currAccCode: string;
  currAccTypeCode: string;
  officeCode: string;
  storeCode?: string;
  onSuccess?: (response: any) => void;
  buttonText?: string;
  buttonType?: "primary" | "default" | "dashed" | "link" | "text";
  buttonSize?: "large" | "middle" | "small";
  isVisible?: boolean;
  onClose?: () => void;
}

const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
  invoiceId,
  invoiceNumber,
  invoiceAmount,
  currencyCode,
  currAccCode,
  currAccTypeCode,
  officeCode,
  storeCode,
  onSuccess,
  buttonText = "Nakit Tahsilat",
  buttonType = "primary",
  buttonSize = "middle",
  isVisible,
  onClose
}) => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(isVisible || false);
  
  // isVisible prop değiştiğinde modal durumunu güncelle
  useEffect(() => {
    if (isVisible !== undefined && isVisible !== isModalVisible) {
      setIsModalVisible(isVisible);
    }
  }, [isVisible, isModalVisible]);

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
    if (onSuccess) {
      onSuccess(response);
    } else {
      setIsModalVisible(false);
    }
  };

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
        open={isModalVisible}
        onCancel={handleCancel}
        width={800}
        footer={null}
        destroyOnClose={true}
      >
        <CashPaymentForm
          invoiceId={invoiceId}
          invoiceNumber={invoiceNumber}
          invoiceAmount={invoiceAmount}
          currencyCode={currencyCode}
          currAccCode={currAccCode}
          currAccTypeCode={currAccTypeCode}
          officeCode={officeCode}
          storeCode={storeCode}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Modal>
    </>
  );
};

export default CashPaymentModal;
