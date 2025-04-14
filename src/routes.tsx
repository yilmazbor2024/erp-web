import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import Customers from './pages/Customers';
import CustomerDetail from './pages/Customers/CustomerDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Siparisler from './pages/Siparisler';
import Urunler from './pages/Urunler';
import Users from './pages/Users';
import Profile from './pages/Profile';
import UsersPage from './pages/Users/index';
import RolesPage from './pages/Roles/index';
// Settings modülü bulunamadı, geçici olarak kaldırıyoruz
// import SettingsPage from './pages/settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Authenticated route component
interface PrivateRouteProps {
  children: React.ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps): JSX.Element {
  // loading özelliği mevcut olmadığından kaldırıyoruz
  const { isAuthenticated } = useAuth();

  // loading kontrolünü kaldırıyoruz
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

const AppRoutes: React.FC = () => (
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:customerCode" element={<CustomerDetail />} />
        <Route path="siparisler" element={<Siparisler />} />
        <Route path="urunler" element={<Urunler />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="profile" element={<Profile />} />
        {/* Settings modülü bulunamadı */}
        {/* <Route path="settings" element={<SettingsPage />} /> */}
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </AuthProvider>
);

export default AppRoutes;
