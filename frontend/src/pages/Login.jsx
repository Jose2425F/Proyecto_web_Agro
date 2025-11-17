import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AlertModal from "../components/AlertModal";
import { GoogleLogin } from "@react-oauth/google";
import { useUser } from "../hooks/useUser.js";
import {jwtDecode} from "jwt-decode";

const Login = () => {
  const { setUserId,setRole} = useUser();
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
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formData.CorreoElectronico,
      password: formData.ContrasenaUser,
    });

    if (authError) {
      if (authError.message.includes("Invalid login credentials")) {
        setAlertModal({
          isOpen: true,
          type: "warning",
          title: "Usuario no encontrado",
          message: "No existe una cuenta con este correo o la contraseña es incorrecta.",
        });
        return;
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error("No se pudo iniciar sesión. El objeto de usuario es nulo.");
    }

    // 🔹 Obtener información adicional del perfil
    const { data: userProfile, error: profileError } = await supabase
      .from("usuarios")
      .select("id, nombre, apellido, rol, cuenta_estado")
      .eq("id", authData.user.id)
      .single();

    if (profileError) throw profileError;

    // 🔹 Validar estado de la cuenta
    if (userProfile.cuenta_estado !== "activa") {
      await supabase.auth.signOut();
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Acceso Denegado",
        message: "Tu cuenta no está activa. Contacta con soporte.",
      });
      return;
    }

    // 🔹 Guardar sesión local (usar campo 'rol' de la tabla)
    setUserId(userProfile.id);
    setRole(userProfile.rol);
    localStorage.setItem("role", userProfile.rol);
    localStorage.setItem("userId", userProfile.id);

    // 🔹 Mostrar modal de bienvenida
    setAlertModal({
      isOpen: true,
      type: "success",
      title: `¡Bienvenido ${userProfile.nombre} ${userProfile.apellido}! 👋`,
      message: "Has iniciado sesión correctamente.",
    });

  } catch (error) {
    // 🔹 Manejar correo no confirmado
    if (error.message.includes("Email not confirmed")) {
      setAlertModal({
        isOpen: true,
        type: "warning",
        title: "Correo no confirmado",
        message: "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada o carpeta de spam.",
      });
      return;
    }

    setAlertModal({
      isOpen: true,
      type: "error",
      title: "Error al Iniciar Sesión",
      message: `Ocurrió un error al intentar iniciar sesión: ${error.message}`,
    });
  }
};
 

const handleGoogleSuccess = async (credentialResponse) => {

  try {
    const { credential } = credentialResponse;

    if (!credential) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "No se recibió la credencial de Google.",
      });
      return;
    }

    // 🔹 Decodificar JWT de Google
    const decoded = jwtDecode(credential);
    const googleEmail = decoded.email;
    const _googleName = decoded.name;

    // 🔹 Verificar si el usuario existe en la tabla usuarios
    const { data: existingUser, error: checkError } = await supabase
      .from("usuarios")
      .select("id, nombre, apellido, rol, cuenta_estado")
      .eq("correo", googleEmail)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116: no se encontraron filas, lo cual es esperado
      throw checkError;
    }

    if (!existingUser) {
      setAlertModal({
        isOpen: true,
        type: "warning",
        title: "Usuario no registrado",
        message:
          "No tienes una cuenta registrada. Por favor, regístrate primero.",
        onClose: () => navigate("/register"),
      });
      return;
    }

    // 🔹 Validar estado de la cuenta
    if (existingUser.cuenta_estado !== "activa") {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Acceso Denegado",
        message: "Tu cuenta no está activa. Contacta con soporte.",
      });
      return;
    }
    setUserId(existingUser.id);
    setRole(existingUser.rol);
    localStorage.setItem("role", existingUser.rol);
    localStorage.setItem("userId", existingUser.id);

    setAlertModal({
      isOpen: true,
      type: "success",
      title: `¡Bienvenido ${existingUser.nombre} ${existingUser.apellido}! 👋`,
      message: "Has iniciado sesión correctamente.",
    });
  } catch (error) {
    console.error("Google login error:", error);
    setAlertModal({
      isOpen: true,
      type: "error",
      title: "Error al iniciar sesión con Google",
      message: "Ocurrió un error. Por favor, inténtalo de nuevo.",
    });
  }
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
