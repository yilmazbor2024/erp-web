import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, Space, Button, message, Grid, Row, Col } from 'antd';
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
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint'inden küçükse mobil olarak kabul et
  
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
    // Not: Başarı mesajı InvoiceForm bileşeninde gösteriliyor
    navigate('/invoices');
  };
  
  // Listeye geri dön
  const goBackToList = () => {
    navigate('/invoices');
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {isMobile ? (
          // Mobil görünüm - Tek başlık ortada, geri butonu sol üstte
          <>
            <div style={{ textAlign: 'center', position: 'relative', marginBottom: 16 }}>
              <div style={{ position: 'absolute', left: 0, top: 0 }}>
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={goBackToList}
                  style={{ padding: '4px 8px' }}
                />
              </div>
              <Title level={4} style={{ margin: 0, padding: '8px 0' }}>
                Fatura Oluşturma Formu
              </Title>
            </div>
          </>
        ) : (
          // Masaüstü görünüm
          <Row justify="space-between" align="middle">
            <Col span={4}>
              <Button icon={<ArrowLeftOutlined />} onClick={goBackToList}>
                Listeye Dön
              </Button>
            </Col>
            <Col span={16} style={{ textAlign: 'center' }}>
              <Title level={4}>{invoiceTypeDescriptions[invoiceType]} Oluştur</Title>
            </Col>
            <Col span={4}></Col>
          </Row>
        )}
        
        <InvoiceForm type={invoiceType} onSuccess={handleCreateSuccess} />
      </Space>
    </Card>
  );
};

export default InvoiceCreatePage;
