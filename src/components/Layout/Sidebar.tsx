import React from 'react';
import { Layout } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { mainMenuItems } from '../../config/menuConfig';
import {
  HomeOutlined,
  FileTextOutlined,
  TeamOutlined,
  CarOutlined,
  BankOutlined,
  ShoppingOutlined,
  InboxOutlined,
  DatabaseOutlined,
  SettingOutlined,
  RightOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const getIcon = (iconName: string | undefined) => {
  switch (iconName) {
    case 'HomeIcon':
      return <HomeOutlined className="text-xl" />;
    case 'ReceiptIcon':
      return <FileTextOutlined className="text-xl" />;
    case 'UserGroupIcon':
      return <TeamOutlined className="text-xl" />;
    case 'TruckIcon':
      return <CarOutlined className="text-xl" />;
    case 'BanknotesIcon':
      return <BankOutlined className="text-xl" />;
    case 'ShoppingBagIcon':
      return <ShoppingOutlined className="text-xl" />;
    case 'CubeIcon':
      return <InboxOutlined className="text-xl" />;
    case 'ArchiveBoxIcon':
      return <DatabaseOutlined className="text-xl" />;
    case 'CogIcon':
      return <SettingOutlined className="text-xl" />;
    default:
      return <HomeOutlined className="text-xl" />;
  }
};

const menuColors = {
  'invoices': '#0065cc',
  'customers': '#389e0d',
  'suppliers': '#531dab',
  'cashier': '#d48806',
  'products': '#c41d7f',
  'materials': '#08979c',
  'inventory': '#d4380d',
  'settings': '#434343'
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);

  const handleSubmenuClick = (itemId: string | undefined) => {
    if (itemId) {
      setOpenSubmenu(openSubmenu === itemId ? null : itemId);
    }
  };

  return (
    <Sider
      width={250}
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      className="hidden md:block h-screen bg-white border-r border-gray-200 transition-all duration-300"
      theme="light"
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          {collapsed ? 'ERP' : 'ERP Sistemi'}
        </h1>
      </div>
      
      <div className="py-4">
        {mainMenuItems.map((item) => {
          const color = menuColors[item.id as keyof typeof menuColors] || '#1677ff';
          const normalizedPath = item.path?.startsWith('/') ? item.path.substring(1) : item.path;
          const isActive = normalizedPath === location.pathname || 
            (item.children && item.children.some(child => {
              const normalizedChildPath = child.path?.startsWith('/') ? child.path.substring(1) : child.path;
              return normalizedChildPath === location.pathname;
            }));
          const isOpen = openSubmenu === item.id;

          return (
            <div key={item.id || item.path} className="px-4 mb-2">
              {item.children ? (
                <>
                  <div
                    onClick={() => handleSubmenuClick(item.id)}
                    className={`
                      flex items-center justify-between p-3 rounded-lg cursor-pointer
                      transition-all duration-200 hover:bg-gray-50
                      ${isActive ? 'bg-gray-50' : ''}
                    `}
                    style={{ color }}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{getIcon(item.icon)}</span>
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </div>
                    {!collapsed && <RightOutlined className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />}
                  </div>
                  
                  <div className={`
                    overflow-hidden transition-all duration-200
                    ${isOpen ? 'max-h-96' : 'max-h-0'}
                  `}>
                    {item.children.map((child) => (
                      <Link
                        key={`${item.id}-${child.id || child.path}`}
                        to={child.path ? (child.path.startsWith('/') ? child.path.substring(1) : child.path) : ''}
                        className={`
                          flex items-center pl-9 pr-3 py-2 mt-1 rounded-lg
                          transition-all duration-200 hover:bg-gray-50
                          ${location.pathname === (child.path?.startsWith('/') ? child.path.substring(1) : child.path) ? 'bg-gray-50' : ''}
                        `}
                        style={{ color }}
                      >
                        <span className="font-medium">{child.title}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  key={item.id || item.path}
                  to={item.path ? (item.path.startsWith('/') ? item.path.substring(1) : item.path) : ''}
                  className={`
                    flex items-center p-3 rounded-lg
                    transition-all duration-200 hover:bg-gray-50
                    ${isActive ? 'bg-gray-50' : ''}
                  `}
                  style={{ color }}
                >
                  <span className="mr-3">{getIcon(item.icon)}</span>
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Sider>
  );
};

export default Sidebar;
