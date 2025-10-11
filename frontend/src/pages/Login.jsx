import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AlertModal from "../components/AlertModal";
import { GoogleLogin } from "@react-oauth/google";
import { useUser } from "../hooks/useUser.js";

const Login = () => {
  const { setUserId } = useUser();
  const [formData, setFormData] = useState({
    CorreoElectronico: "",
    ContrasenaUser: "",
  });

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // 🔹 Cierra la modal (y si es "Bienvenido", navega al home)
  const closeModal = () => {
    if (alertModal.type === "success") {
      setAlertModal((prev) => ({ ...prev, isOpen: false }));
      navigate("/home");
    } else {
      setAlertModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.CorreoElectronico)
      newErrors.CorreoElectronico = "El correo es requerido";
    if (!formData.ContrasenaUser)
      newErrors.ContrasenaUser = "La contraseña es requerida";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Error de Validación",
        message: "Por favor, completa los campos requeridos.",
      });
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, cuenta_estado")
        .eq("correo", formData.CorreoElectronico)
        .eq("password", formData.ContrasenaUser)
        .maybeSingle();

      if (error) throw error;

      if (!user) {
        setAlertModal({
          isOpen: true,
          type: "warning",
          title: "Advertencia",
          message: "Correo o contraseña incorrectos.",
        });
        return;
      }

      if (user.cuenta_estado !== "activa") {
        setAlertModal({
          isOpen: true,
          type: "error",
          title: "Acceso Denegado",
          message: "Tu cuenta no está activa. Contacta con soporte.",
        });
        return;
      }

      // 🔹 Guardar sesión
      setUserId(user.id);
      localStorage.setItem("userId", user.id);

      // 🔹 Mostrar modal de bienvenida
      setAlertModal({
        isOpen: true,
        type: "success",
        title: `Bienvenido ${user.nombre} ${user.apellido}!👋`,
        message: `Has iniciado sesión correctamente.`,
      });
    } catch (error) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: `Error al iniciar sesión: ${error.message}`,
      });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;
    console.log("Google Credential:", credential);

    setAlertModal({
      isOpen: true,
      type: "info",
      title: "Atención",
      message: "Funcionalidad en desarrollo.",
    });
  };

  return (
    <div className="form-container_impuest">
      <form onSubmit={handleSubmit}>
        <div>
          <h1>Iniciar Sesión</h1>

          <label>Correo Electrónico</label>
          <input
            type="email"
            name="CorreoElectronico"
            value={formData.CorreoElectronico}
            onChange={handleChange}
          />
          {errors.CorreoElectronico && (
            <p className="form-error">{errors.CorreoElectronico}</p>
          )}
        </div>

        <div>
          <label>Contraseña</label>
          <input
            type="password"
            name="ContrasenaUser"
            value={formData.ContrasenaUser}
            onChange={handleChange}
          />
          {errors.ContrasenaUser && (
            <p className="form-error">{errors.ContrasenaUser}</p>
          )}
        </div>

        <div className="color_p">
          <button type="submit">Iniciar Sesión</button>

          <p>
            ¿No tienes una cuenta?{" "}
            <Link to="/register" className="custom-link">
              Regístrate
            </Link>
          </p>

          <div className="form-divider">O</div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() =>
                setAlertModal({
                  isOpen: true,
                  type: "error",
                  title: "Error",
                  message:
                    "El inicio de sesión con Google falló. Por favor, inténtalo de nuevo.",
                })
              }
              theme="outline"
              size="large"
              width="436"
            />
          </div>
        </div>
      </form>

      {/* 🔹 Modal de alerta */}
      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onConfirm={closeModal}
        confirmText="Aceptar"
      />
    </div>
  );
};

export default Login;
