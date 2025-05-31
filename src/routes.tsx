import React, { useEffect } from 'react';
import { Route, Routes, Navigate, useLocation, Outlet } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
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
import SettingsPage from './pages/SettingsPage';
import WholesaleInvoices from './pages/Invoices/WholesaleInvoices';
import CreateWholesaleInvoice from './pages/Invoices/CreateWholesaleInvoice';
import InvoiceListPage from './pages/invoice/InvoiceListPage';
import InvoiceDetailPage from './pages/invoice/InvoiceDetailPage';
import InvoiceEditPage from './pages/invoice/InvoiceEditPage';
import ProductPriceList from './pages/Products/ProductPriceList';
import ProductDetail from './pages/Products/ProductDetail';
import InventoryStockPage from './pages/inventory/InventoryStockPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;
