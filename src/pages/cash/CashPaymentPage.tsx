import React from 'react';
import { Card, message, Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import CashVoucherForm, { CashVoucherType } from '../../components/cash/CashVoucherForm';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const CashPaymentPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (response: any) => {
    message.success('Kasa tediye işlemi başarıyla kaydedildi');
    // İşlem başarılı olduğunda yönlendirme yapabilirsiniz
    // navigate('/cash/list');
  };

  const handleCancel = () => {
    navigate(-1); // Bir önceki sayfaya dön
  };

  return (
    <div>
      <div style={{ marginBottom: 16, padding: '16px 24px', backgroundColor: '#fff' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)} 
            type="text"
          />
          <div>
            <Title level={4} style={{ margin: 0 }}>Kasa Tediye Fişi</Title>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Yeni kasa tediye fişi oluştur</div>
          </div>
        </Space>
      </div>
      <Card>
        <CashVoucherForm 
          voucherType={CashVoucherType.PAYMENT}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
};

export default CashPaymentPage;
