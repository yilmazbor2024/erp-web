import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mobileCardMenu } from '../../config/menuConfig';
import {
  ReceiptPercentIcon,
  UserGroupIcon,
  TruckIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  CubeIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  id: string;
  title: string;
}

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const [menuPath, setMenuPath] = useState<BreadcrumbItem[]>([]);

  const getIcon = (iconName: string | undefined) => {
    switch (iconName) {
      case 'ReceiptIcon':
        return <ReceiptPercentIcon className="w-14 h-14 text-white mb-4" />;
      case 'UserGroupIcon':
        return <UserGroupIcon className="w-14 h-14 text-white mb-4" />;
      case 'TruckIcon':
        return <TruckIcon className="w-14 h-14 text-white mb-4" />;
      case 'BanknotesIcon':
        return <BanknotesIcon className="w-14 h-14 text-white mb-4" />;
      case 'ShoppingBagIcon':
        return <ShoppingBagIcon className="w-14 h-14 text-white mb-4" />;
      case 'CubeIcon':
        return <CubeIcon className="w-14 h-14 text-white mb-4" />;
      case 'ArchiveBoxIcon':
        return <ArchiveBoxIcon className="w-14 h-14 text-white mb-4" />;
      case 'CogIcon':
        return <Cog6ToothIcon className="w-14 h-14 text-white mb-4" />;
      default:
        return <Cog6ToothIcon className="w-14 h-14 text-white mb-4" />;
    }
  };

  const getCurrentMenu = () => {
    let currentMenu = mobileCardMenu;
    let currentItem = null;

    for (const item of menuPath) {
      currentItem = currentMenu.find(m => m.id === item.id);
      if (currentItem?.children) {
        currentMenu = currentItem.children;
      }
    }

    return { currentMenu: currentMenu, parentItem: currentItem };
  };

  const handleCardClick = (item: typeof mobileCardMenu[0]) => {
    if (item.children) {
      if (item.id) {
        setMenuPath([...menuPath, { id: item.id, title: item.title }]);
      }
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleBack = () => {
    setMenuPath(menuPath.slice(0, -1));
  };

  const { currentMenu, parentItem } = getCurrentMenu();

  return (
    <div className="block md:hidden p-4">
      {menuPath.length > 0 && (
        <div 
          className="flex items-center mb-4 text-gray-600 cursor-pointer"
          onClick={handleBack}
        >
          <ChevronLeftIcon className="w-7 h-7 mr-2" />
          <span className="text-xl">Geri</span>
        </div>
      )}

      {menuPath.length > 0 && (
        <div className="flex items-center mb-4 overflow-x-auto whitespace-nowrap">
          {menuPath.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />}
              <span className="text-sm text-gray-600">{item.title}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {currentMenu.map((item) => (
          <div
            key={item.id}
            onClick={() => handleCardClick(item)}
            className="cursor-pointer"
          >
            <div
              style={{ backgroundColor: parentItem?.color || item.color }}
              className="aspect-square rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 relative"
            >
              {getIcon(item.icon)}
              <span className="text-white text-xl font-medium text-center">
                {item.title}
              </span>
              {item.children && (
                <div className="absolute bottom-2 right-2">
                  <ChevronRightIcon className="w-6 h-6 text-white opacity-80" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
