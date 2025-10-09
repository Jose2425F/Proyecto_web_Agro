import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DescriptionAlerts from "../components/DescriptionAlerts";
import { GoogleLogin } from "@react-oauth/google";
import { useUser } from "../hooks/useUser.js";

const Login = () => {
  const { setUserId } = useUser();
  const [formData, setFormData] = useState({
    CorreoElectronico: "",
    ContrasenaUser: "",
  });
  const [alertInfo, setAlertInfo] = useState({
    severity: "",
    title: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (alertInfo.message) {
      timer = setTimeout(() => {
        setAlertInfo({ severity: "", title: "", message: "" });
      }, 3000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [alertInfo]);

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
      setAlertInfo({
        severity: "error",
        title: "Error de Validación",
        message: "Por favor, completa los campos requeridos.",
      });
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from("usuarios")
        .select("id, nombre, cuenta_estado")
        .eq("correo", formData.CorreoElectronico)
        .eq("password", formData.ContrasenaUser)
        .maybeSingle();

      if (error) throw error;

      if (!user) {
        setAlertInfo({
          severity: "warning",
          title: "Advertencia",
          message: "Correo o contraseña incorrectos.",
        });
        return;
      }

      if (user.cuenta_estado !== "activa") {
        setAlertInfo({
          severity: "error",
          title: "Acceso Denegado",
          message: "Tu cuenta no está activa. Contacta con soporte.",
        });
        return;
      }

      setUserId(user.id);
      localStorage.setItem("userId", user.id);

      setAlertInfo({
        severity: "success",
        title: "Bienvenido",
        message: `Hola ${user.nombre}, has iniciado sesión correctamente.`,
      });

      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (error) {
      setAlertInfo({
        severity: "error",
        title: "Error",
        message: `Error al iniciar sesión: ${error.message}`,
      });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;
    console.log("Google Credential:", credential);

    setAlertInfo({
      severity: "info",
      title: "Atención",
      message: "Funcionalidad en Desarrollo",
    });

    // setTimeout(() => {
    //   navigate("/home");
    // }, 1000);
  };

  return (
    <div className="form-container_impuest">
      <form onSubmit={handleSubmit}>
        <div >
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
              onError={() => {
                setAlertInfo({
                  severity: "error",
                  title: "Error",
                  message:
                    "El inicio de sesión con Google falló. Por favor, inténtalo de nuevo.",
                });
              }}
              theme="outline"
              size="large"
              width="436"
            />
          </div>
        </div>
      </form>

      {alertInfo.message && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}>
          <DescriptionAlerts
            severity={alertInfo.severity}
            title={alertInfo.title}
            message={alertInfo.message}
          />
        </div>
      )}
    </div>
  );
};

export default Login;
