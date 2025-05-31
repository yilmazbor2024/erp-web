import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rol kontrolünü geçici olarak devre dışı bırakıyoruz
  // if (roles && user && !roles.some(role => user.roles.includes(role))) {
  //   return <Navigate to="/" />;
  // }

  return <>{children}</>;
};

export default PrivateRoute;
