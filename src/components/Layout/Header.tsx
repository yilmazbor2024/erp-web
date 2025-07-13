import React, { useState, useEffect } from 'react';
import { Layout, Button, Dropdown, MenuProps, Tooltip, Badge, Space } from 'antd';
import { UserOutlined, LogoutOutlined, LaptopOutlined, MobileOutlined, DatabaseOutlined, DollarOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import useViewModeStore from '../../stores/viewModeStore';
import { useAuth } from '../../contexts/AuthContext';
import tcmbExchangeRateApi from '../../services/tcmbExchangeRateApi';

interface HeaderProps {
  title?: string;
}

const { Header: AntHeader } = Layout;

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useViewModeStore();
  const navigate = useNavigate();
  
  // Veritabanı bilgisi ve bağlantı süresi için state'ler
  const [databaseInfo, setDatabaseInfo] = useState<{ name: string; company: string } | null>(null);
  const [connectionTime, setConnectionTime] = useState<number>(0);
  
  // Döviz kurları için state
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loadingRates, setLoadingRates] = useState<boolean>(true);
  
  // Veritabanı bilgilerini ve bağlantı süresini getir
  useEffect(() => {
    // localStorage'dan seçilen veritabanı bilgisini al
    const dbName = localStorage.getItem('selectedDatabaseName');
    const companyName = localStorage.getItem('selectedCompanyName');
    const loginTime = localStorage.getItem('loginTime');
    
    if (dbName && companyName) {
      setDatabaseInfo({
        name: dbName,
        company: companyName
      });
    }
    
    // Bağlantı süresini hesapla ve her dakika güncelle
    if (loginTime) {
      const updateConnectionTime = () => {
        const loginTimeMs = parseInt(loginTime);
        const currentTime = Date.now();
        const diffMinutes = Math.floor((currentTime - loginTimeMs) / (1000 * 60));
        setConnectionTime(diffMinutes);
      };
      
      updateConnectionTime();
      const timer = setInterval(updateConnectionTime, 60000); // Her dakika güncelle
      
      return () => clearInterval(timer);
    }
  }, []);
  
  // Döviz kurlarını getir
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoadingRates(true);
        const rates = await tcmbExchangeRateApi.getAllExchangeRates();
        setExchangeRates(rates);
      } catch (error) {
        console.error('Döviz kurları alınırken hata oluştu:', error);
        // Hata durumunda varsayılan kurları kullan
        setExchangeRates({
          'USD': 39.81,
          'EUR': 46.88,
          'GBP': 54.47
        });
      } finally {
        setLoadingRates(false);
      }
    };
    
    fetchExchangeRates();
    
    // Her saat başı kurları güncelle
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Profil</Link>
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      onClick: handleLogout
    }
  ];

  // Döviz kurlarını gösteren bileşen
  const renderExchangeRates = () => {
    const currencies = ['USD', 'EUR', 'GBP'];
    
    if (loadingRates) {
      return null;
    }
    
    // Mobil görünüm için mode kontrolü
    const isMobile = mode === 'mobile';
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        padding: isMobile ? '4px 8px' : '6px 12px',
        background: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        marginRight: '12px'
      }}>
        {currencies.map((currency, index) => {
          const rate = exchangeRates[currency] || 0;
          return (
            <React.Fragment key={currency}>
              {!isMobile && index > 0 && <div style={{ margin: '0 8px', color: '#e0e0e0' }}>|</div>}
              <Tooltip title={`1 ${currency} = ${rate.toFixed(4)} TL`}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: isMobile ? '6px' : '0',
                  padding: isMobile ? '2px 0' : '0'
                }}>
                  <span style={{
                    fontWeight: 600,
                    color: '#1890ff',
                    marginRight: '6px',
                    fontSize: isMobile ? '12px' : '14px'
                  }}>{currency}</span>
                  <span style={{
                    fontWeight: 500,
                    fontSize: isMobile ? '12px' : '14px'
                  }}>{rate.toFixed(2)} ₺</span>
                </div>
              </Tooltip>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <AntHeader className="bg-white flex items-center justify-between px-4 border-b">
      {title && (
        <h1 className="text-2xl font-bold">{title}</h1>
      )}
      <div className="flex items-center">
        {databaseInfo && (
          <Tooltip title={`Bağlantı süresi: ${connectionTime} dakika`}>
            <Badge count={connectionTime} overflowCount={999} offset={[5, 0]}>
              <Button type="text" size="small">
                <DatabaseOutlined className="mr-1" />
                {databaseInfo.name}
              </Button>
            </Badge>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-4">
        {renderExchangeRates()}
        <Button
          type="text"
          icon={mode === 'laptop' ? <MobileOutlined /> : <LaptopOutlined />}
          onClick={toggleMode}
        >
          {mode === 'laptop' ? 'Mobile' : 'Laptop'}
        </Button>
        <Dropdown menu={{ items: userMenu }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            {user?.userName}
          </Button>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;
