import React, { useState, useEffect, useRef } from 'react';
import { Layout, Input } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { mainMenuItems } from '../../config/menuConfig';

// MenuItem tipi tanımlaması
interface MenuItem {
  id?: string;
  title?: string;
  path?: string;
  icon?: string;
  colorKey?: string;
  children?: MenuItem[];
}
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

// Stil sabitleri
const styles = {
  sider: {
    overflow: 'auto',
    height: '100vh',
    position: 'fixed' as const, // Type assertion to fix position property
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  logo: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 600,
    background: 'linear-gradient(to right, #1890ff, #722ed1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  searchContainer: {
    padding: '16px',
  },
  menuContainer: {
    padding: '0 8px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderRadius: '4px',
    marginBottom: '4px',
    transition: 'all 0.3s',
  },
  menuItemActive: {
    backgroundColor: '#e6f7ff',
    color: '#1890ff',
  },
  menuItemIcon: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
  },
  submenuContainer: {
    paddingLeft: '12px',
  },
  submenuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px 8px 24px',
    borderRadius: '4px',
    marginBottom: '2px',
    transition: 'all 0.3s',
  },
  submenuItemIcon: {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10px',
  },
  submenuToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    cursor: 'pointer',
  },
  childrenContainer: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
  }
};

// İkon bileşeni
const IconComponent: React.FC<{ iconName: string | undefined }> = ({ iconName }) => {
  const iconProps = { style: { fontSize: '16px' } };
  
  switch (iconName) {
    case 'HomeIcon':
      return <HomeOutlined {...iconProps} />;
    case 'ReceiptIcon':
    case 'FileTextOutlined':
      return <FileTextOutlined {...iconProps} />;
    case 'UserGroupIcon':
      return <TeamOutlined {...iconProps} />;
    case 'TruckIcon':
      return <CarOutlined {...iconProps} />;
    case 'BanknotesIcon':
      return <BankOutlined {...iconProps} />;
    case 'ShoppingBagIcon':
    case 'ShoppingOutlined':
      return <ShoppingOutlined {...iconProps} />;
    case 'ShoppingCartOutlined':
      return <ShoppingCartOutlined {...iconProps} />;
    case 'CubeIcon':
    case 'InboxOutlined':
      return <InboxOutlined {...iconProps} />;
    case 'ArchiveBoxIcon':
    case 'DatabaseOutlined':
      return <DatabaseOutlined {...iconProps} />;
    case 'CogIcon':
    case 'SettingOutlined':
      return <SettingOutlined {...iconProps} />;
    case 'DollarOutlined':
      return <DollarOutlined {...iconProps} />;
    case 'RiseOutlined':
      return <RiseOutlined {...iconProps} />;
    case 'FallOutlined':
      return <FallOutlined {...iconProps} />;
    case 'UserOutlined':
      return <UserOutlined {...iconProps} />;
    case 'ShopOutlined':
      return <ShopOutlined {...iconProps} />;
    case 'WalletOutlined':
      return <WalletOutlined {...iconProps} />;
    case 'AccountBookOutlined':
      return <AccountBookOutlined {...iconProps} />;
    case 'ImportOutlined':
      return <ImportOutlined {...iconProps} />;
    case 'ExportOutlined':
      return <ExportOutlined {...iconProps} />;
    case 'SwapOutlined':
      return <SwapOutlined {...iconProps} />;
    case 'DownloadOutlined':
      return <DownloadOutlined {...iconProps} />;
    default:
      return <HomeOutlined {...iconProps} />;
  }
};

