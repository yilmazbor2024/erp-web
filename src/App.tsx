import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { trTR } from '@mui/material/locale';
import CssBaseline from '@mui/material/CssBaseline';
// Remove DateAdapter imports for now
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers';
// import * as trLocale from 'date-fns/locale/tr';

// Layout components
import MainLayout from './components/Layout/Layout';

// Authentication
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';

// Dashboard
import Dashboard from './pages/Dashboard';

// Customer pages
import CustomersPage from './pages/Customers';
import CustomerForm from './pages/Customers/CustomerForm';
import CustomerDetail from './pages/Customers/CustomerDetail';

// Invoice pages
import InvoiceList from './pages/Invoices/InvoiceList';
import InvoiceForm from './pages/Invoices/InvoiceForm';
import InvoiceDetail from './pages/Invoices/InvoiceDetail';

// Mobile Menu
import Menu from './pages/Menu';

// Profile
import Profile from './pages/Profile';

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
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Mobile Menu Route */}
              <Route path="menu" element={<Menu />} />
              
              {/* Profile Route */}
              <Route path="profile" element={<Profile />} />
              
              {/* Customer Routes */}
              <Route path="customers">
                <Route index element={<CustomersPage />} />
                <Route path="new" element={<CustomerForm />} />
                <Route path=":customerCode" element={<CustomerDetail />} />
                <Route path="edit/:customerCode" element={<CustomerForm />} />
                
                {/* Adresler, İletişim ve E-posta alt sayfaları */}
                <Route path=":customerCode/addresses" element={<CustomerDetail tab="addresses" />} />
                <Route path=":customerCode/contacts" element={<CustomerDetail tab="contacts" />} />
                <Route path=":customerCode/emails" element={<CustomerDetail tab="emails" />} />
              </Route>
              
              {/* Invoice Routes */}
              <Route path="invoices">
                <Route index element={<InvoiceList />} />
                <Route path="new" element={<InvoiceForm />} />
                <Route path=":id" element={<InvoiceDetail />} />
                <Route path=":id/edit" element={<InvoiceForm />} />
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
