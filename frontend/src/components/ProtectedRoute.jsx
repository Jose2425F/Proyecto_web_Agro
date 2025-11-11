import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

const ProtectedRoute = () => {
  const { userId } = useUser();

  if (!userId) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
