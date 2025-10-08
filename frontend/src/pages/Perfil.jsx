import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "../hooks/useUser.js";
import DescriptionAlerts from "../components/DescriptionAlerts";

const Perfil = () => {
  const { userId, setUserId } = useUser();
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    foto: null,
    oldPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  // Obtener userId desde localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) setUserId(storedUserId);
  }, []);

  // Traer datos del usuario
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setUserData(data);
          setFormData({
            nombre: data.nombre,
            apellido: data.apellido,
            foto: null,
            oldPassword: "",
            newPassword: "",
          });
        }
      } catch (err) {
        console.error("Error al obtener el usuario:", err.message);
      }
    };

    fetchUser();
  }, [userId]);

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto") {
      setFormData({ ...formData, foto: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Actualizar perfil
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🔹 Validar nombre y apellido
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setAlertInfo({
        severity: "warning",
        title: "Advertencia",
        message: "Nombre o apellido no pueden estar vacíos.",
      });
      setTimeout(() => setAlertInfo(null), 3000);
      setLoading(false);
      return;
    }

    try {
      let photoUrl = userData.foto_perfil;

      // 🔹 Si hay nueva foto
      if (formData.foto) {
        if (photoUrl) {
          const previousFileMatch = photoUrl.match(/\/public\/avatars\/(.+)$/);
          const previousFile = previousFileMatch ? previousFileMatch[1] : null;

          if (previousFile) {
            const { error: removeError } = await supabase.storage
              .from("avatars")
              .remove([previousFile]);

            if (removeError) {
              console.warn(
                "No se pudo eliminar la foto anterior:",
                removeError.message
              );
            }
          }
        }

        // 🔹 Subir nueva foto
        const fileExt = formData.foto.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, formData.foto);
        if (uploadError) throw uploadError;

        const { data: publicData } = await supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        photoUrl = publicData.publicUrl;

        const { error: updateError } = await supabase
          .from("usuarios")
          .update({ foto_perfil: photoUrl })
          .eq("id", userId);
        if (updateError) throw updateError;
      }

      // 🔹 Actualizar nombre y apellido
      const updateData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
      };

      // 🔹 Cambiar contraseña si se ingresa
      if (formData.oldPassword && formData.newPassword) {
        if (formData.oldPassword !== userData.password) {
          setAlertInfo({
            severity: "error",
            message: "Contraseña antigua incorrecta.",
          });
          setTimeout(() => setAlertInfo(null), 3000);
          setLoading(false);
          return;
        }
        updateData.password = formData.newPassword;
      }

      // 🔹 Actualizar DB
      const { error: finalUpdateError } = await supabase
        .from("usuarios")
        .update(updateData)
        .eq("id", userId);
      if (finalUpdateError) throw finalUpdateError;

      // 🔹 Actualizar estado local
      setUserData({ ...userData, ...updateData, foto_perfil: photoUrl });
      setFormData({
        ...formData,
        foto: null,
        oldPassword: "",
        newPassword: "",
      });

      setAlertInfo({
        severity: "success",
        message: "Perfil actualizado correctamente.",
      });
      setTimeout(() => setAlertInfo(null), 3000);
    } catch (error) {
      console.error("Error al actualizar perfil:", error.message);
      setAlertInfo({
        severity: "error",
        message: "Ocurrió un error al actualizar el perfil.",
      });
      setTimeout(() => setAlertInfo(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="perfil-container">
      <h1>Perfil de Usuario</h1>
      {userData ? (
        <form onSubmit={handleSubmit} className="perfil-form">
          <img
            src={formData.foto_preview || userData.foto_perfil}
            alt="Vista previa de perfil"
            className="perfil-image-preview"
          />
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Apellido:</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Foto de perfil:</label>
            <input
              type="file"
              name="foto"
              accept="image/*"
              onChange={handleChange}
            />
          </div>
          <div className="form-divider">Cambiar Contraseña</div>
          <div className="form-group">
            <label>Contraseña antigua:</label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="Deja en blanco si no quieres cambiarla"
            />
          </div>
          <div className="form-group">
            <label>Nueva contraseña:</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Deja en blanco si no quieres cambiarla"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-actualizar">
            {loading ? "Actualizando..." : "Actualizar perfil"}
          </button>
        </form>
      ) : (
        <p>Cargando...</p>
      )}

      {alertInfo && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}>
          <DescriptionAlerts
            severity={alertInfo.severity}
            title={alertInfo.severity === "success" ? "Éxito" : "Advertencia"}
            message={alertInfo.message}
          />
        </div>
      )}
    </div>
  );
};

export default Perfil;