import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navigationItems: NavItem[] = [
  { label: 'Ana Sayfa', path: '/', icon: '🏠' },
  { label: 'Menü', path: '/menu', icon: '📋' },
  { label: 'Faturalar', path: '/invoices', icon: '📄' },
  { label: 'Müşteriler', path: '/customers', icon: '👥' },
];

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-white shadow-lg border-t border-gray-200">
      <div className="flex justify-around">
        {navigationItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 py-3 flex flex-col items-center ${
              location.pathname === item.path
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
