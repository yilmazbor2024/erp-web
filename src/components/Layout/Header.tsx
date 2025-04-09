import React from 'react';
import { Layout, Button, Dropdown, MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined, LaptopOutlined, MobileOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useViewModeStore from '../../stores/viewModeStore';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title?: string;
}

const { Header: AntHeader } = Layout;

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useViewModeStore();

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
      onClick: logout
    }
  ];

  return (
    <AntHeader className="bg-white flex items-center justify-between px-4 border-b">
      {title && (
        <h1 className="text-2xl font-bold">{title}</h1>
      )}
      <div className="text-xl font-bold">ERP Mobile</div>
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
