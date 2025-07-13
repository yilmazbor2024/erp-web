import React, { Suspense } from 'react';
import './styles/mobile-menu-fix.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { trTR } from '@mui/material/locale';
import CssBaseline from '@mui/material/CssBaseline';
// App.tsx dosyasında QueryClientProvider'a gerek yok, index.tsx'te zaten tanımlanmış
// Remove DateAdapter imports for now
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers';
// import * as trLocale from 'date-fns/locale/tr';

// Layout components
import MainLayout from './components/Layout/Layout';

// Authentication
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import { BarcodeSettingsProvider } from './contexts/BarcodeSettingsContext';
import AuthGuard from './components/Auth/AuthGuard';

// Session Management
import SessionTimeoutManager from './components/SessionManager/SessionTimeoutManager';
import SessionTimeoutAlert from './components/SessionManager/SessionTimeoutAlert';

// Dashboard
import Dashboard from './pages/Dashboard';
import ExchangeRateTest from './pages/ExchangeRateTest';

// Customer pages
import CustomersPage from './pages/Customers';
import CustomerCreate from './pages/Customers/CustomerCreate';
import CustomerEdit from './pages/Customers/CustomerEdit';
import CustomerView from './pages/Customers/CustomerView';
import CustomerDetail from './pages/Customers/CustomerDetail';
import CustomerRegistration from './pages/Customers/CustomerRegistration';
import CustomerRegister from './pages/CustomerRegister';

// Vendor pages
import VendorList from './pages/Vendors/VendorList';
import VendorCreate from './pages/Vendors/VendorCreate';
import VendorDetail from './pages/Vendors/VendorDetail';
import VendorEdit from './pages/Vendors/VendorEdit';

// Invoice pages
import InvoiceList from './pages/Invoices/InvoiceList';
import InvoiceForm from './pages/Invoices/InvoiceForm';
import InvoiceDetail from './pages/Invoices/InvoiceDetail';
import PurchaseInvoices from './pages/Invoices/PurchaseInvoices';
import SalesInvoices from './pages/Invoices/SalesInvoices';
import WholesaleInvoices from './pages/Invoices/WholesaleInvoices';
import WholesalePurchaseInvoices from './pages/Invoices/WholesalePurchaseInvoices';

// New Invoice pages
import InvoiceListPage from './pages/invoice/InvoiceListPage';
import InvoiceDetailPage from './pages/invoice/InvoiceDetailPage';
import InvoiceCreatePage from './pages/invoice/InvoiceCreatePage';

// Mobile Menu
import Menu from './pages/Menu';

// Profile
import Profile from './pages/Profile';
import ProfilePage from './pages/Profile/ProfilePage';

// User Management
import Users from './pages/Users';
import Roles from './pages/settings/Roles';
import UserGroups from './pages/settings/UserGroups';
import SettingsPage from './pages/settings/SettingsPage';

// Product pages
import ProductList from './pages/Products/ProductList';
import ProductDetail from './pages/Products/ProductDetail';
import ProductForm from './pages/Products/ProductForm';
import ProductPriceList from './pages/Products/ProductPriceList';

// Database Management pages
import DatabaseList from './pages/settings/DatabaseList';
import UserDatabaseList from './pages/settings/UserDatabaseList';
import AuditLogViewer from './components/admin/AuditLogViewer';
import BarcodeSettingsForm from './components/common/BarcodeSettingsForm';

// Material pages
import MaterialList from './pages/Materials/MaterialList';

 
// Inventory pages
import InventoryStockPage from './pages/inventory/InventoryStockPage';
import WarehouseTransferListPage from './pages/inventory/WarehouseTransferListPage';
import WarehouseTransferDetailPage from './pages/inventory/WarehouseTransferDetailPage';
import WarehouseTransferFormPage from './pages/inventory/WarehouseTransferFormPage';
import ProductionOrderListPage from './pages/inventory/ProductionOrderListPage';
import ProductionOrderDetailPage from './pages/inventory/ProductionOrderDetailPage';
import ProductionOrderFormPage from './pages/inventory/ProductionOrderFormPage';
import ConsumptionOrderListPage from './pages/inventory/ConsumptionOrderListPage';
import ConsumptionOrderDetailPage from './pages/inventory/ConsumptionOrderDetailPage';
import ConsumptionOrderFormPage from './pages/inventory/ConsumptionOrderFormPage';

