import React, { useState } from 'react';
import { Card, Tabs, Typography, message, Button, Space, Divider } from 'antd';
import { FileAddOutlined, FileSearchOutlined, FileTextOutlined } from '@ant-design/icons';
import InvoiceForm from '../../components/invoice/InvoiceForm';
import InvoiceListPage from './InvoiceListPage';

const { Title } = Typography;
const { TabPane } = Tabs;

// Fatura tipi enum
enum InvoiceType {
  WHOLESALE_SALES = 'WS',
  WHOLESALE_PURCHASE = 'BP',
  EXPENSE_SALES = 'EXP',
  EXPENSE_PURCHASE = 'EP'
}

const InvoiceTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1');

  // Fatura oluşturma başarılı
  const handleCreateSuccess = (data: any) => {
    message.success('Fatura başarıyla oluşturuldu.');
    setActiveTab('3'); // Fatura listesi tabına geç
  };

  return (
    <Card>
      <Title level={3}>Fatura İşlemleri Test Sayfası</Title>
      <Divider />
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <FileAddOutlined />
              Toptan Satış Faturası
            </span>
          } 
          key="1"
        >
          <InvoiceForm type={InvoiceType.WHOLESALE_SALES} onSuccess={handleCreateSuccess} />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <FileAddOutlined />
              Toptan Alış Faturası
            </span>
          } 
          key="2"
        >
          <InvoiceForm type={InvoiceType.WHOLESALE_PURCHASE} onSuccess={handleCreateSuccess} />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <FileSearchOutlined />
              Fatura Listesi
            </span>
          } 
          key="3"
        >
          <InvoiceListPage />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <FileAddOutlined />
              Masraf Faturası
            </span>
          } 
          key="4"
        >
          <InvoiceForm type={InvoiceType.EXPENSE_PURCHASE} onSuccess={handleCreateSuccess} />
        </TabPane>
      </Tabs>
      
      <Divider />
      
      <Space>
        <Button 
          type="primary" 
          icon={<FileAddOutlined />} 
          onClick={() => setActiveTab('1')}
        >
          Toptan Satış Faturası Oluştur
        </Button>
        
        <Button 
          type="primary" 
          icon={<FileAddOutlined />} 
          onClick={() => setActiveTab('2')}
        >
          Toptan Alış Faturası Oluştur
        </Button>
        
        <Button 
          type="primary" 
          icon={<FileAddOutlined />} 
          onClick={() => setActiveTab('4')}
        >
          Masraf Faturası Oluştur
        </Button>
        
        <Button 
          icon={<FileSearchOutlined />} 
          onClick={() => setActiveTab('3')}
        >
          Fatura Listesini Görüntüle
        </Button>
      </Space>
    </Card>
  );
};

export default InvoiceTestPage;
