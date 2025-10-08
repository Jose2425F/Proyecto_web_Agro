import React, { useState, useEffect } from "react";
import DescriptionAlerts from "../components/DescriptionAlerts";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { supabase } from "../supabaseClient";

const Register = () => {
  const [formData, setFormData] = useState({
    Nombre: "",
    Apellido: "",
    CorreoElectronico: "",
    ContrasenaUser: "",
    confirmPassword: "",
    Tipo_usuario: "campesino", // valor por defecto
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
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
    if (!formData.Nombre) newErrors.Nombre = "El nombre es requerido";
    if (!formData.Apellido) newErrors.Apellido = "El apellido es requerido";
    if (!formData.CorreoElectronico) {
      newErrors.CorreoElectronico = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.CorreoElectronico)) {
      newErrors.CorreoElectronico = "El formato del correo no es válido";
    }
    if (!formData.ContrasenaUser) {
      newErrors.ContrasenaUser = "La contraseña es requerida";
    } else if (formData.ContrasenaUser.length < 6) {
      newErrors.ContrasenaUser =
        "La contraseña debe tener al menos 6 caracteres";
    }
    if (formData.ContrasenaUser !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    document.getElementById("photo-upload").value = "";
  };

  // 🧠 Registro del usuario en la tabla `usuarios`
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setAlertInfo({
        severity: "error",
        title: "Error de Validación",
        message: "Por favor, corrige los errores en el formulario.",
      });
      return;
    }

    try {
      // 1️⃣ Insertar usuario sin foto
      const { data: userData, error: insertError } = await supabase
        .from("usuarios")
        .insert([
          {
            nombre: formData.Nombre,
            apellido: formData.Apellido,
            correo: formData.CorreoElectronico,
            password: formData.ContrasenaUser,
            rol: formData.Tipo_usuario,
            foto_perfil: null,
          },
        ])
        .select();

      if (insertError) {
        if (insertError.message.includes("usuarios_correo_key")) {
          setAlertInfo({
            severity: "error",
            title: "Error",
            message: "Ya existe un usuario con ese correo.",
          });
          return;
        }

        throw insertError;
      }

      const userId = userData[0].id;
      let photoUrl = null;

      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        photoUrl = publicData.publicUrl;

        const { error: updateError } = await supabase
          .from("usuarios")
          .update({ foto_perfil: photoUrl })
          .eq("id", userId);

        if (updateError) throw updateError;
      }
      setAlertInfo({
        severity: "success",
        title: "Registro Exitoso",
        message: "Tu cuenta ha sido creada correctamente.",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Error al registrar:", error);

      setAlertInfo({
        severity: "error",
        title: "Error",
        message: error.message.includes("usuarios_correo_key")
          ? "Ya existe un usuario con ese correo."
          : "Ocurrió un error al registrar el usuario.",
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
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Crear Cuenta</h1>

        <div>
          <label>Nombre</label>
          <input
            type="text"
            name="Nombre"
            value={formData.Nombre}
            onChange={handleChange}
          />
          {errors.Nombre && <p className="form-error">{errors.Nombre}</p>}
        </div>

        <div>
          <label>Apellido</label>
          <input
            type="text"
            name="Apellido"
            value={formData.Apellido}
            onChange={handleChange}
          />
          {errors.Apellido && <p className="form-error">{errors.Apellido}</p>}
        </div>

        <div>
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

        <div>
          <label>Confirmar Contraseña</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <p className="form-error">{errors.confirmPassword}</p>
          )}
        </div>

        <div style={{ margin: "20px 0" }}>
          <label>Foto de Perfil</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginTop: "10px",
            }}
          >
            <div style={{ flex: "0 0 120px", textAlign: "center" }}>
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ccc",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "#e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    border: "2px dashed #ccc",
                    textAlign: "center",
                  }}
                >
                  <span>Vista Previa</span>
                </div>
              )}
            </div>
            <div style={{ flex: "1" }}>
              <label
                htmlFor="photo-upload"
                style={{
                  display: "inline-block",
                  padding: "10px 15px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: "#f9f9f9",
                }}
              >
                {photo ? "Cambiar foto" : "Agregar foto"}
              </label>
              <input
                id="photo-upload"
                type="file"
                name="photo"
                onChange={handlePhotoChange}
                accept="image/*"
                style={{ display: "none" }}
              />
              {photo && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{
                    display: "inline-block",
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    color: "#333",
                    cursor: "pointer",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  Borrar
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label>Tipo de Usuario</label>
          <select
            name="Tipo_usuario"
            value={formData.Tipo_usuario}
            onChange={handleChange}
          >
            <option value="inversionista">Inversionista</option>
            <option value="campesino">Campesino</option>
          </select>
        </div>

        <button type="submit">Registrarse</button>

        <div className="form-divider">O</div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setAlertInfo({
                severity: "error",
                title: "Error",
                message:
                  "El registro con Google falló. Por favor, inténtalo de nuevo.",
              });
            }}
            theme="outline"
            size="large"
            width="436"
          />
        </div>

        <p>
          ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
        </p>
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

export default Register;
