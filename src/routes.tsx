import { createBrowserRouter, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Roles from './pages/settings/Roles';
import Users from './pages/settings/Users';
import UserGroups from './pages/settings/UserGroups';
import MainLayout from './components/Layout/MainLayout';
import PrivateRoute from './components/Auth/PrivateRoute';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout title="Dashboard">
          <Outlet />
        </MainLayout>
      </PrivateRoute>
    ),
    children: [
      {
        path: '',
        element: <Dashboard />
      },
      {
        path: 'settings/roles',
        element: <Roles />
      },
      {
        path: 'settings/users',
        element: <Users />
      },
      {
        path: 'settings/user-groups',
        element: <UserGroups />
      }
    ]
  }
]);

export default router;