// Menü renkleri
const menuColors: Record<string, string> = {
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

const ImprovedSidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>(mainMenuItems);
  const [previousOpenSubmenus, setPreviousOpenSubmenus] = useState<string[]>([]);
  const [exactMatchId, setExactMatchId] = useState<string | null>(null);
  const exactMatchRef = useRef<HTMLAnchorElement | null>(null);

  // Alt menü tıklama işleyicisi
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
    if (!searchTerm.trim() || searchTerm.length < 3) {
      setFilteredMenuItems(mainMenuItems);
      
      // Arama terimi tamamen silindiğinde, menüyü ilk haline döndür
      if (!searchTerm.trim() && previousOpenSubmenus.length > 0) {
        setOpenSubmenus(previousOpenSubmenus);
        setPreviousOpenSubmenus([]);
      }
      return;
    }

    // İlk kez arama yapılıyorsa, açık alt menüleri kaydet
    if (previousOpenSubmenus.length === 0) {
      setPreviousOpenSubmenus(openSubmenus);
    }

    const searchTermLower = searchTerm.toLowerCase();
    
    // Arama sonuçlarını filtrele
    const filterItems = (items: MenuItem[]): MenuItem[] => {
      return items.filter(item => {
        const titleMatch = item.title?.toLowerCase().includes(searchTermLower);
        
        // Alt menü öğelerini kontrol et
        const childMatches = item.children 
          ? filterItems(item.children) 
          : [];
        
        // Eşleşen alt menü öğeleri varsa, bunları item'a ekle
        if (childMatches.length > 0) {
          return { ...item, children: childMatches };
        }
        
        return titleMatch;
      });
    };

    const filtered = filterItems(mainMenuItems);
    setFilteredMenuItems(filtered);

    // Arama sonuçlarında eşleşen tüm alt menüleri aç
    const findParentIds = (items: MenuItem[], parentIds: string[] = []): string[] => {
      let allParentIds = [...parentIds];
      
      items.forEach(item => {
        if (item.title?.toLowerCase().includes(searchTermLower)) {
          if (item.id) {
            allParentIds.push(item.id);
          }
        }
        
        if (item.children && item.children.length > 0) {
          const childParentIds = findParentIds(item.children, item.id ? [item.id] : []);
          allParentIds = [...allParentIds, ...childParentIds];
        }
      });
      
      return allParentIds;
    };

    const parentIds = findParentIds(mainMenuItems);
    setOpenSubmenus(parentIds);
  }, [searchTerm]);

  // Tam eşleşen menü öğesini bul ve odakla
  useEffect(() => {
    if (exactMatchRef.current && exactMatchId) {
      exactMatchRef.current.focus();
    }
  }, [exactMatchId]);

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={setCollapsed}
      style={styles.sider}
      width={250}
      theme="light"
    >
      <div style={styles.logo}>
        <h1 style={styles.logoText}>ERP Sistemi</h1>
      </div>
      
      <div style={styles.searchContainer}>
        <Input
          placeholder="Menüde ara (en az 3 karakter)"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>
      
      <div style={styles.menuContainer}>
        {filteredMenuItems.map(item => {
          const normalizedPath = item.path ? (item.path.startsWith('/') ? item.path.substring(1) : item.path) : '';
          const isActive = location.pathname === normalizedPath;
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = item.id && openSubmenus.includes(item.id);
          const color = item.colorKey && menuColors[item.colorKey] ? menuColors[item.colorKey] : '#000';
          
          return (
            <div key={item.id || item.path}>
              {hasChildren ? (
                <>
                  <div 
                    style={{
                      ...styles.menuItem,
                      ...(isActive && styles.menuItemActive),
                      color
                    }}
                    onClick={() => handleSubmenuClick(item.id)}
                  >
                    <div style={styles.submenuToggle}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={styles.menuItemIcon}>
                          <IconComponent iconName={item.icon} />
                        </div>
                        {!collapsed && <span style={{ fontWeight: 500 }}>{item.title}</span>}
                      </div>
                      {!collapsed && (
                        <RightOutlined style={{ 
                          transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', 
                          transition: 'transform 0.3s' 
                        }} />
                      )}
                    </div>
                  </div>
                  
                  <div style={{
                    ...styles.childrenContainer,
                    maxHeight: isOpen && !collapsed ? '1000px' : '0px',
                    paddingLeft: '12px'
                  }}>
                    {item.children?.map(child => {
                      const childNormalizedPath = child.path ? (child.path.startsWith('/') ? child.path.substring(1) : child.path) : '';
                      const childIsActive = location.pathname === childNormalizedPath;
                      const childHasChildren = child.children && child.children.length > 0;
                      const childIsOpen = child.id ? openSubmenus.includes(child.id) : false;
                      
                      return childHasChildren ? (
                        <div key={`${item.id}-${child.id || child.path}`}>
                          <div 
                            style={{
                              ...styles.submenuItem,
                              ...(childIsActive && styles.menuItemActive),
                              color
                            }}
                            onClick={() => handleSubmenuClick(child.id)}
                          >
                            <div style={styles.submenuToggle}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {child.icon && (
                                  <div style={styles.submenuItemIcon}>
                                    <IconComponent iconName={child.icon} />
                                  </div>
                                )}
                                <span style={{ fontWeight: 500 }}>{child.title}</span>
                              </div>
                              <RightOutlined style={{ 
                                transform: childIsOpen ? 'rotate(90deg)' : 'rotate(0)', 
                                transition: 'transform 0.3s' 
                              }} />
                            </div>
                          </div>
                          
                          <div style={{
                            ...styles.childrenContainer,
                            maxHeight: childIsOpen ? '1000px' : '0px',
                            paddingLeft: '12px'
                          }}>
                            {child.children?.map(grandchild => {
                              const grandchildPath = grandchild.path ? (grandchild.path.startsWith('/') ? grandchild.path.substring(1) : grandchild.path) : '';
                              const grandchildIsActive = location.pathname === grandchildPath;
                              
                              return (
                                <Link
                                  key={`${item.id}-${child.id}-${grandchild.id || grandchild.path || ''}`}
                                  to={grandchild.path ? (grandchild.path.startsWith('/') ? grandchild.path.substring(1) : grandchild.path) : ''}
                                  style={{
                                    ...styles.submenuItem,
                                    ...(grandchildIsActive && styles.menuItemActive),
                                    color: grandchildIsActive ? '#1890ff' : color,
                                    paddingLeft: '36px',
                                    textDecoration: 'none'
                                  }}
                                  ref={exactMatchId === grandchild.id ? exactMatchRef : null}
                                  tabIndex={exactMatchId === grandchild.id ? 0 : -1}
                                >
                                  {grandchild.icon && (
                                    <div style={styles.submenuItemIcon}>
                                      <IconComponent iconName={grandchild.icon} />
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 500 }}>{grandchild.title}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <Link
                          key={`${item.id}-${child.id || child.path || ''}`}
                          to={child.path ? (child.path.startsWith('/') ? child.path.substring(1) : child.path) : ''}
                          style={{
                            ...styles.submenuItem,
                            ...(childIsActive && styles.menuItemActive),
                            color: childIsActive ? '#1890ff' : color,
                            textDecoration: 'none'
                          }}
                          ref={exactMatchId === child.id ? exactMatchRef : null}
                          tabIndex={exactMatchId === child.id ? 0 : -1}
                        >
                          {child.icon && (
                            <div style={styles.submenuItemIcon}>
                              <IconComponent iconName={child.icon} />
                            </div>
                          )}
                          <span style={{ fontWeight: 500 }}>{child.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                <Link
                  key={item.id || item.path || ''}
                  to={item.path ? (item.path.startsWith('/') ? item.path.substring(1) : item.path) : ''}
                  style={{
                    ...styles.menuItem,
                    ...(isActive && styles.menuItemActive),
                    color: isActive ? '#1890ff' : color,
                    textDecoration: 'none'
                  }}
                  ref={exactMatchId === item.id ? exactMatchRef : null}
                  tabIndex={exactMatchId === item.id ? 0 : -1}
                >
                  <div style={styles.menuItemIcon}>
                    <IconComponent iconName={item.icon} />
                  </div>
                  {!collapsed && <span style={{ fontWeight: 500 }}>{item.title}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Sider>
  );
};

export default ImprovedSidebar;
