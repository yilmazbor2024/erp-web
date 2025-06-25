import React, { useState, useEffect } from 'react';
import { Layout, Button, Dropdown, MenuProps, Tooltip, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, LaptopOutlined, MobileOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import useViewModeStore from '../../stores/viewModeStore';
import { useAuth } from '../../contexts/AuthContext';

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

  return (
    <AntHeader className="bg-white flex items-center justify-between px-4 border-b">
      {title && (
        <h1 className="text-2xl font-bold">{title}</h1>
      )}
      <div className="text-xl font-bold flex items-center">
        ERP Mobile
        {databaseInfo && (
          <Tooltip title={`Bağlantı süresi: ${connectionTime} dakika`}>
            <Badge count={connectionTime} overflowCount={999} offset={[5, 0]}>
              <Button type="text" size="small" className="ml-2">
                <DatabaseOutlined className="mr-1" />
                {databaseInfo.name}
              </Button>
            </Badge>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-4">
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
