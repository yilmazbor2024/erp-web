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
    id: 'sales',
    title: 'Satış & Pazarlama',
    icon: 'ShoppingOutlined',
    children: [
      {
        id: 'wholesale-invoices',
        title: 'Toptan Satış Faturaları',
        path: '/invoice/list?type=wholesale',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-delivery-notes',
        title: 'Toptan Satış İrsaliyeleri',
        path: '/delivery-notes/list?type=wholesale',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-orders',
        title: 'Toptan Satış Siparişleri',
        path: '/orders/list?type=wholesale',
        icon: 'FileTextOutlined'
      },
      {
        id: 'sales-price-list',
        title: 'Satış Fiyat Listesi',
        path: '/price-lists/products',
        icon: 'FileTextOutlined'
      }
    ]
  },
  {
    id: 'purchase',
    title: 'Satınalma',
    icon: 'ShoppingCartOutlined',
    children: [
      {
        id: 'wholesale-purchase-invoices',
        title: 'Toptan Alış Faturaları',
        path: '/invoice/list?type=wholesale-purchase',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-purchase-delivery-notes',
        title: 'Toptan Alış İrsaliyeleri',
        path: '/delivery-notes/list?type=wholesale-purchase',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-purchase-orders',
        title: 'Toptan Alış Siparişleri',
        path: '/orders/list?type=wholesale-purchase',
        icon: 'FileTextOutlined'
      },
      {
        id: 'expense-purchase-invoices',
        title: 'Masraf Alış Faturaları',
        path: '/invoice/list?type=expense-purchase',
        icon: 'FileTextOutlined'
      },
      {
        id: 'expense-sales-invoices',
        title: 'Masraf Satış Faturaları',
        path: '/invoice/list?type=expense-sales',
        icon: 'FileTextOutlined'
      },
      {
        id: 'expenses',
        title: 'Masraflar',
        path: '/expenses',
        icon: 'FileTextOutlined'
      },
      {
        id: 'materials',
        title: 'Malzemeler',
        path: '/materials',
        icon: 'CubeIcon'
      }
    ]
  },
  {
    id: 'finance',
    title: 'Finans Yönetimi',
    icon: 'DollarOutlined',
    children: [
      {
        id: 'receivables',
        title: 'Alacak Hesapları',
        icon: 'RiseOutlined',
        children: [
          {
            id: 'customers',
            title: 'Müşteri',
            path: '/customers',
            icon: 'UserGroupIcon'
          }
        ]
      },
      {
        id: 'payables',
        title: 'Borç Hesapları',
        icon: 'FallOutlined',
        children: [
          {
            id: 'vendors',
            title: 'Tedarikçi',
            path: '/vendors',
            icon: 'TruckIcon'
          }
        ]
      },
      {
        id: 'cash-transactions',
        title: 'Nakit Kasa İşlemleri',
        icon: 'WalletOutlined',
        children: [
          {
            id: 'cash-account',
            title: 'Nakit Kasa Hesabı',
            path: '/finance/cash/account',
            icon: 'AccountBookOutlined'
          },
          {
            id: 'cash-receipt',
            title: 'Kasa Tahsil',
            path: '/finance/cash/receipt',
            icon: 'ImportOutlined'
          },
          {
            id: 'cash-payment',
            title: 'Kasa Tediye',
            path: '/finance/cash/payment',
            icon: 'ExportOutlined'
          },
          {
            id: 'cash-transfer',
            title: 'Kasalar Arası Virman',
            path: '/finance/cash/transfer',
            icon: 'SwapOutlined'
          }
        ]
      },
      {
        id: 'exchange-rates',
        title: 'Döviz Kurları',
        path: '/finance/exchange-rates',
        icon: 'DollarOutlined'
      },
      {
        id: 'cross-rates',
        title: 'Çapraz Kurlar',
        path: '/finance/cross-rates',
        icon: 'SwapOutlined'
      },
      {
        id: 'historical-rates',
        title: 'Tarihsel Döviz Kurları',
        path: '/finance/historical-rates',
        icon: 'RiseOutlined'
      }
    ]
  },
  {
    id: 'products',
    title: 'Ürün Yönetimi',
    icon: 'InboxOutlined',
    children: [
      {
        id: 'product-list',
        title: 'Ürünler',
        path: '/products'
      },
      {
        id: 'product-codings',
        title: 'Ürün Yönetimi Kodlamaları',
        path: '/products/codings'
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Depo Yönetimi',
    icon: 'ArchiveBoxIcon',
    children: [
      {
        id: 'inventory-stock',
        title: 'Envanter/Stok',
        path: '/inventory/stock'
      },
      {
        id: 'inventory-count',
        title: 'Sayımlar',
        path: '/inventory/count'
      },
      {
        id: 'warehouse-transfer',
        title: 'Depo ve Depolar Arası Transfer',
        path: '/inventory/transfer'
      },
      {
        id: 'shipping',
        title: 'Sevkiyat',
        path: '/inventory/shipping'
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
    id: 'sales',
    title: 'Satış & Pazarlama',
    icon: 'ShoppingOutlined',
    color: '#c41d7f',
    children: [
      {
        id: 'wholesale-invoices',
        title: 'Toptan Satış Faturaları',
        path: '/invoice/list?type=wholesale',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-delivery-notes',
        title: 'Toptan Satış İrsaliyeleri',
        path: '/delivery-notes/list?type=wholesale',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-orders',
        title: 'Toptan Satış Siparişleri',
        path: '/orders/list?type=wholesale',
        icon: 'FileTextOutlined'
      },
      {
        id: 'sales-price-list',
        title: 'Satış Fiyat Listesi',
        path: '/price-lists/products',
        icon: 'FileTextOutlined'
      }
    ]
  },
  {
    id: 'purchase',
    title: 'Satınalma',
    icon: 'ShoppingCartOutlined',
    color: '#0065cc',
    children: [
      {
        id: 'wholesale-purchase-invoices',
        title: 'Toptan Alış Faturaları',
        path: '/invoice/list?type=wholesale-purchase',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-purchase-delivery-notes',
        title: 'Toptan Alış İrsaliyeleri',
        path: '/delivery-notes/list?type=wholesale-purchase',
        icon: 'FileTextOutlined'
      },
      {
        id: 'wholesale-purchase-orders',
        title: 'Toptan Alış Siparişleri',
        path: '/orders/list?type=wholesale-purchase',
        icon: 'FileTextOutlined'
      },
      {
        id: 'expense-purchase-invoices',
        title: 'Masraf Alış Faturaları',
        path: '/invoice/list?type=expense-purchase',
        icon: 'FileTextOutlined'
      },
      {
        id: 'expense-sales-invoices',
        title: 'Masraf Satış Faturaları',
        path: '/invoice/list?type=expense-sales',
        icon: 'FileTextOutlined'
      },
      {
        id: 'expenses',
        title: 'Masraflar',
        path: '/expenses',
        icon: 'FileTextOutlined'
      },
      {
        id: 'materials',
        title: 'Malzemeler',
        path: '/materials',
        icon: 'CubeIcon'
      }
    ]
  },
  {
    id: 'products',
    title: 'Ürün Yönetimi',
    icon: 'InboxOutlined',
    color: '#c41d7f',
    children: [
      {
        id: 'product-list',
        title: 'Ürünler',
        path: '/products',
        icon: 'InboxOutlined'
      },
      {
        id: 'product-codings',
        title: 'Ürün Yönetimi Kodlamaları',
        path: '/products/codings',
        icon: 'InboxOutlined'
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Depo Yönetimi',
    icon: 'ArchiveBoxIcon',
    color: '#d4380d',
    children: [
      {
        id: 'inventory-stock',
        title: 'Envanter/Stok',
        path: '/test',
        icon: 'ArchiveBoxIcon'
      },
      {
        id: 'inventory-count',
        title: 'Sayımlar',
        path: 'inventory/count',
        icon: 'ArchiveBoxIcon'
      },
      {
        id: 'warehouse-transfer',
        title: 'Depo ve Depolar Arası Transfer',
        path: '/inventory/warehouse-transfers',
        icon: 'SwapOutlined'
      },
      {
        id: 'shipping',
        title: 'Sevkiyat',
        path: '/inventory/shipping',
        icon: 'ArchiveBoxIcon'
      }
    ]
  },
  {
    id: 'customers',
    title: 'Müşteriler',
    path: '/customers',
    icon: 'UserGroupIcon',
    color: '#389e0d'
  },
  {
    id: 'vendors',
    title: 'Tedarikçiler',
    path: '/vendors',
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
