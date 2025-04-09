import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Users from './pages/Users';
import MainLayout from './components/Layout/MainLayout';
import MenuPage from './pages/Menu';
import Profile from './pages/Profile';
import PrivateRoute from './components/Auth/PrivateRoute';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Roles from './pages/Roles';
import CustomersPage from './pages/Customers';
import { mainMenuItems } from './config/menuConfig';

const queryClient = new QueryClient();

const App: React.FC = () => {
  // Recursive function to generate routes from menu items
  const generateRoutes = (items: typeof mainMenuItems) => {
    return items.map((item, index) => {
      if (item.children) {
        return (
          <React.Fragment key={`parent-${item.id || index}`}>
            {item.children.map((child, childIndex) => (
              <Route
                key={`child-${child.path || childIndex}`}
                path={child.path}
                element={child.component || <div>{child.title}</div>}
              />
            ))}
          </React.Fragment>
        );
      }
      return item.path ? (
        <Route
          key={`route-${item.path}`}
          path={item.path}
          element={item.component || <div>{item.title}</div>}
        />
      ) : null;
    }).filter(Boolean);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route key="auth-login" path="/login" element={<Login />} />
            <Route key="auth-giris" path="/giris" element={<Navigate to="/login" replace />} />
            
            <Route
              key="layout-root"
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route key="home" index element={<Home />} />
              <Route key="users" path="users" element={<Users />} />
              <Route key="roles" path="roles" element={<Roles />} />
              <Route key="menu" path="menu" element={<MenuPage />} />
              <Route key="profile" path="profile" element={<Profile />} />
              <Route key="customers" path="customers" element={<CustomersPage />} />
              <Route key="page-profil" path="profil" element={<Navigate to="/profile" replace />} />
              {generateRoutes(mainMenuItems)}
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
