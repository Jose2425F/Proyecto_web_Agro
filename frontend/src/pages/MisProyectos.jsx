import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useUser } from "../hooks/useUser"
import "./MisProyectos.css"

const MisProyectos = () => {
  const { userId } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [proyectos, setProyectos] = useState([])
  const [inversiones, setInversiones] = useState([])
  const [userData, setUserData] = useState(null)
  const [stats, setStats] = useState({
    totalProyectos: 0,
    totalRecaudado: 0,
    proyectosActivos: 0,
    totalInversiones: 0,
  })
  const [filtro, setFiltro] = useState("todos")
  const [vistaActual, setVistaActual] = useState("dashboard")
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Obtener datos del usuario
      const { data: user, error: userError } = await supabase.from("usuarios").select("*").eq("id", userId).single()

      if (userError) throw userError
      setUserData(user)

      // Obtener proyectos del campesino
      const { data: proyectosData, error: proyectosError } = await supabase
        .from("proyectos")
        .select("*")
        .eq("id_usuario", userId)
        .order("fecha_creacion", { ascending: false })

      if (proyectosError) throw proyectosError
      setProyectos(proyectosData || [])

      // Obtener todas las inversiones de los proyectos del campesino
      const proyectosIds = proyectosData?.map((p) => p.id) || []
      let inversionesData = []

      if (proyectosIds.length > 0) {
        const { data, error: inversionesError } = await supabase
          .from("inversiones")
          .select(
            `
            *,
            usuarios (
              nombre,
              apellido,
              foto_perfil
            )
          `,
          )
          .in("id_proyecto", proyectosIds)
          .order("fecha_inversion", { ascending: false })

        if (inversionesError) throw inversionesError
        inversionesData = data || []
      }

      setInversiones(inversionesData)

      // Calcular estadísticas
      const totalProyectos = proyectosData?.length || 0
      const totalRecaudado = proyectosData?.reduce((sum, p) => sum + Number(p.monto_recaudado), 0) || 0
      const proyectosActivos =
        proyectosData?.filter((p) => p.estado === "Buscando Inversion" || p.estado === "En Produccion").length || 0
      const totalInversiones = inversionesData.length

      setStats({
        totalProyectos,
        totalRecaudado,
        proyectosActivos,
        totalInversiones,
      })
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const proyectosFiltrados = proyectos.filter((proyecto) => {
    if (filtro === "todos") return true
    if (filtro === "activos") return proyecto.estado === "Buscando Inversion" || proyecto.estado === "En Produccion"
    if (filtro === "completados") return proyecto.estado === "Completado"
    if (filtro === "cancelados") return proyecto.estado === "Cancelado"
    return true
  })

  const getInversionesPorProyecto = (proyectoId) => {
    return inversiones.filter((inv) => inv.id_proyecto === proyectoId)
  }

  const getEstadoBadgeClass = (estado) => {
    const estadoMap = {
      "Buscando Inversion": "buscando",
      "En Produccion": "produccion",
      Completado: "completado",
      Cancelado: "cancelado",
    }
    return estadoMap[estado] || "buscando"
  }

  if (loading) {
    return (
      <div className="mis-proyectos-loading">
        <div className="spinner-large"></div>
        <p>Cargando tus proyectos...</p>
      </div>
    )
  }

  return (
    <div className="mis-proyectos-container">
      {/* Header con perfil */}
      <div className="mis-proyectos-header">
        <div className="header-background"></div>
        <div className="header-content-wrapper">
          <div className="profile-section">
            <div className="profile-avatar">
              {userData?.foto_perfil ? (
                <img src={userData.foto_perfil || "/placeholder.svg"} alt={userData.nombre} />
              ) : (
                <div className="avatar-placeholder">
                  {userData?.nombre?.charAt(0)}
                  {userData?.apellido?.charAt(0)}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h1>
                {userData?.nombre} {userData?.apellido}
              </h1>
              <p className="profile-role">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                Campesino Emprendedor
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn-header" onClick={() => navigate("/crear-proyecto")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Crear Proyecto
            </button>
            <button className="btn-header-secondary" onClick={() => navigate("/perfil")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Mi Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Navegación de pestañas */}
      <div className="tabs-navigation">
        <button
          className={`tab-button ${vistaActual === "dashboard" ? "active" : ""}`}
          onClick={() => setVistaActual("dashboard")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Dashboard
        </button>
        <button
          className={`tab-button ${vistaActual === "proyectos" ? "active" : ""}`}
          onClick={() => setVistaActual("proyectos")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          Mis Proyectos
        </button>
        <button
          className={`tab-button ${vistaActual === "inversiones" ? "active" : ""}`}
          onClick={() => setVistaActual("inversiones")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Inversiones Recibidas
        </button>
      </div>

      <div className="mis-proyectos-content">
        {/* Vista Dashboard */}
        {vistaActual === "dashboard" && (
          <>
            {/* Estadísticas principales */}
            <div className="stats-grid">
              <div className="stat-card-modern">
                <div className="stat-icon-wrapper primary">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
                <div className="stat-content-modern">
                  <span className="stat-label-modern">Total Proyectos</span>
                  <span className="stat-value-modern">{stats.totalProyectos}</span>
                  <span className="stat-change neutral">En tu portafolio</span>
                </div>
              </div>

              <div className="stat-card-modern">
                <div className="stat-icon-wrapper success">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="stat-content-modern">
                  <span className="stat-label-modern">Total Recaudado</span>
                  <span className="stat-value-modern">${stats.totalRecaudado.toLocaleString("es-CO")}</span>
                  <span className="stat-change positive">De tus proyectos</span>
                </div>
              </div>

              <div className="stat-card-modern">
                <div className="stat-icon-wrapper warning">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="stat-content-modern">
                  <span className="stat-label-modern">Proyectos Activos</span>
                  <span className="stat-value-modern">{stats.proyectosActivos}</span>
                  <span className="stat-change positive">En progreso</span>
                </div>
              </div>

              <div className="stat-card-modern">
                <div className="stat-icon-wrapper info">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="stat-content-modern">
                  <span className="stat-label-modern">Total Inversiones</span>
                  <span className="stat-value-modern">{stats.totalInversiones}</span>
                  <span className="stat-change neutral">Recibidas</span>
                </div>
              </div>
            </div>

            {/* Proyectos recientes */}
            <div className="section-header">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                Proyectos Recientes
              </h2>
              <button className="btn-view-all" onClick={() => setVistaActual("proyectos")}>
                Ver todos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {proyectos.length > 0 ? (
              <div className="projects-grid">
                {proyectos.slice(0, 3).map((proyecto) => {
                  const progreso = (Number(proyecto.monto_recaudado) / Number(proyecto.costos)) * 100
                  const inversionesProyecto = getInversionesPorProyecto(proyecto.id)

                  return (
                    <div key={proyecto.id} className="project-card-modern">
                      <div className="project-image-wrapper">
                        <img
                          src={proyecto.imagen_url || "/placeholder.svg?height=300&width=400"}
                          alt={proyecto.nombre}
                        />
                        <div className={`project-badge ${getEstadoBadgeClass(proyecto.estado)}`}>{proyecto.estado}</div>
                      </div>
                      <div className="project-card-content">
                        <h3>{proyecto.nombre}</h3>
                        <p className="project-description">{proyecto.descripcion}</p>

                        <div className="project-stats-row">
                          <div className="project-stat">
                            <span className="stat-label-small">Recaudado</span>
                            <span className="stat-value-small">
                              ${Number(proyecto.monto_recaudado).toLocaleString("es-CO")}
                            </span>
                          </div>
                          <div className="project-stat">
                            <span className="stat-label-small">Meta</span>
                            <span className="stat-value-small">${Number(proyecto.costos).toLocaleString("es-CO")}</span>
                          </div>
                        </div>

                        <div className="project-progress-bar">
                          <div className="project-progress-fill" style={{ width: `${Math.min(progreso, 100)}%` }}></div>
                        </div>

                        <div className="project-footer">
                          <span className="inversiones-count">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            {inversionesProyecto.length} inversiones
                          </span>
                          <button
                            className="btn-view-project"
                            onClick={() => {
                              setProyectoSeleccionado(proyecto)
                              setVistaActual("inversiones")
                            }}
                          >
                            Ver Detalles
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🌱</div>
                <h3>Aún no tienes proyectos</h3>
                <p>Crea tu primer proyecto y comienza a recibir inversiones</p>
                <button className="btn-primary-large" onClick={() => navigate("/crear-proyecto")}>
                  Crear Proyecto
                </button>
              </div>
            )}
          </>
        )}

        {/* Vista Mis Proyectos */}
        {vistaActual === "proyectos" && (
          <>
            <div className="section-header">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                Todos los Proyectos
              </h2>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filtro === "todos" ? "active" : ""}`}
                  onClick={() => setFiltro("todos")}
                >
                  Todos
                </button>
                <button
                  className={`filter-btn ${filtro === "activos" ? "active" : ""}`}
                  onClick={() => setFiltro("activos")}
                >
                  Activos
                </button>
                <button
                  className={`filter-btn ${filtro === "completados" ? "active" : ""}`}
                  onClick={() => setFiltro("completados")}
                >
                  Completados
                </button>
                <button
                  className={`filter-btn ${filtro === "cancelados" ? "active" : ""}`}
                  onClick={() => setFiltro("cancelados")}
                >
                  Cancelados
                </button>
              </div>
            </div>

            {proyectosFiltrados.length > 0 ? (
              <div className="proyectos-table">
                <div className="table-header">
                  <span>Proyecto</span>
                  <span>Estado</span>
                  <span>Recaudado</span>
                  <span>Meta</span>
                  <span>Progreso</span>
                  <span>Inversiones</span>
                  <span>Acciones</span>
                </div>
                {proyectosFiltrados.map((proyecto) => {
                  const progreso = (Number(proyecto.monto_recaudado) / Number(proyecto.costos)) * 100
                  const inversionesProyecto = getInversionesPorProyecto(proyecto.id)

                  return (
                    <div key={proyecto.id} className="table-row">
                      <div className="table-cell project-cell">
                        <img
                          src={proyecto.imagen_url || "/placeholder.svg?height=60&width=80"}
                          alt={proyecto.nombre}
                          className="table-project-image"
                        />
                        <div>
                          <span className="project-name">{proyecto.nombre}</span>
                          <span className="project-id">ID: {proyecto.id}</span>
                        </div>
                      </div>
                      <div className="table-cell">
                        <span className={`estado-badge ${getEstadoBadgeClass(proyecto.estado)}`}>
                          {proyecto.estado}
                        </span>
                      </div>
                      <div className="table-cell">
                        <span className="monto-value">${Number(proyecto.monto_recaudado).toLocaleString("es-CO")}</span>
                      </div>
                      <div className="table-cell">
                        <span className="monto-value">${Number(proyecto.costos).toLocaleString("es-CO")}</span>
                      </div>
                      <div className="table-cell">
                        <div className="progress-cell">
                          <div className="mini-progress-bar">
                            <div className="mini-progress-fill" style={{ width: `${Math.min(progreso, 100)}%` }}></div>
                          </div>
                          <span className="progress-text">{progreso.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="table-cell">
                        <span className="inversiones-count-small">{inversionesProyecto.length}</span>
                      </div>
                      <div className="table-cell">
                        <button
                          className="btn-table-action"
                          onClick={() => {
                            setProyectoSeleccionado(proyecto)
                            setVistaActual("inversiones")
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No se encontraron proyectos</h3>
                <p>Intenta con otro filtro o crea un nuevo proyecto</p>
              </div>
            )}
          </>
        )}

        {/* Vista Inversiones Recibidas */}
        {vistaActual === "inversiones" && (
          <>
            <div className="section-header">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Inversiones Recibidas
                {proyectoSeleccionado && ` - ${proyectoSeleccionado.nombre}`}
              </h2>
              {proyectoSeleccionado && (
                <button
                  className="btn-view-all"
                  onClick={() => {
                    setProyectoSeleccionado(null)
                  }}
                >
                  Ver todas
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {inversiones.length > 0 ? (
              <div className="inversiones-table">
                <div className="table-header">
                  <span>Inversionista</span>
                  <span>Proyecto</span>
                  <span>Tipo</span>
                  <span>Monto</span>
                  <span>Fecha</span>
                  <span>Contacto</span>
                </div>
                {inversiones
                  .filter((inv) => !proyectoSeleccionado || inv.id_proyecto === proyectoSeleccionado.id)
                  .map((inversion) => {
                    const proyecto = proyectos.find((p) => p.id === inversion.id_proyecto)

                    return (
                      <div key={inversion.id} className="table-row">
                        <div className="table-cell investor-cell">
                          <div className="investor-avatar">
                            {inversion.usuarios?.foto_perfil ? (
                              <img
                                src={inversion.usuarios.foto_perfil || "/placeholder.svg"}
                                alt={inversion.usuarios.nombre}
                              />
                            ) : (
                              <div className="avatar-placeholder-small">
                                {inversion.usuarios?.nombre?.charAt(0)}
                                {inversion.usuarios?.apellido?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="investor-name">
                              {inversion.usuarios?.nombre} {inversion.usuarios?.apellido}
                            </span>
                            <span className="investor-id">ID: {inversion.id_inversor.slice(0, 8)}...</span>
                          </div>
                        </div>
                        <div className="table-cell">
                          <span className="project-name-small">{proyecto?.nombre}</span>
                        </div>
                        <div className="table-cell">
                          <span className={`type-badge ${inversion.tipo_inversion?.toLowerCase()}`}>
                            {inversion.tipo_inversion === "Capital" ? "Dueño Único" : "Accionista"}
                          </span>
                        </div>
                        <div className="table-cell">
                          <span className="monto-value">
                            ${Number(inversion.monto_invertido).toLocaleString("es-CO")}
                          </span>
                        </div>
                        <div className="table-cell">
                          <span className="fecha-value">
                            {new Date(inversion.fecha_inversion).toLocaleDateString("es-CO")}
                          </span>
                        </div>
                        <div className="table-cell">
                          <button className="btn-table-action success">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <h3>Aún no has recibido inversiones</h3>
                <p>Comparte tus proyectos para comenzar a recibir inversiones</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MisProyectos
