import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { supabase } from "../supabaseClient";
import { jwtDecode } from "jwt-decode"
import AlertModal from "../components/AlertModal";
import RoleSelectionModal from "../components/RoleSelectionModal"

const Register = () => {
  const [formData, setFormData] = useState({
    Nombre: "",
    Apellido: "",
    CorreoElectronico: "",
    ContrasenaUser: "",
    confirmPassword: "",
    Tipo_usuario: "campesino",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [googleData, setGoogleData] = useState(null)
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const closeModal = () => {
    if (alertModal.type === "success") {
      setAlertModal((prev) => ({ ...prev, isOpen: false }));
      navigate("/login");
    } else {
      setAlertModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

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

  // 🧠 Registro del usuario
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    setAlertModal({
      isOpen: true,
      type: "error",
      title: "Error de Validación",
      message: "Por favor, corrige los errores en el formulario.",
    });
    return;
  }

  try {
    // 🔹 Verificar si el usuario ya existe en la tabla usuarios
    const { data: existingUser, error: checkError } = await supabase
      .from("usuarios")
      .select("id, cuenta_estado")
      .eq("correo", formData.CorreoElectronico)
      .maybeSingle();

    if (checkError) {
      console.warn("Error al verificar existencia:", checkError);
    }

    if (existingUser) {
      setAlertModal({
        isOpen: true,
        type: "warning",
        title: "Usuario ya registrado",
        message:
          "Ya existe una cuenta con este correo. Si no la has confirmado, revisa tu bandeja de entrada o carpeta de spam.",
      });
      return;
    }

    // 🔹 Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.CorreoElectronico,
      password: formData.ContrasenaUser,
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        setAlertModal({
          isOpen: true,
          type: "warning",
          title: "Correo no confirmado",
          message:
            "Este correo ya fue registrado pero no está confirmado. Revisa tu bandeja de entrada o carpeta de spam para activarlo.",
        });
        return;
      }
      throw authError;
    }

    const userId = authData?.user?.id || crypto.randomUUID();

    // 🔹 Subida opcional de foto de perfil
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
    }

    // 🔹 Validar rol
    const rolValido = ["inversionista", "campesino"].includes(
      formData.Tipo_usuario.toLowerCase()
    )
      ? formData.Tipo_usuario.toLowerCase()
      : "campesino";

    // 🔹 Insertar usuario en la tabla `usuarios`
    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        id: userId,
        nombre: formData.Nombre,
        apellido: formData.Apellido,
        correo: formData.CorreoElectronico,
        rol: rolValido,
        foto_perfil: photoUrl,
      },
    ]);
    if (insertError) throw insertError;

    // 🔹 Modal de éxito
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Registro Exitoso",
      message:
        "Tu cuenta ha sido creada correctamente. Revisa tu correo para confirmar antes de iniciar sesión.",
    });
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
    setAlertModal({
      isOpen: true,
      type: "error",
      title: "Error en el Registro",
      message:
        error.message ||
        "Ocurrió un error al registrar tu cuenta. Intenta nuevamente.",
    });
  }
};


const handleGoogleSuccess = async (credentialResponse) => {
  try {
    const { credential } = credentialResponse;

    if (!credential) {
      throw new Error("No se recibió la credencial de Google");
    }

    // 🔹 Decodificar JWT de Google
    const decoded = jwtDecode(credential);

    // 🔹 Guardar los datos relevantes en estado
    setGoogleData({
      email: decoded.email,
      name: decoded.name || decoded.given_name || "",
      given_name: decoded.given_name || "",
      family_name: decoded.family_name || "",
      picture: decoded.picture || "",
      credential: credential,
    });

    // 🔹 Mostrar selección de rol
    setShowRoleSelection(true);
  } catch (error) {
    console.error("Error decodificando Google credential:", error);
    setAlertModal({
      isOpen: true,
      type: "error",
      title: "Error",
      message:
        "No pudimos procesar tu registro con Google. Por favor, intenta nuevamente.",
    });
  }
};

const handleRoleSelection = async (role) => {
    if (!googleData) return

    try {

      const { data: existingUser, error: checkError } = await supabase
        .from("usuarios")
        .select("id, cuenta_estado")
        .eq("correo", googleData.email)
        .maybeSingle()

      if (checkError) {
        console.warn("Error al verificar el usuario existente:", checkError)
      }

      if (existingUser) {
        setAlertModal({
          isOpen: true,
          type: "warning",
          title: "Usuario ya registrado",
          message: "Ya existe una cuenta con este correo. Por favor, inicia sesión.",
        })
        setShowRoleSelection(false)
        setGoogleData(null)
        return
      }

      const randomPassword = Math.random().toString(36).slice(-12)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: googleData.email,
        password: randomPassword,
        options: {
          data: {
            provider: "google",
          },
        },
      })

      if (authError) {
        if (authError.message.includes("already registered")) {
          setAlertModal({
            isOpen: true,
            type: "warning",
            title: "Correo ya registrado",
            message: "Este correo ya está asociado a una cuenta. Por favor, inicia sesión.",
          })
          setShowRoleSelection(false)
          setGoogleData(null)
          return
        }
        throw authError
      }

      const userId = authData?.user?.id || crypto.randomUUID()

      const photoUrl = googleData.picture || null

      const { error: insertError } = await supabase.from("usuarios").insert([
        {
          id: userId,
          nombre: googleData.given_name || googleData.name.split(" ")[0],
          apellido: googleData.family_name || googleData.name.split(" ")[1] || "",
          correo: googleData.email,
          rol: role.toLowerCase(),
          foto_perfil: photoUrl,
          cuenta_estado: "activa",
        },
      ])

      if (insertError) throw insertError

      setAlertModal({
        isOpen: true,
        type: "success",
        title: "¡Registro Exitoso! 🎉",
        message: `Tu cuenta ha sido creada como ${role === "inversionista" ? "inversionista" : "campesino"}. Ahora puedes iniciar sesión.`,
      })

      setShowRoleSelection(false)
      setGoogleData(null)
    } catch (error) {
      console.error("Error en el registro de Google:", error)
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Error en el Registro",
        message: error.message || "Ocurrió un error al completar tu registro con Google. Intenta nuevamente.",
      })
      setShowRoleSelection(false)
      setGoogleData(null)
    }
  }

  return (
    <div className="form-container_impuest">
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
                    marginLeft: "10px",
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
            onError={() =>
              setAlertModal({
                isOpen: true,
                type: "error",
                title: "Error",
                message:
                  "El registro con Google falló. Por favor, inténtalo de nuevo.",
              })
            }
            theme="outline"
            size="large"
            width="436"
          />
        </div>

        <div className="color_p">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="custom-link">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </form>

      <RoleSelectionModal
        isOpen={showRoleSelection}
        googleData={googleData}
        onSelectRole={handleRoleSelection}
        onCancel={() => {
          setShowRoleSelection(false)
          setGoogleData(null)
        }}
      />
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

export default Register;
