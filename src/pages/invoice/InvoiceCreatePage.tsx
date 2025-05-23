import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, Space, Button, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import InvoiceForm from '../../components/invoice/InvoiceForm';
import { InvoiceType } from '../../types/invoice';

const { Title } = Typography;
const { Option } = Select;

const invoiceTypeDescriptions = {
  [InvoiceType.WHOLESALE_SALES]: 'Toptan Satış Faturası',
  [InvoiceType.WHOLESALE_PURCHASE]: 'Toptan Alış Faturası',
  [InvoiceType.EXPENSE_SALES]: 'Masraf Satış Faturası',
  [InvoiceType.EXPENSE_PURCHASE]: 'Masraf Alış Faturası'
};

type InvoiceCreateParams = {
  type?: string;
};

const InvoiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { type } = useParams<InvoiceCreateParams>();
  
  // URL'den gelen fatura tipini belirle, varsayılan olarak toptan satış
  const getInvoiceType = (): InvoiceType => {
    switch (type) {
      case 'wholesale-purchase':
        return InvoiceType.WHOLESALE_PURCHASE;
      case 'expense':
        return InvoiceType.EXPENSE_PURCHASE;
      default:
        return InvoiceType.WHOLESALE_SALES;
    }
  };
  
  const invoiceType = getInvoiceType();
  
  // Form yüklenince form adını konsola yazdır
  useEffect(() => {
    const formTitle = invoiceTypeDescriptions[invoiceType] + ' Oluştur';
    console.log('Form Adı:', formTitle);
  }, [invoiceType]);
  
  // Fatura oluşturma başarılı
  const handleCreateSuccess = () => {
    // Başarılı oluşturma sonrası fatura listesine yönlendir
    message.success('Fatura başarıyla oluşturuldu');
    navigate('/invoices');
  };
  
  // Listeye geri dön
  const goBackToList = () => {
    navigate('/invoices');
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={goBackToList}>
            Listeye Dön
          </Button>
          <Title level={4}>{invoiceTypeDescriptions[invoiceType]} Oluştur</Title>
          <div style={{ width: 100 }}></div> {/* Boşluk için */}
        </div>
        
        <InvoiceForm type={invoiceType} onSuccess={handleCreateSuccess} />
      </Space>
    </Card>
  );
};

export default InvoiceCreatePage;
