import React, { useState, useEffect, useRef } from 'react';
import { Layout, Input } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { mainMenuItems } from '../../config/menuConfig';
import {
  HomeOutlined,
  FileTextOutlined,
  TeamOutlined,
  CarOutlined,
  BankOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  DatabaseOutlined,
  SettingOutlined,
  RightOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  ShopOutlined,
  WalletOutlined,
  AccountBookOutlined,
  ImportOutlined,
  ExportOutlined,
  SwapOutlined,
  SearchOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const getIcon = (iconName: string | undefined) => {
  switch (iconName) {
    case 'HomeIcon':
      return <HomeOutlined className="text-xl" />;
    case 'ReceiptIcon':
    case 'FileTextOutlined':
      return <FileTextOutlined className="text-xl" />;
    case 'UserGroupIcon':
      return <TeamOutlined className="text-xl" />;
    case 'TruckIcon':
      return <CarOutlined className="text-xl" />;
    case 'BanknotesIcon':
      return <BankOutlined className="text-xl" />;
    case 'ShoppingBagIcon':
    case 'ShoppingOutlined':
      return <ShoppingOutlined className="text-xl" />;
    case 'ShoppingCartOutlined':
      return <ShoppingCartOutlined className="text-xl" />;
    case 'CubeIcon':
    case 'InboxOutlined':
      return <InboxOutlined className="text-xl" />;
    case 'ArchiveBoxIcon':
    case 'DatabaseOutlined':
      return <DatabaseOutlined className="text-xl" />;
    case 'CogIcon':
    case 'SettingOutlined':
      return <SettingOutlined className="text-xl" />;
    case 'DollarOutlined':
      return <DollarOutlined className="text-xl" />;
    case 'RiseOutlined':
      return <RiseOutlined className="text-xl" />;
    case 'FallOutlined':
      return <FallOutlined className="text-xl" />;
    case 'UserOutlined':
      return <UserOutlined className="text-xl" />;
    case 'ShopOutlined':
      return <ShopOutlined className="text-xl" />;
    case 'WalletOutlined':
      return <WalletOutlined className="text-xl" />;
    case 'AccountBookOutlined':
      return <AccountBookOutlined className="text-xl" />;
    case 'ImportOutlined':
      return <ImportOutlined className="text-xl" />;
    case 'ExportOutlined':
      return <ExportOutlined className="text-xl" />;
    case 'SwapOutlined':
      return <SwapOutlined className="text-xl" />;
    case 'DownloadOutlined':
      return <DownloadOutlined className="text-xl" />;
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
  'settings': '#434343',
  'finance': '#1890ff'
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredMenuItems, setFilteredMenuItems] = useState(mainMenuItems);
  // Arama öncesi açık olan menüleri saklamak için
  const [previousOpenSubmenus, setPreviousOpenSubmenus] = useState<string[]>([]);
  // Tam eşleşen menü öğesine referans
  const [exactMatchId, setExactMatchId] = useState<string | null>(null);
  const exactMatchRef = useRef<HTMLAnchorElement | null>(null);

  const handleSubmenuClick = (itemId: string | undefined) => {
    if (itemId) {
      setOpenSubmenus(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId) 
          : [...prev, itemId]
      );
    }
  };

  // Arama terimine göre menü öğelerini filtrele
  useEffect(() => {
    // Arama terimi boşsa veya 3 karakterden azsa tüm menü öğelerini göster
    if (!searchTerm.trim()) {
      setFilteredMenuItems(mainMenuItems);
      // Arama terimi tamamen silindiğinde, menüyü ilk haline döndür
      setOpenSubmenus(previousOpenSubmenus);
      return;
    }
    
    if (searchTerm.trim().length < 3) {
      setFilteredMenuItems(mainMenuItems);
      return;
    }
    
    // İlk arama başladığında açık menüleri kaydet
    if (searchTerm.trim().length === 3) {
      setPreviousOpenSubmenus([...openSubmenus]);
      setExactMatchId(null); // Yeni arama başladığında tam eşleşme ID'sini sıfırla
    }

    const searchTermLower = searchTerm.toLowerCase();
    
    const filterMenuItems = (items: typeof mainMenuItems): typeof mainMenuItems => {
      return items.filter(item => {
        // Başlıkta arama - tam eşleşme kontrolü
        const titleLower = item.title.toLowerCase();
        const exactMatch = titleLower === searchTermLower;
        const titleMatch = exactMatch || titleLower.startsWith(searchTermLower) || titleLower.includes(` ${searchTermLower}`);
        
        // Tam eşleşme varsa ve path varsa, bu öğeyi işaretle
        if (exactMatch && item.path && item.id) {
          setExactMatchId(item.id);
        }
        
        // Alt menülerde arama
        let childrenMatch = false;
        if (item.children && item.children.length > 0) {
          const filteredChildren: typeof mainMenuItems = filterMenuItems(item.children);
          childrenMatch = filteredChildren.length > 0;
          
          // Alt menülerde eşleşme varsa, alt menüleri filtrelenmiş haliyle güncelle
          if (childrenMatch) {
            item = { ...item, children: filteredChildren };
          }
        }
        
        return titleMatch || childrenMatch;
      });
    };
    
    const filtered = filterMenuItems([...mainMenuItems]);
    setFilteredMenuItems(filtered);
    
    // Eşleşen alt menülerin üst menülerini otomatik olarak aç
    if (searchTerm.trim()) {
      const findParentIds = (items: typeof mainMenuItems, parentIds: string[] = []): string[] => {
        let allParentIds: string[] = [];
        
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            const hasMatch = item.children.some(child => {
              const childTitleLower = child.title.toLowerCase();
              const childMatch = childTitleLower === searchTermLower || 
                                childTitleLower.startsWith(searchTermLower) || 
                                childTitleLower.includes(` ${searchTermLower}`);
              
              const grandchildMatch = child.children && child.children.some(grandchild => {
                const grandchildTitleLower = grandchild.title.toLowerCase();
                return grandchildTitleLower === searchTermLower || 
                      grandchildTitleLower.startsWith(searchTermLower) || 
                      grandchildTitleLower.includes(` ${searchTermLower}`);
              });
              
              return childMatch || grandchildMatch;
            });
            
            if (hasMatch && item.id) {
              allParentIds.push(item.id);
            }
            
            if (item.children) {
              const childParentIds = findParentIds(item.children, [...parentIds, item.id || '']);
              allParentIds = [...allParentIds, ...childParentIds];
            }
          }
        });
        
        return allParentIds;
      };
      
      const parentIds = findParentIds(mainMenuItems);
      setOpenSubmenus(prev => {
        const newOpenSubmenus = [...prev];
        parentIds.forEach(id => {
          if (!newOpenSubmenus.includes(id)) {
            newOpenSubmenus.push(id);
          }
        });
        return newOpenSubmenus;
      });
    }
  }, [searchTerm]);
  
  // Tam eşleşen menü öğesine odaklan
  useEffect(() => {
    if (exactMatchId && exactMatchRef.current) {
      exactMatchRef.current.focus();
      exactMatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [exactMatchId, filteredMenuItems]);

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
      
      {!collapsed && (
        <div className="px-4 pt-4">
          <Input 
            placeholder="Menüde ara (en az 3 karakter)"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => {
              const newValue = e.target.value;
              setSearchTerm(newValue);
              // Arama terimi tamamen silindiğinde menüyü ilk haline döndür
              if (!newValue.trim()) {
                setOpenSubmenus(previousOpenSubmenus);
              }
            }}
            onClear={() => {
              setSearchTerm('');
              setOpenSubmenus(previousOpenSubmenus);
            }}
            allowClear
            className="rounded-lg"
            status={searchTerm.trim().length > 0 && searchTerm.trim().length < 3 ? 'warning' : undefined}
          />
        </div>
      )}
      
      <div className="py-4">
        {filteredMenuItems.map((item) => {
          const color = menuColors[item.id as keyof typeof menuColors] || '#1677ff';
          // location.pathname her zaman başında / ile gelir
          const isActive = item.path === location.pathname || 
            (item.children && item.children.some(child => {
              const childActive = child.path === location.pathname;
              
              // Check if any grandchild is active
              const grandchildActive = child.children && child.children.some(grandchild => {
                return grandchild.path === location.pathname;
              });
              
              return childActive || grandchildActive;
            }));
          const isOpen = openSubmenus.includes(item.id || '');

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
                    ${isOpen ? 'max-h-[800px]' : 'max-h-0'}
                  `}>
                    {item.children.map((child) => {
                      const childIsActive = location.pathname === child.path;
                      const childHasChildren = child.children && child.children.length > 0;
                      const childIsOpen = openSubmenus.includes(child.id || '');
                      
                      return childHasChildren ? (
                        <div key={`${item.id}-${child.id || child.path}`}>
                          <div
                            onClick={() => handleSubmenuClick(child.id)}
                            className={`
                              flex items-center justify-between pl-9 pr-3 py-2 mt-1 rounded-lg cursor-pointer
                              transition-all duration-200 hover:bg-gray-50
                              ${childIsActive ? 'bg-gray-50' : ''}
                            `}
                            style={{ color }}
                          >
                            <div className="flex items-center">
                              {child.icon && <span className="mr-2">{getIcon(child.icon)}</span>}
                              <span className="font-medium">{child.title}</span>
                            </div>
                            <RightOutlined className={`transform transition-transform duration-200 ${childIsOpen ? 'rotate-90' : ''}`} />
                          </div>
                          
                          <div className={`
                            overflow-hidden transition-all duration-200
                            ${childIsOpen ? 'max-h-96' : 'max-h-0'}
                          `}>
                            {child.children?.map((grandchild) => (
                              <Link
                                key={`${item.id}-${child.id}-${grandchild.id || grandchild.path}`}
                                to={grandchild.path || ''}
                                className={`
                                  flex items-center pl-16 pr-3 py-2 mt-1 rounded-lg
                                  transition-all duration-200 hover:bg-gray-50
                                  ${location.pathname === grandchild.path ? 'bg-gray-50' : ''}
                                  ${exactMatchId === grandchild.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                                `}
                                style={{ color }}
                                ref={exactMatchId === grandchild.id ? exactMatchRef : null}
                                tabIndex={exactMatchId === grandchild.id ? 0 : -1}
                              >
                                {grandchild.icon && <span className="mr-2">{getIcon(grandchild.icon)}</span>}
                                <span className="font-medium">{grandchild.title}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Link
                          key={`${item.id}-${child.id || child.path}`}
                          to={child.path || ''}
                          className={`
                            flex items-center pl-9 pr-3 py-2 mt-1 rounded-lg
                            transition-all duration-200 hover:bg-gray-50
                            ${location.pathname === child.path ? 'bg-gray-50' : ''}
                            ${exactMatchId === child.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                          `}
                          style={{ color }}
                          ref={exactMatchId === child.id ? exactMatchRef : null}
                          tabIndex={exactMatchId === child.id ? 0 : -1}
                        >
                          {child.icon && <span className="mr-2">{getIcon(child.icon)}</span>}
                          <span className="font-medium">{child.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                <Link
                  key={item.id || item.path}
                  to={item.path || ''}
                  className={`
                    flex items-center p-3 rounded-lg
                    transition-all duration-200 hover:bg-gray-50
                    ${isActive ? 'bg-gray-50' : ''}
                    ${exactMatchId === item.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                  `}
                  style={{ color }}
                  ref={exactMatchId === item.id ? exactMatchRef : null}
                  tabIndex={exactMatchId === item.id ? 0 : -1}
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
