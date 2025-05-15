import { ReactNode } from 'react';

export interface MenuItem {
  id?: string;
  title: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  component?: ReactNode;
  color?: string;
}

export const mainMenuItems: MenuItem[] = [
  {
    id: 'home',
    title: 'Ana Sayfa',
    path: '/',
    icon: 'HomeIcon'
  },
  {
    id: 'invoices',
    title: 'Faturalar',
    icon: 'FileTextOutlined',
    children: [
      {
        id: 'wholesale-invoices',
        title: 'Toptan Satış Faturaları',
        path: '/invoices/wholesale',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-purchase-invoices',
        title: 'Toptan Alış Faturaları',
        path: '/invoices/wholesale-purchase',
        icon: 'FileTextOutlined'
      }
    ]
  },
  {
    id: 'customers',
    title: 'Müşteri',
    path: '/customers',
    icon: 'UserGroupIcon'
  },
  {
    id: 'suppliers',
    title: 'Tedarikçi',
    path: '/suppliers',
    icon: 'TruckIcon'
  },
  {
    id: 'cashier',
    title: 'Kasa',
    icon: 'BanknotesIcon',
    children: [
      {
        id: 'payments',
        title: 'Ödemeler',
        path: '/cashier/payments'
      },
      {
        id: 'collections',
        title: 'Tahsilatlar',
        path: '/cashier/collections'
      }
    ]
  },
  {
    id: 'products',
    title: 'Ürünler',
    icon: 'InboxOutlined',
    path: '/products'
  },
  {
    id: 'materials',
    title: 'Malzemeler',
    icon: 'CubeIcon',
    children: [
      {
        id: 'material-management',
        title: 'Malzeme Yönetimi',
        path: '/materials/management'
      },
      {
        id: 'material-barcodes',
        title: 'Barkodlar',
        path: '/materials/barcodes'
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Stoklar',
    icon: 'ArchiveBoxIcon',
    children: [
      {
        id: 'inventory-count',
        title: 'Sayım',
        path: '/inventory/count'
      },
      {
        id: 'inventory-management',
        title: 'Envanter',
        path: '/inventory/management'
      },
      {
        id: 'warehouse-management',
        title: 'Depo Yönetimi',
        path: '/inventory/warehouse'
      },
      {
        id: 'branch-management',
        title: 'Ofis/Şube Yönetimi',
        path: '/inventory/branch'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Ayarlar',
    icon: 'CogIcon',
    children: [
      {
        id: 'users',
        title: 'Kullanıcılar',
        path: '/users',
        icon: 'UserGroupIcon'
      },
      {
        id: 'roles',
        title: 'Roller',
        path: '/roles',
        icon: 'CogIcon'
      },
      {
        id: 'user-groups',
        title: 'Kullanıcı Grupları',
        path: '/user-groups',
        icon: 'TeamOutlined'
      },
      {
        id: 'user-permissions',
        title: 'Kullanıcı Yetkileri',
        path: '/settings/permissions',
        icon: 'LockOutlined'
      },
      {
        id: 'action-logs',
        title: 'İşlem Logları',
        path: '/settings/logs',
        icon: 'FileTextOutlined'
      }
    ]
  }
];

export const mobileBottomMenu: MenuItem[] = [
  {
    id: 'home',
    title: 'Ana Sayfa',
    path: '/',
    icon: 'HomeIcon'
  },
  {
    id: 'menu',
    title: 'Menü',
    path: '/menu',
    icon: 'MenuIcon'
  },
  {
    id: 'profile',
    title: 'Profil',
    path: '/profile',
    icon: 'UserIcon'
  }
];

export const mobileCardMenu: MenuItem[] = [
  {
    id: 'invoices',
    title: 'Faturalar',
    icon: 'FileTextOutlined',
    color: '#0065cc', 
    children: [
      {
        id: 'wholesale-invoices',
        title: 'Toptan Satış Faturaları',
        path: '/invoices/wholesale',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-purchase-invoices',
        title: 'Toptan Alış Faturaları',
        path: '/invoices/wholesale-purchase',
        icon: 'FileTextOutlined'
      }
    ]
  },
  {
    id: 'customers',
    title: 'Müşteri',
    path: '/customers',
    icon: 'UserGroupIcon',
    color: '#389e0d' 
  },
  {
    id: 'suppliers',
    title: 'Tedarikçi',
    path: '/suppliers',
    icon: 'TruckIcon',
    color: '#531dab' 
  },
  {
    id: 'cashier',
    title: 'Kasa',
    icon: 'BanknotesIcon',
    color: '#d48806', 
    children: [
      {
        id: 'payments',
        title: 'Ödemeler',
        path: '/cashier/payments',
        icon: 'BanknotesIcon'
      },
      {
        id: 'collections',
        title: 'Tahsilatlar',
        path: '/cashier/collections',
        icon: 'BanknotesIcon'
      }
    ]
  },
  {
    id: 'products',
    title: 'Ürünler',
    icon: 'ShoppingBagIcon',
    color: '#c41d7f', 
    children: [
      {
        id: 'product-management',
        title: 'Ürün Yönetimi',
        path: '/products/management',
        icon: 'ShoppingBagIcon'
      },
      {
        id: 'product-barcodes',
        title: 'Barkodlar',
        path: '/products/barcodes',
        icon: 'ShoppingBagIcon'
      }
    ]
  },
  {
    id: 'materials',
    title: 'Malzemeler',
    icon: 'CubeIcon',
    color: '#08979c', 
    children: [
      {
        id: 'material-management',
        title: 'Malzeme Yönetimi',
        path: '/materials/management',
        icon: 'CubeIcon'
      },
      {
        id: 'material-barcodes',
        title: 'Barkodlar',
        path: '/materials/barcodes',
        icon: 'CubeIcon'
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Stoklar',
    icon: 'ArchiveBoxIcon',
    color: '#d4380d', 
    children: [
      {
        id: 'inventory-count',
        title: 'Sayım',
        path: '/inventory/count',
        icon: 'ArchiveBoxIcon'
      },
      {
        id: 'inventory-management',
        title: 'Envanter',
        path: '/inventory/management',
        icon: 'ArchiveBoxIcon'
      },
      {
        id: 'warehouse-management',
        title: 'Depo Yönetimi',
        path: '/inventory/warehouse',
        icon: 'ArchiveBoxIcon'
      },
      {
        id: 'branch-management',
        title: 'Ofis/Şube Yönetimi',
        path: '/inventory/branch',
        icon: 'ArchiveBoxIcon'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Ayarlar',
    icon: 'CogIcon',
    color: '#434343', 
    children: [
      {
        id: 'user-management',
        title: 'Kullanıcı İşlemleri',
        path: '/settings/users',
        icon: 'CogIcon'
      }
    ]
  }
];

export default {
  mainMenuItems,
  mobileBottomMenu,
  mobileCardMenu
};
