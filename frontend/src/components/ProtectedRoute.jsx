import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import AlertModal from "../components/AlertModal";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { userId, role } = useUser();
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setAlertData({
        type: "warning",
        title: "Acceso restringido",
        message: "Debes iniciar sesión para acceder a esta sección.",
      });
      setShowAlert(true);
    } else if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      setAlertData({
        type: "error",
        title: "Permiso denegado",
        message: "No tienes permisos para acceder a esta sección.",
      });
      setShowAlert(true);
    }
  }, [userId, role, allowedRoles]);

  const handleConfirm = () => {
    setShowAlert(false);
    navigate(-1);
  };

  if (showAlert) {
    return (
      <AlertModal
        isOpen={showAlert}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        confirmText="Entendido"
        onConfirm={handleConfirm}
        showCancel={false}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
