import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic } from 'antd';
import { 
  BankOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  TeamOutlined,
  CarOutlined,
  InboxOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

interface DashboardCard {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
  link: string;
}

const dashboardCards: DashboardCard[] = [
  {
    title: 'Fatura',
    value: '12',
    icon: <FileTextOutlined style={{ fontSize: '24px' }} />,
    color: '#1890ff',
    link: '/invoices',
  },
  {
    title: 'Müşteriler',
    value: '156',
    icon: <TeamOutlined style={{ fontSize: '24px' }} />,
    color: '#52c41a',
    link: '/customers',
  },
  {
    title: 'Tedarikçiler',
    value: '45',
    icon: <CarOutlined style={{ fontSize: '24px' }} />,
    color: '#722ed1',
    link: '/suppliers',
  },
  {
    title: 'Kasa',
    value: '₺25.350,00',
    icon: <BankOutlined style={{ fontSize: '24px' }} />,
    color: '#faad14',
    link: '/cashier',
  },
  {
    title: 'Ürünler',
    value: '234',
    icon: <ShoppingOutlined style={{ fontSize: '24px' }} />,
    color: '#eb2f96',
    link: '/products',
  },
  {
    title: 'Malzemeler',
    value: '189',
    icon: <InboxOutlined style={{ fontSize: '24px' }} />,
    color: '#13c2c2',
    link: '/materials',
  },
  {
    title: 'Stoklar',
    value: '567',
    icon: <DatabaseOutlined style={{ fontSize: '24px' }} />,
    color: '#fa541c',
    link: '/inventory',
  }
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <Row gutter={[16, 16]}>
        {dashboardCards.map((card) => (
          <Col xs={24} sm={12} md={8} lg={6} key={card.link}>
            <Card
              hoverable
              onClick={() => navigate(card.link)}
              style={{ borderTop: `2px solid ${card.color}` }}
              className="h-full"
            >
              <Statistic
                title={
                  <div className="flex items-center gap-2">
                    {card.icon}
                    <span>{card.title}</span>
                  </div>
                }
                value={card.value}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;
