import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { trTR } from '@mui/material/locale';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
// Remove DateAdapter imports for now
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers';
// import * as trLocale from 'date-fns/locale/tr';

// Layout components
import MainLayout from './components/Layout/Layout';

// Authentication
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/Auth/AuthGuard';

// Session Management
import SessionTimeoutManager from './components/SessionManager/SessionTimeoutManager';
import SessionTimeoutAlert from './components/SessionManager/SessionTimeoutAlert';

// Dashboard
import Dashboard from './pages/Dashboard';

// Customer pages
import CustomersPage from './pages/Customers';
import CustomerCreate from './pages/Customers/CustomerCreate';
import CustomerEdit from './pages/Customers/CustomerEdit';
import CustomerView from './pages/Customers/CustomerView';
import CustomerDetail from './pages/Customers/CustomerDetail';

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

// Product pages
import ProductList from './pages/Products/ProductList';
import ProductDetail from './pages/Products/ProductDetail';
import ProductForm from './pages/Products/ProductForm';
import ProductPriceList from './pages/Products/ProductPriceList';

// Material pages
import MaterialList from './pages/Materials/MaterialList';

 
// Inventory pages
import InventoryStockPage from './pages/inventory/InventoryStockPage';

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

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <CssBaseline />
          <Router>
            <SessionTimeoutManager />
            <SessionTimeoutAlert />
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                
                {/* Mobile Menu Route */}
                <Route path="menu" element={<AuthGuard><Menu /></AuthGuard>} />
                
                {/* Profile Route */}
                <Route path="profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
                
                {/* Customer Routes */}
                <Route path="customers">
                  <Route index element={<AuthGuard><CustomersPage /></AuthGuard>} />
                  <Route path="new" element={<AuthGuard><CustomerCreate /></AuthGuard>} />
                  <Route path=":customerCode" element={<AuthGuard><CustomerView /></AuthGuard>} />
                  <Route path="edit/:customerCode" element={<AuthGuard><CustomerEdit /></AuthGuard>} />
                  
                  {/* Adresler, İletişim ve E-posta alt sayfaları */}
                  <Route path=":customerCode/addresses" element={<AuthGuard><CustomerDetail tab="addresses" /></AuthGuard>} />
                  <Route path=":customerCode/contacts" element={<AuthGuard><CustomerDetail tab="contacts" /></AuthGuard>} />
                  <Route path=":customerCode/emails" element={<AuthGuard><CustomerDetail tab="emails" /></AuthGuard>} />
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
                </Route>
                
                {/* Settings Routes */}
                <Route path="settings">
                  <Route path="user-groups" element={<Navigate to="/dashboard" replace />} />
                  <Route path="permissions" element={<Navigate to="/dashboard" replace />} />
                  <Route path="roles" element={<Navigate to="/dashboard" replace />} />
                  <Route path="logs" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Route>
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
