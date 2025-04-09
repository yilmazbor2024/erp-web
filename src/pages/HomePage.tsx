import React from 'react';
import { Card, Row, Col, Button } from 'antd';
import { 
  ShoppingCartOutlined, 
  ShoppingOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Yeni Sipariş',
      icon: <ShoppingCartOutlined style={{ fontSize: '24px' }} />,
      onClick: () => navigate('/siparisler/new')
    },
    {
      title: 'Ürünler',
      icon: <ShoppingOutlined style={{ fontSize: '24px' }} />,
      onClick: () => navigate('/urunler')
    }
  ];

  const recentActivities = [
    {
      title: 'Sipariş #1234',
      description: '2 saat önce oluşturuldu',
      icon: <ShoppingCartOutlined />
    },
    {
      title: 'Ürün Güncelleme',
      description: '5 ürün güncellendi',
      icon: <HistoryOutlined />
    }
  ];

  return (
    <div className="space-y-4">
      <Card title="Hızlı İşlemler">
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={12} key={index}>
              <Button 
                type="text" 
                icon={action.icon}
                onClick={action.onClick}
                className="w-full h-24 flex flex-col items-center justify-center space-y-2"
              >
                <span>{action.title}</span>
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="Son Aktiviteler">
        {recentActivities.map((activity, index) => (
          <div key={index} className="flex items-center p-3 hover:bg-gray-50 rounded">
            {React.cloneElement(activity.icon, { 
              style: { fontSize: '20px', marginRight: '12px' } 
            })}
            <div>
              <div className="font-medium">{activity.title}</div>
              <div className="text-sm text-gray-500">{activity.description}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default HomePage;
