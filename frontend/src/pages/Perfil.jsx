"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useUser } from "../hooks/useUser"
import "./Perfil.css"

const Perfil = () => {
  const { userId } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [inversiones, setInversiones] = useState([])
  const [estadisticas, setEstadisticas] = useState({
    totalInvertido: 0,
    proyectosActivos: 0,
    retornoEstimado: 0,
  })
  const [editMode, setEditMode] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [alertInfo, setAlertInfo] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    foto: null,
    oldPassword: "",
    newPassword: "",
  })
  const [activeTab, setActiveTab] = useState("perfil")

  useEffect(() => {
    if (userId) {
      fetchUserData()
      fetchInversiones()
    }
  }, [userId])

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase.from("usuarios").select("*").eq("id", userId).single()

      if (error) throw error

      setUserData(data)
      setFormData({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        correo: data.correo || "",
        foto: null,
        oldPassword: "",
        newPassword: "",
      })
    } catch (error) {
      console.error("Error al cargar usuario:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInversiones = async () => {
    try {
      const { data, error } = await supabase
        .from("inversiones")
        .select(
          `
          *,
          proyectos (
            id,
            nombre,
            imagen_url,
            estado,
            costos,
            monto_recaudado
          )
        `,
        )
        .eq("id_inversor", userId)
        .order("fecha_inversion", { ascending: false })

      if (error) throw error

      setInversiones(data || [])

      const totalInvertido = data?.reduce((sum, inv) => sum + (inv.monto_invertido || 0), 0) || 0
      const proyectosActivos = new Set(data?.map((inv) => inv.id_proyecto)).size || 0
      const retornoEstimado = totalInvertido * 1.15

      setEstadisticas({
        totalInvertido,
        proyectosActivos,
        retornoEstimado,
      })
    } catch (error) {
      console.error("Error al cargar inversiones:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validar nombre y apellido
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setAlertInfo({
        severity: "warning",
        title: "Advertencia",
        message: "Nombre o apellido no pueden estar vacíos.",
      })
      setTimeout(() => setAlertInfo(null), 3000)
      setLoading(false)
      return
    }

    try {
      let photoUrl = userData.foto_perfil

      // Si hay nueva foto
      if (formData.foto) {
        if (photoUrl) {
          const previousFileMatch = photoUrl.match(/\/public\/avatars\/(.+)$/)
          const previousFile = previousFileMatch ? previousFileMatch[1] : null

          if (previousFile) {
            const { error: removeError } = await supabase.storage.from("avatars").remove([previousFile])

            if (removeError) {
              console.warn("No se pudo eliminar la foto anterior:", removeError.message)
            }
          }
        }

        // Subir nueva foto
        const fileExt = formData.foto.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, formData.foto)
        if (uploadError) throw uploadError

        const { data: publicData } = await supabase.storage.from("avatars").getPublicUrl(filePath)
        photoUrl = publicData.publicUrl

        const { error: updateError } = await supabase
          .from("usuarios")
          .update({ foto_perfil: photoUrl })
          .eq("id", userId)
        if (updateError) throw updateError
      }

      // Actualizar nombre y apellido
      const updateData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
      }

      // Cambiar contraseña si se ingresa
      if (formData.oldPassword && formData.newPassword) {
        if (formData.oldPassword !== userData.password) {
          setAlertInfo({
            severity: "error",
            title: "Error",
            message: "Contraseña antigua incorrecta.",
          })
          setTimeout(() => setAlertInfo(null), 3000)
          setLoading(false)
          return
        }
        updateData.password = formData.newPassword
      }

      // Actualizar DB
      const { error: finalUpdateError } = await supabase.from("usuarios").update(updateData).eq("id", userId)
      if (finalUpdateError) throw finalUpdateError

      // Actualizar estado local
      setUserData({ ...userData, ...updateData, foto_perfil: photoUrl })
      setFormData({
        ...formData,
        foto: null,
        oldPassword: "",
        newPassword: "",
      })
      setPhotoPreview(null)

      setAlertInfo({
        severity: "success",
        title: "¡Éxito!",
        message: "Perfil actualizado correctamente.",
      })
      setTimeout(() => {
        setAlertInfo(null)
        setEditMode(false)
      }, 3000)
    } catch (error) {
      console.error("Error al actualizar perfil:", error.message)
      setAlertInfo({
        severity: "error",
        title: "Error",
        message: "Ocurrió un error al actualizar el perfil.",
      })
      setTimeout(() => setAlertInfo(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target

    if (name === "foto" && files && files[0]) {
      const file = files[0]
      setFormData({ ...formData, foto: file })

      // Crear preview de la imagen
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  if (loading) {
    return (
      <div className="perfil-loading">
        <div className="spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="perfil-container">
      {alertInfo && (
        <div className={`alert-modern alert-${alertInfo.severity}`}>
          <div className="alert-icon">
            {alertInfo.severity === "success" && "✓"}
            {alertInfo.severity === "error" && "✕"}
            {alertInfo.severity === "warning" && "⚠"}
          </div>
          <div className="alert-content">
            <h4>{alertInfo.title}</h4>
            <p>{alertInfo.message}</p>
          </div>
          <button className="alert-close" onClick={() => setAlertInfo(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Header del perfil */}
      <div className="perfil-header">
        <div className="header-background"></div>
        <div className="header-content">
          <button onClick={() => navigate(-1)} className="btn-back-perfil">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>

          <div className="perfil-info">
            <div className="avatar-container">
              <img
                src={userData?.foto_perfil || "/placeholder.svg?height=120&width=120&query=user avatar"}
                alt={`${userData?.nombre} ${userData?.apellido}`}
                className="avatar-image"
              />
              <div className="avatar-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>

            <div className="perfil-details">
              <h1>
                {userData?.nombre} {userData?.apellido}
              </h1>
              <p className="perfil-email">{userData?.correo}</p>
              <div className="perfil-badges">
                <span className="badge-rol">{userData?.rol || "Inversionista"}</span>
                <span className={`badge-estado ${userData?.cuenta_estado?.toLowerCase()}`}>
                  {userData?.cuenta_estado || "Activa"}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="stats-quick">
            <div className="stat-quick-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <span className="stat-value">${estadisticas.totalInvertido.toLocaleString("es-CO")}</span>
                <span className="stat-label">Total Invertido</span>
              </div>
            </div>
            <div className="stat-quick-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <span className="stat-value">{estadisticas.proyectosActivos}</span>
                <span className="stat-label">Proyectos Activos</span>
              </div>
            </div>
            <div className="stat-quick-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <span className="stat-value">${estadisticas.retornoEstimado.toLocaleString("es-CO")}</span>
                <span className="stat-label">Retorno Estimado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="perfil-tabs">
        <button className={`tab ${activeTab === "perfil" ? "active" : ""}`} onClick={() => setActiveTab("perfil")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Mi Perfil
        </button>
        <button
          className={`tab ${activeTab === "inversiones" ? "active" : ""}`}
          onClick={() => setActiveTab("inversiones")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Mis Inversiones
        </button>
        <button
          className={`tab ${activeTab === "actividad" ? "active" : ""}`}
          onClick={() => setActiveTab("actividad")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Actividad
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="perfil-content">
        {activeTab === "perfil" && (
          <div className="tab-content">
            <div className="content-grid-perfil">
              <div className="perfil-card">
                <div className="card-header">
                  <h2>Información Personal</h2>
                  <button className="btn-edit" onClick={() => setEditMode(!editMode)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {editMode ? "Cancelar" : "Editar"}
                  </button>
                </div>

                {editMode ? (
                  <form onSubmit={handleSubmit} className="edit-form">
                    {/* Preview de foto */}
                    <div className="photo-upload-section">
                      <div className="photo-preview">
                        <img
                          src={
                            photoPreview || userData?.foto_perfil
                          }
                          alt="Preview"
                          className="photo-preview-img"
                        />
                      </div>
                      <div className="photo-upload-controls">
                        <label htmlFor="foto-input" className="btn-upload-photo">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          Cambiar Foto
                        </label>
                        <input
                          id="foto-input"
                          type="file"
                          name="foto"
                          accept="image/*"
                          onChange={handleChange}
                          style={{ display: "none" }}
                        />
                        <p className="photo-hint">JPG, PNG o GIF (máx. 5MB)</p>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group-perfil">
                        <label>Nombre</label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          placeholder="Tu nombre"
                          required
                        />
                      </div>
                      <div className="form-group-perfil">
                        <label>Apellido</label>
                        <input
                          type="text"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          placeholder="Tu apellido"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group-perfil">
                      <label>Correo Electrónico</label>
                      <input
                        type="email"
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        disabled
                      />
                      <span className="input-hint">El correo no se puede modificar</span>
                    </div>

                    <div className="form-divider">
                      <span>Cambiar Contraseña (Opcional)</span>
                    </div>

                    <div className="form-group-perfil">
                      <label>Contraseña Actual</label>
                      <input
                        type="password"
                        name="oldPassword"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        placeholder="Ingresa tu contraseña actual"
                      />
                    </div>

                    <div className="form-group-perfil">
                      <label>Nueva Contraseña</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Ingresa tu nueva contraseña"
                      />
                    </div>

                    <button type="submit" className="btn-save" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="btn-spinner"></div>
                          Guardando...
                        </>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="info-display">
                    <div className="info-row">
                      <span className="info-label">Nombre Completo</span>
                      <span className="info-value">
                        {userData?.nombre} {userData?.apellido}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Correo Electrónico</span>
                      <span className="info-value">{userData?.correo}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Rol</span>
                      <span className="info-value">{userData?.rol || "Inversionista"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Estado de Cuenta</span>
                      <span className={`badge-estado ${userData?.cuenta_estado?.toLowerCase()}`}>
                        {userData?.cuenta_estado || "Activa"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Miembro desde</span>
                      <span className="info-value">
                        {new Date(userData?.created_at).toLocaleDateString("es-CO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Estadísticas detalladas */}
              <div className="perfil-card">
                <div className="card-header">
                  <h2>Estadísticas de Inversión</h2>
                </div>
                <div className="stats-detailed">
                  <div className="stat-detailed-card">
                    <div className="stat-icon-large">💰</div>
                    <h3>${estadisticas.totalInvertido.toLocaleString("es-CO")}</h3>
                    <p>Total Invertido</p>
                    <div className="stat-progress">
                      <div className="progress-bar-stat">
                        <div className="progress-fill-stat" style={{ width: "75%" }}></div>
                      </div>
                      <span>75% del objetivo anual</span>
                    </div>
                  </div>
                  <div className="stat-detailed-card">
                    <div className="stat-icon-large">📊</div>
                    <h3>{estadisticas.proyectosActivos}</h3>
                    <p>Proyectos Activos</p>
                    <div className="stat-progress">
                      <div className="progress-bar-stat">
                        <div className="progress-fill-stat success" style={{ width: "60%" }}></div>
                      </div>
                      <span>Diversificación óptima</span>
                    </div>
                  </div>
                  <div className="stat-detailed-card">
                    <div className="stat-icon-large">📈</div>
                    <h3>${estadisticas.retornoEstimado.toLocaleString("es-CO")}</h3>
                    <p>Retorno Estimado</p>
                    <div className="stat-progress">
                      <div className="progress-bar-stat">
                        <div className="progress-fill-stat warning" style={{ width: "85%" }}></div>
                      </div>
                      <span>+15% de rendimiento</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "inversiones" && (
          <div className="tab-content">
            <div className="inversiones-grid">
              {inversiones.length > 0 ? (
                inversiones.map((inversion) => (
                  <div key={inversion.id} className="inversion-card">
                    <div className="inversion-image">
                      <img
                        src={
                          inversion.proyectos?.imagen_url
                        }
                        alt={inversion.proyectos?.nombre}
                      />
                      <span className={`estado-badge ${inversion.proyectos?.estado?.toLowerCase().replace(/ /g, "-")}`}>
                        {inversion.proyectos?.estado}
                      </span>
                    </div>
                    <div className="inversion-content">
                      <h3>{inversion.proyectos?.nombre}</h3>
                      <div className="inversion-details">
                        <div className="detail-item">
                          <span className="detail-label">Tipo</span>
                          <span className="detail-value">{inversion.tipo_inversion}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Monto</span>
                          <span className="detail-value">${inversion.monto_invertido?.toLocaleString("es-CO")}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Fecha</span>
                          <span className="detail-value">
                            {new Date(inversion.fecha_inversion).toLocaleDateString("es-CO")}
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn-ver-proyecto"
                        onClick={() => navigate(`/projects/${inversion.id_proyecto}`)}
                      >
                        Ver Proyecto
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No tienes inversiones aún</h3>
                  <p>Explora proyectos disponibles y comienza a invertir</p>
                  <button className="btn-explorar" onClick={() => navigate("/projects")}>
                    Explorar Proyectos
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "actividad" && (
          <div className="tab-content">
            <div className="actividad-timeline">
              {inversiones.length > 0 ? (
                inversiones.map((inversion, index) => (
                  <div key={inversion.id} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h4>Inversión realizada</h4>
                        <span className="timeline-date">
                          {new Date(inversion.fecha_inversion).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p>
                        Invertiste <strong>${inversion.monto_invertido?.toLocaleString("es-CO")}</strong> en el proyecto{" "}
                        <strong>{inversion.proyectos?.nombre}</strong> como <strong>{inversion.tipo_inversion}</strong>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No hay actividad reciente</h3>
                  <p>Tu historial de actividades aparecerá aquí</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Perfil