// Exchange Rate pages
import ExchangeRatesPage from './pages/finance/ExchangeRatesPage';
import CrossRatesPage from './pages/finance/CrossRatesPage';
import HistoricalRatesPage from './pages/finance/HistoricalRatesPage';
import ExchangeRateManagementPage from './pages/admin/ExchangeRateManagementPage';

// Cash Management Pages
import CashReceiptPage from './pages/cash/CashReceiptPage';
import CashPaymentPage from './pages/cash/CashPaymentPage';
import CashTransferPage from './pages/cash/CashTransferPage';
import CashReceiptListPage from './pages/cash/CashReceiptListPage';
import CashPaymentListPage from './pages/cash/CashPaymentListPage';
import CashTransferListPage from './pages/cash/CashTransferListPage';
import CashTransactionsPage from './pages/cash/CashTransactionsPage';
import CashSummaryPage from './pages/cash/CashSummaryPage';

// Create a theme with Turkish locale
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
}, trTR);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <CssBaseline />
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SessionTimeoutManager />
          <SessionTimeoutAlert />
          <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Müşteri Kayıt Sayfası - Token ile erişilebilir */}
              <Route path="/customer-registration" element={<CustomerRegistration />} />
              
              {/* Token Bazlı Müşteri Kayıt Sayfası - CustomerCreate'in birebir kopyası */}
              <Route path="/customer-register" element={<CustomerRegister />} />
              
              {/* Başarılı Kayıt Sayfası */}
              <Route path="/registration-success" element={<div style={{padding: '50px', textAlign: 'center'}}>
                <h1>Kayıt Başarılı!</h1>
                <p>Müşteri kaydınız başarıyla oluşturulmuştur. Teşekkür ederiz.</p>
                <button onClick={() => window.location.href = '/'}>Ana Sayfaya Dön</button>
              </div>} />
              
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                <Route path="dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="exchange-rate-test" element={<AuthGuard><ExchangeRateTest /></AuthGuard>} />
                
                {/* Mobile Menu Route */}
                <Route path="menu" element={<AuthGuard><Menu /></AuthGuard>} />
                
                {/* Profile Route */}
                <Route path="profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
                
                {/* Customer Routes */}
                <Route path="customers">
                  <Route index element={<AuthGuard><CustomersPage /></AuthGuard>} />
                  <Route path="new" element={<AuthGuard><CustomerCreate /></AuthGuard>} />
                  <Route path="create" element={<AuthGuard><CustomerCreate /></AuthGuard>} />
                  <Route path="edit/:customerCode" element={<AuthGuard><CustomerEdit /></AuthGuard>} />
                  
                  {/* Adresler, İletişim ve E-posta alt sayfaları */}
                  <Route path=":customerCode/addresses" element={<AuthGuard><CustomerDetail tab="addresses" /></AuthGuard>} />
                  <Route path=":customerCode/contacts" element={<AuthGuard><CustomerDetail tab="contacts" /></AuthGuard>} />
                  <Route path=":customerCode/emails" element={<AuthGuard><CustomerDetail tab="emails" /></AuthGuard>} />
                  
                  {/* Dinamik müşteri kodu route'u en sonda olmalı */}
                  <Route path=":customerCode" element={<AuthGuard><CustomerView /></AuthGuard>} />
                </Route>
                
                {/* Invoice Routes - New Structure */}
                <Route path="invoice">
                  <Route path="list" element={<AuthGuard><InvoiceListPage /></AuthGuard>} />
                  <Route path="create" element={<AuthGuard><InvoiceCreatePage /></AuthGuard>} />
                  <Route path=":invoiceId" element={<AuthGuard><InvoiceDetailPage /></AuthGuard>} />
                </Route>
                
                {/* Invoice Routes - Old Structure (Redirects to new structure) */}
                <Route path="invoices">
                  <Route index element={<Navigate to="/invoice/list" replace />} />
                  <Route path="new" element={<Navigate to="/invoice/create" replace />} />
                  <Route path=":invoiceId" element={<Navigate to="/invoice/:invoiceId" replace />} />
                  <Route path="purchase" element={<Navigate to="/invoice/list?type=purchase" replace />} />
                  <Route path="sales" element={<Navigate to="/invoice/list?type=sales" replace />} />
                  <Route path="wholesale" element={<Navigate to="/invoice/list?type=wholesale" replace />} />
                  <Route path="wholesale-purchase" element={<Navigate to="/invoice/list?type=wholesale-purchase" replace />} />
                </Route>
                
                {/* Product Routes */}
                <Route path="products">
                  <Route index element={<AuthGuard><ProductList /></AuthGuard>} />
                  <Route path="new" element={<AuthGuard><ProductForm /></AuthGuard>} />
                  <Route path="price-list" element={<Navigate to="/price-lists/products" replace />} />
                  <Route path=":productCode" element={<AuthGuard><ProductDetail /></AuthGuard>} />
                  <Route path="edit/:productCode" element={<AuthGuard><ProductForm /></AuthGuard>} />
                </Route>
                
                {/* Product Price List Route */}
                <Route path="price-lists/products" element={<AuthGuard><ProductPriceList /></AuthGuard>} />
                
                {/* User Management Routes */}
                <Route path="users">
                  <Route index element={<AuthGuard><Users /></AuthGuard>} />
                </Route>
                
                <Route path="roles">
                  <Route index element={<AuthGuard><Roles /></AuthGuard>} />
                </Route>
                
                <Route path="user-groups">
                  <Route index element={<AuthGuard><UserGroups /></AuthGuard>} />
                </Route>
                
                {/* Vendor Routes */}
                <Route path="vendors">
                  <Route index element={<AuthGuard><VendorList /></AuthGuard>} />
                  <Route path="create" element={<AuthGuard><VendorCreate /></AuthGuard>} />
                  <Route path=":vendorCode" element={<AuthGuard><VendorDetail /></AuthGuard>} />
                  <Route path="edit/:vendorCode" element={<AuthGuard><VendorEdit /></AuthGuard>} />
                </Route>
                
                {/* Supplier Routes - Redirect to Vendors */}
                <Route path="suppliers">
                  <Route index element={<Navigate to="/vendors" replace />} />
                </Route>
                
                {/* Cashier Routes */}
                <Route path="cashier">
                  <Route path="payments" element={<Navigate to="/dashboard" replace />} />
                  <Route path="collections" element={<Navigate to="/dashboard" replace />} />
                </Route>
                
                {/* Materials Routes */}
                <Route path="materials">
                  <Route index element={<Navigate to="/materials/management" replace />} />
                  <Route path="management" element={<AuthGuard><MaterialList /></AuthGuard>} />
                  <Route path="barcodes" element={<Navigate to="/dashboard" replace />} />
                </Route>
                
                {/* Inventory Routes */}
                <Route path="inventory">
                  <Route index element={<Navigate to="/inventory/stock" replace />} />
                  <Route path="stock" element={<AuthGuard><InventoryStockPage /></AuthGuard>} />
                  <Route path="count" element={<Navigate to="/dashboard" replace />} />
                  <Route path="management" element={<Navigate to="/dashboard" replace />} />
                  <Route path="warehouse" element={<Navigate to="/dashboard" replace />} />
                  <Route path="branch" element={<Navigate to="/dashboard" replace />} />
                  <Route path="warehouse-transfers" element={<AuthGuard><WarehouseTransferListPage /></AuthGuard>} />
                  <Route path="warehouse-transfers/new" element={<AuthGuard><WarehouseTransferFormPage /></AuthGuard>} />
                  <Route path="warehouse-transfers/edit/:transferNumber" element={<AuthGuard><WarehouseTransferFormPage /></AuthGuard>} />
                  <Route path="warehouse-transfers/:transferNumber" element={<AuthGuard><WarehouseTransferDetailPage /></AuthGuard>} />
                  <Route path="production-orders" element={<AuthGuard><ProductionOrderListPage /></AuthGuard>} />
                  <Route path="production-orders/new" element={<AuthGuard><ProductionOrderFormPage /></AuthGuard>} />
                  <Route path="production-orders/edit/:innerNumber" element={<AuthGuard><ProductionOrderFormPage /></AuthGuard>} />
                  <Route path="production-orders/:innerNumber" element={<AuthGuard><ProductionOrderDetailPage /></AuthGuard>} />
                  <Route path="consumption-orders" element={<AuthGuard><ConsumptionOrderListPage /></AuthGuard>} />
                  <Route path="consumption-orders/new" element={<AuthGuard><ConsumptionOrderFormPage /></AuthGuard>} />
                  <Route path="consumption-orders/edit/:innerNumber" element={<AuthGuard><ConsumptionOrderFormPage /></AuthGuard>} />
                  <Route path="consumption-orders/:innerNumber" element={<AuthGuard><ConsumptionOrderDetailPage /></AuthGuard>} />
                </Route>
                
                {/* Finance Routes */}
                <Route path="finance">
                  <Route path="exchange-rates" element={<AuthGuard><ExchangeRatesPage /></AuthGuard>} />
                  <Route path="cross-rates" element={<AuthGuard><CrossRatesPage /></AuthGuard>} />
                  <Route path="historical-rates" element={<AuthGuard><HistoricalRatesPage /></AuthGuard>} />
                </Route>
                
                {/* Cash Management Routes */}
                <Route path="cash">
                  <Route path="receipts" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashReceiptListPage /></React.Suspense></AuthGuard>} />
                  <Route path="receipt" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashReceiptPage /></React.Suspense></AuthGuard>} />
                  <Route path="receipt/:voucherNumber" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashReceiptPage /></React.Suspense></AuthGuard>} />
                  
                  <Route path="payments" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashPaymentListPage /></React.Suspense></AuthGuard>} />
                  <Route path="payment" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashPaymentPage /></React.Suspense></AuthGuard>} />
                  <Route path="payment/:voucherNumber" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashPaymentPage /></React.Suspense></AuthGuard>} />
                  
                  <Route path="transfers" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashTransferListPage /></React.Suspense></AuthGuard>} />
                  <Route path="transfer" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashTransferPage /></React.Suspense></AuthGuard>} />
                  <Route path="transfer/:voucherNumber" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashTransferPage /></React.Suspense></AuthGuard>} />
                  
                  <Route path="summary" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashSummaryPage /></React.Suspense></AuthGuard>} />
                  <Route path="transactions" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><CashTransactionsPage /></React.Suspense></AuthGuard>} />
                </Route>
                
                {/* Admin Routes */}
                <Route path="admin">
                  <Route path="exchange-rates-management" element={<AuthGuard><ExchangeRateManagementPage /></AuthGuard>} />
                </Route>
                
                {/* Settings Routes */}
                <Route path="settings">
                  <Route index element={<AuthGuard><SettingsPage /></AuthGuard>} />
                  <Route path="user-groups" element={<Navigate to="/dashboard" replace />} />
                  <Route path="permissions" element={<Navigate to="/dashboard" replace />} />
                  <Route path="roles" element={<Navigate to="/dashboard" replace />} />
                  <Route path="logs" element={<Navigate to="/settings/audit-logs" replace />} />
                  <Route path="audit-logs" element={<AuthGuard><React.Suspense fallback={<div>Yükleniyor...</div>}><AuditLogViewer /></React.Suspense></AuthGuard>} />
                  <Route path="databases" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                  <Route path="user-databases" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                  <Route path="barcode" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                  <Route path="barcode-settings" element={<AuthGuard><BarcodeSettingsForm /></AuthGuard>} />
                  <Route path="database-backup" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                  <Route path="sql-operations" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                  <Route path="exchange-rate" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                  <Route path="user-management" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                </Route>
              </Route>
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;