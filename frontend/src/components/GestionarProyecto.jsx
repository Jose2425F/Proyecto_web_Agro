import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useNavigate } from 'react-router-dom';
import "./GestionarProyecto.css";
import DescriptionAlerts from "./DescriptionAlerts";
import RoleSelectionModal from "./RoleSelectionModal";



const GestionarProyecto = () => {
  const [alert, setAlert] = useState({ severity: "", title: "", message: "" });
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [alertInfo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    monto_recaudado: "",
    costos: "",
    produccion_estimada: "",
    fecha_creacion: "",
    imagen: null,
  });

  // 🔹 Cargar datos del proyecto al iniciar
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from("proyectos")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setProject(data);

        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion,
          monto_recaudado: data.monto_recaudado,
          costos: data.costos,
          produccion_estimada: data.produccion_estimada,
          fecha_creacion: data.fecha_creacion,
          imagen: data.imagen_url || null,
        });

        setPreviewUrl(data.imagen_url || null);
      } catch (err) {
        console.error("Error al obtener proyecto:", err.message);
        showAlert("error", "Error", "Error al obtener los detalles del proyecto.")
       /* setError("Error al obtener los detalles del proyecto.");*/
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // 🔹 Manejar cambios de los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      showAlert("warning", "Advertencia", "El archivo es demasiado grande. Máximo 5 MB.")
      return;
    }
    setFormData((prev) => ({ ...prev, imagen: file }));
    setPreviewUrl(URL.createObjectURL(file)); // 👈 Vista previa inmediata
  };



  const showAlert = (severity, title, message) => {
    setAlert({ severity, title, message })
    setTimeout(() => setAlert({ severity: "", title: "", message: "" }), 5000)
  }



  const handleDeleteProject = async () => {
    try {
      const { error } = await supabase
        .from("proyectos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      showAlert("success", "Proyecto Eliminado", "El proyecto se ha eliminado correctamente.");
      setTimeout(() => {
        navigate("/projects");
      }, 2000);
    } catch (err) {
      console.error("Error al eliminar proyecto:", err.message);
      showAlert("error", "Error al Eliminar", "Ocurrió un error al eliminar el proyecto.");
    }
  };

  // 🔹 Actualizar proyecto
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      showAlert("warning", "Error de Validación", "El nombre y la descripción son obligatorios ")
      setLoading(false);
      return;
    }

    if (formData.monto_recaudado < 0 || formData.costos < 0 || formData.produccion_estimada < 0) {
      showAlert("warning", "Error de Validación", "Los valores numéricos no pueden ser negativos.")
      setLoading(false);
      return;
    }

    try {
      let imageUrl = project.imagen_url;

      // ✅ Subir nueva imagen si se seleccionó
      if (formData.imagen instanceof File) {
        if (imageUrl) {
          const match = imageUrl.match(/proyectos\/.+\/(.+)$/);
          const previousFile = match ? match[1] : null;
          if (previousFile) {
            const { error: removeError } = await supabase.storage
              .from("proyectos")
              .remove([previousFile]);
            if (removeError)
              console.warn("No se pudo eliminar la imagen anterior:", removeError.message);
          }
        }

        const fileExt = formData.imagen.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("proyectos")
          .upload(filePath, formData.imagen);

        if (uploadError) throw uploadError;

        const { data: publicData } = await supabase.storage
          .from("proyectos")
          .getPublicUrl(filePath);

        imageUrl = publicData.publicUrl;
      }

      // ✅ Actualizar datos en Supabase
      const { error: updateError } = await supabase
        .from("proyectos")
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          monto_recaudado: formData.monto_recaudado,
          costos: formData.costos,
          produccion_estimada: formData.produccion_estimada,
          imagen_url: imageUrl,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      setProject({ ...project, ...formData, imagen_url: imageUrl });
      setFormData((prev) => ({ ...prev, imagen: null }));

      showAlert("success", "Actualizado", "Proyecto actualizado correctamente.")
    } catch (err) {
      console.error("Error al actualizar el proyecto:", err.message);
      showAlert("error", "Error Actualziar", "Ocurrió un error al actualizar el proyecto.")
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container">Cargando...</div>;
  if (error) return <div className="page-container">{error}</div>;
  if (!project) return <div className="page-container">Proyecto no encontrado.</div>;

  return (
    <div className="page-container">
    <div className="admin-panel-alerts">
        <DescriptionAlerts severity={alert.severity} title={alert.title} message={alert.message} />
    </div>
      <h1 className="title">
        Gestionar Proyecto: <span>{project.nombre}</span>
      </h1>
  
  

      <form className="project-form" onSubmit={handleUpdateProject}>
        {/* Columna izquierda */}
        <div className="form-left">
          <div className="form-group">
            <label>Nombre del Proyecto:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
       
            />
          </div>
  
          {/* <div className="form-group">
            <label>Monto Recaudado:</label>
            <input
              type="number"
              name="monto_recaudado"
              value={formData.monto_recaudado}
              onChange={handleInputChange}
              disabled={true}
            />
          </div> */}
  
          <div className="form-group">
            <label>Meta:</label>
            <input
              type="number"
              name="costos"
              value={formData.costos}
              onChange={handleInputChange}
            />
          </div>
  
          <div className="form-group">
            <label>Producción Estimada:</label>
            <input
              type="number"
              name="produccion_estimada"
              value={formData.produccion_estimada}
              onChange={handleInputChange}
            />
          </div>
  
          {/* Descripción */}
          <div className="form-group descripcion-imagen">
            <div className="descripcion-container">
              <label>Descripción:</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                required
                className="auto-textarea"
                rows="8"
              ></textarea>
            </div>
          </div>
        </div>
  
        {/* Columna derecha */}
        <div className="form-right">
          <div className="form-group">
            <label>Imagen del Proyecto:</label>
            <input type="file" onChange={handleImageChange} />
          </div>
  
          {/* 👇 Vista previa debajo del input */}
          {previewUrl && (
            <div className="preview-container-right">
              <img src={previewUrl} alt="Vista previa" className="preview-img" />
            </div>
          )}
  
          <button type="submit" className="btn-update" disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar Proyecto"}
          </button>
          <button type="button" className="btn-delete" onClick={() => setShowModal(true)} disabled={loading}>
            {loading ? "Eliminando proyecto..." : "Eliminar Proyecto"}
          </button>
          {showModal && (
        <RoleSelectionModal
          onConfirm={() => {
            setShowModal(false);
            handleDeleteProject();
          }}
          onClose={() => setShowModal(false)}
        />
      )}
        </div>
      </form>
  
      {alertInfo && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}>
          <div className={`alert alert-${alertInfo.severity}`}>{alertInfo.message}</div>
        </div>
      )}
    </div>
  );  
};

export default GestionarProyecto;
