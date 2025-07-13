import React, { useEffect } from 'react';
import { Route, Routes, Navigate, useLocation, Outlet } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerRegistration from './pages/Customers/CustomerRegistration';
import HomePage from './pages/HomePage';
import Customers from './pages/Customers';
import CustomerDetail from './pages/Customers/CustomerDetail';
import CustomerCreate from './pages/Customers/CustomerCreate';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Siparisler from './pages/Siparisler';
import Urunler from './pages/Urunler';
import Users from './pages/Users';
import Profile from './pages/Profile';
import UsersPage from './pages/Users/index';
import RolesPage from './pages/Roles/index';
import SettingsPage from './pages/settings/SettingsPage';
import DatabaseList from './pages/settings/DatabaseList';
import UserDatabaseList from './pages/settings/UserDatabaseList';
import AuditLogViewer from './components/admin/AuditLogViewer';
import BarcodeSettingsForm from './components/common/BarcodeSettingsForm';
// CustomerTokenViewer import'u kaldırıldı
import WholesaleInvoices from './pages/Invoices/WholesaleInvoices';
import CreateWholesaleInvoice from './pages/Invoices/CreateWholesaleInvoice';
import InvoiceListPage from './pages/invoice/InvoiceListPage';
import InvoiceDetailPage from './pages/invoice/InvoiceDetailPage';
import InvoiceEditPage from './pages/invoice/InvoiceEditPage';
import ProductPriceList from './pages/Products/ProductPriceList';
import ProductDetail from './pages/Products/ProductDetail';
import InventoryStockPage from './pages/inventory/InventoryStockPage';
import WarehouseTransferListPage from './pages/inventory/WarehouseTransferListPage';
import WarehouseTransferDetailPage from './pages/inventory/WarehouseTransferDetailPage';
import ProductionOrderListPage from './pages/inventory/ProductionOrderListPage';
import ProductionOrderFormPage from './pages/inventory/ProductionOrderFormPage';
import ProductionOrderDetailPage from './pages/inventory/ProductionOrderDetailPage';
import ConsumptionOrderListPage from './pages/inventory/ConsumptionOrderListPage';
import ConsumptionOrderFormPage from './pages/inventory/ConsumptionOrderFormPage';
import ConsumptionOrderDetailPage from './pages/inventory/ConsumptionOrderDetailPage';
import ExchangeRatesPage from './pages/finance/ExchangeRatesPage';
import ExchangeRateManagementPage from './pages/admin/ExchangeRateManagementPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Kasa Sayfaları
import CashReceiptListPage from './pages/cash/CashReceiptListPage';
import CashReceiptPage from './pages/cash/CashReceiptPage';
import CashPaymentListPage from './pages/cash/CashPaymentListPage';
import CashPaymentPage from './pages/cash/CashPaymentPage';
import CashTransferListPage from './pages/cash/CashTransferListPage';
import CashTransferPage from './pages/cash/CashTransferPage';
import CashTransactionsPage from './pages/cash/CashTransactionsPage';
import CashSummaryPage from './pages/cash/CashSummaryPage';

// Rota değişikliklerini izlemek için bileşen
const RouteLogger = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('Mevcut rota:', location.pathname);
  }, [location]);

  return null;
};

