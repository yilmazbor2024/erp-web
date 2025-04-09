import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mobileBottomMenu } from '../../config/menuConfig';
import {
  HomeOutlined,
  MenuOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';

const MobileBottomMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getIcon = (iconName: string | undefined): React.ReactNode => {
    switch (iconName) {
      case 'HomeIcon':
        return <HomeOutlined className="text-2xl" />;
      case 'MenuIcon':
        return <MenuOutlined className="text-2xl" />;
      case 'CogIcon':
        return <SettingOutlined className="text-2xl" />;
      case 'UserIcon':
        return <UserOutlined className="text-2xl" />;
      default:
        return <HomeOutlined className="text-2xl" />;
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 h-16">
        {mobileBottomMenu.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path || '')}
              className={`
                flex flex-col items-center justify-center cursor-pointer
                transition-all duration-200 relative
                ${isActive ? 'text-blue-600' : 'text-gray-500'}
              `}
            >
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 w-12 h-1 bg-blue-600 rounded-full transform -translate-x-1/2" />
              )}
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-xl mb-0.5
                ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
              `}>
                {getIcon(item.icon)}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomMenu; 