// Authenticated route component
interface PrivateRouteProps {
  children: React.ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  // Yükleniyor durumu
  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

const AppRoutes: React.FC = () => {
  console.log('AppRoutes çalıştı');
  
  return (
    <AuthProvider>
      <RouteLogger />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/customer-registration" element={<CustomerRegistration />} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/new" element={<CustomerCreate />} />
          <Route path="customers/edit/:customerCode" element={<CustomerDetail isEdit={true} />} />
          <Route path="customers/:customerCode" element={<CustomerDetail />} />
          <Route path="siparisler" element={<Siparisler />} />
          <Route path="urunler" element={<Urunler />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Envanter ana sayfası */}
          <Route path="price-lists/products" element={<ProductPriceList />} />
          <Route path="products/price-list" element={<Navigate to="/price-lists/products" replace />} />
          <Route path="products/:productCode" element={<ProductDetail />} />
          <Route path="invoices/wholesale" element={<WholesaleInvoices />} />
          <Route path="invoices/wholesale/new" element={<CreateWholesaleInvoice />} />
          
          {/* Yeni Fatura Sayfaları */}
          <Route path="invoices" element={<InvoiceListPage />} />
          <Route path="invoice/list" element={<InvoiceListPage />} />
          <Route path="invoice/:id" element={<InvoiceDetailPage />} />
          <Route path="invoice/edit/:id" element={<InvoiceEditPage />} />
          
          {/* Envanter/Stok Sayfaları */}
          <Route path="inventory/count" element={<div>Sayım Sayfası (Geliştirme Aşamasında)</div>} />
          <Route path="inventory/stock" element={<InventoryStockPage />} />
          
          {/* Depolar Arası Sevk Sayfaları */}
          <Route path="inventory/warehouse-transfers" element={<WarehouseTransferListPage />} />
          <Route path="inventory/warehouse-transfers/:transferNumber" element={<WarehouseTransferDetailPage />} />
          <Route path="inventory/warehouse-transfers/create" element={<div>Yeni Sevk Oluşturma (Geliştirme Aşamasında)</div>} />
          
          {/* Sair İmalat Fişi Sayfaları */}
          <Route path="inventory/production-orders" element={<ProductionOrderListPage />} />
          <Route path="inventory/production-orders/new" element={<ProductionOrderFormPage />} />
          <Route path="inventory/production-orders/:orderNumber" element={<ProductionOrderDetailPage />} />
          <Route path="inventory/production-orders/:orderNumber/edit" element={<ProductionOrderFormPage />} />
          
          {/* Sair Sarf Fişi Sayfaları */}
          <Route path="inventory/consumption-orders" element={<ConsumptionOrderListPage />} />
          <Route path="inventory/consumption-orders/new" element={<ConsumptionOrderFormPage />} />
          <Route path="inventory/consumption-orders/:orderNumber" element={<ConsumptionOrderDetailPage />} />
          <Route path="inventory/consumption-orders/:orderNumber/edit" element={<ConsumptionOrderFormPage />} />
          
          {/* Finans Sayfaları */}
          <Route path="finance/exchange-rates" element={<ExchangeRatesPage />} />
          <Route path="finance/exchange-rate-settings" element={<Navigate to="/settings" replace />} />
          
          {/* Kasa Sayfaları */}
          <Route path="cash/receipts" element={<CashReceiptListPage />} />
          <Route path="cash/receipts/new" element={<CashReceiptPage />} />
          <Route path="cash/receipts/:voucherNumber" element={<CashReceiptPage />} />
          <Route path="cash/payments" element={<CashPaymentListPage />} />
          <Route path="cash/payments/new" element={<CashPaymentPage />} />
          <Route path="cash/payments/:voucherNumber" element={<CashPaymentPage />} />
          <Route path="cash/transfers" element={<CashTransferListPage />} />
          <Route path="cash/transfers/new" element={<CashTransferPage />} />
          <Route path="cash/transfers/:voucherNumber" element={<CashTransferPage />} />
          <Route path="cash/summary" element={<CashSummaryPage />} />
          <Route path="cash/transactions" element={<CashTransactionsPage />} />
          
          {/* Ayarlar Sayfaları */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/databases" element={<DatabaseList />} />
          <Route path="settings/user-databases" element={<UserDatabaseList />} />
          <Route path="settings/audit-logs" element={<AuditLogViewer />} />
          <Route path="settings/barcode-settings" element={<BarcodeSettingsForm />} />
          <Route path="settings/database-backup" element={<SettingsPage />} />
          <Route path="settings/sql-operations" element={<SettingsPage />} />
          <Route path="settings/exchange-rate" element={<SettingsPage />} />
          <Route path="settings/user-management" element={<SettingsPage />} />
          {/* CustomerTokenViewer rotaları kaldırıldı */}
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;
