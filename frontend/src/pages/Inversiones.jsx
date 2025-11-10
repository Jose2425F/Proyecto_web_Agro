"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useUser } from "../hooks/useUser"
import "./Inversiones.css"

const Inversiones = () => {
  const { userId } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [inversiones, setInversiones] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [userData, setUserData] = useState(null)
  const [stats, setStats] = useState({
    totalInvertido: 0,
    numeroProyectos: 0,
    retornoEstimado: 0,
  })
  const [filtro, setFiltro] = useState("todos")
  const [vistaActual, setVistaActual] = useState("dashboard")

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

      // Obtener inversiones del usuario
      const { data: inversionesData, error: inversionesError } = await supabase
        .from("inversiones")
        .select(`
          *,
          proyectos (
            id,
            nombre,
            descripcion,
            costos,
            monto_recaudado,
            produccion_estimada,
            estado,
            imagen_url
          )
        `)
        .eq("id_inversor", userId)
        .order("fecha_inversion", { ascending: false })

      if (inversionesError) throw inversionesError

      inversionesData?.forEach((inv) => {
        console.log(" Inversión:", {
          id: inv.id,
          tipo_inversion: inv.tipo_inversion,
          estado: inv.proyectos?.estado,
        })
      })

      setInversiones(inversionesData || [])

      // Calcular estadísticas
      const totalInvertido = inversionesData?.reduce((sum, inv) => sum + Number(inv.monto_invertido), 0) || 0
      const numeroProyectos = new Set(inversionesData?.map((inv) => inv.id_proyecto)).size || 0
      const retornoEstimado = totalInvertido * 1.25 // Estimación del 25% de retorno

      setStats({
        totalInvertido,
        numeroProyectos,
        retornoEstimado,
      })

      // Obtener proyectos disponibles
      const { data: proyectosData, error: proyectosError } = await supabase
        .from("proyectos")
        .select("*")
        .eq("estado", "Buscando Inversión")
        .order("fecha_creacion", { ascending: false })
        .limit(6)

      if (proyectosError) throw proyectosError
      setProyectos(proyectosData || [])
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const inversionesFiltradas = inversiones.filter((inv) => {
    if (filtro === "todos") return true
    if (filtro === "capital") return inv.tipo_inversion === "Capital"
    if (filtro === "accionista") return inv.tipo_inversion === "Accionista"
    return true
  })

  if (loading) {
    return (
      <div className="inversiones-loading">
        <div className="spinner-large"></div>
        <p>Cargando tu portafolio...</p>
      </div>
    )
  }

  return (
    <div className="inversiones-container">
      {/* Header con perfil */}
      <div className="inversiones-header">
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
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Inversionista Premium
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn-header" onClick={() => navigate("/projects")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Explorar Proyectos
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
          className={`tab-button ${vistaActual === "inversiones" ? "active" : ""}`}
          onClick={() => setVistaActual("inversiones")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Mis Inversiones
        </button>
        <button
          className={`tab-button ${vistaActual === "oportunidades" ? "active" : ""}`}
          onClick={() => setVistaActual("oportunidades")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Oportunidades
        </button>
      </div>

      <div className="inversiones-content">
        {/* Vista Dashboard */}
        {vistaActual === "dashboard" && (
          <>
            {/* Estadísticas principales */}
            <div className="stats-grid">
              <div className="stat-card-modern">
                <div className="stat-icon-wrapper primary">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="stat-content-modern">
                  <span className="stat-label-modern">Total Invertido</span>
                  <span className="stat-value-modern">${stats.totalInvertido.toLocaleString("es-CO")}</span>
                  <span className="stat-change positive">+12.5% este mes</span>
                </div>
              </div>

              <div className="stat-card-modern">
                <div className="stat-icon-wrapper success">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
                <div className="stat-content-modern">
                  <span className="stat-label-modern">Proyectos Activos</span>
                  <span className="stat-value-modern">{stats.numeroProyectos}</span>
                  <span className="stat-change neutral">En tu portafolio</span>
                </div>
              </div>

              <div className="stat-card-modern">
                <div className="stat-icon-wrapper warning">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="stat-content-modern">
                  <span className="stat-label-modern">Retorno Estimado</span>
                  <span className="stat-value-modern">${stats.retornoEstimado.toLocaleString("es-CO")}</span>
                  <span className="stat-change positive">+25% proyectado</span>
                </div>
              </div>
            </div>

            {/* Proyectos invertidos */}
            <div className="section-header">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                Tus Proyectos
              </h2>
              <button className="btn-view-all" onClick={() => setVistaActual("inversiones")}>
                Ver todos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {inversiones.length > 0 ? (
              <div className="projects-grid">
                {inversiones.slice(0, 3).map((inversion) => (
                  <div key={inversion.id} className="project-card-modern">
                    <div className="project-image-wrapper">
                      <img
                        src={
                          inversion.proyectos?.imagen_url
                        }
                        alt={inversion.proyectos?.nombre}
                      />
                      <div className="project-badge">
                        {inversion.tipo_inversion === "Capital" ? "Dueño Único" : "Accionista"}
                      </div>
                    </div>
                    <div className="project-card-content">
                      <h3>{inversion.proyectos?.nombre}</h3>
                      <p className="project-description">{inversion.proyectos?.descripcion}</p>

                      <div className="project-stats-row">
                        <div className="project-stat">
                          <span className="stat-label-small">Tu inversión</span>
                          <span className="stat-value-small">
                            ${Number(inversion.monto_invertido).toLocaleString("es-CO")}
                          </span>
                        </div>
                        <div className="project-stat">
                          <span className="stat-label-small">Progreso</span>
                          <span className="stat-value-small">
                            {(
                              (Number(inversion.proyectos?.monto_recaudado) / Number(inversion.proyectos?.costos)) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      </div>

                      <div className="project-progress-bar">
                        <div
                          className="project-progress-fill"
                          style={{
                            width: `${(Number(inversion.proyectos?.monto_recaudado) / Number(inversion.proyectos?.costos)) * 100}%`,
                          }}
                        ></div>
                      </div>

                      <button
                        className="btn-view-project"
                        onClick={() => navigate(`/projects/${inversion.id_proyecto}`)}
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
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>Aún no tienes inversiones</h3>
                <p>Explora proyectos disponibles y comienza a invertir hoy</p>
                <button className="btn-primary-large" onClick={() => navigate("/projects")}>
                  Explorar Proyectos
                </button>
              </div>
            )}
          </>
        )}

        {/* Vista Mis Inversiones */}
        {vistaActual === "inversiones" && (
          <>
            <div className="section-header">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Historial de Inversiones
              </h2>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filtro === "todos" ? "active" : ""}`}
                  onClick={() => setFiltro("todos")}
                >
                  Todos
                </button>
                <button
                  className={`filter-btn ${filtro === "capital" ? "active" : ""}`}
                  onClick={() => setFiltro("capital")}
                >
                  Capital
                </button>
                <button
                  className={`filter-btn ${filtro === "accionista" ? "active" : ""}`}
                  onClick={() => setFiltro("accionista")}
                >
                  Accionista
                </button>
              </div>
            </div>

            {inversionesFiltradas.length > 0 ? (
              <div className="inversiones-table">
                <div className="table-header">
                  <span>Proyecto</span>
                  <span>Tipo</span>
                  <span>Monto</span>
                  <span>Fecha</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>
                {inversionesFiltradas.map((inversion) => (
                  <div key={inversion.id} className="table-row">
                    <div className="table-cell project-cell">
                      <img
                        src={
                          inversion.proyectos?.imagen_url
                        }
                        alt={inversion.proyectos?.nombre}
                        className="table-project-image"
                      />
                      <div>
                        <span className="project-name">{inversion.proyectos?.nombre}</span>
                        <span className="project-id">ID: {inversion.id_proyecto}</span>
                      </div>
                    </div>
                    <div className="table-cell">
                      {inversion.tipo_inversion ? (
                        <span className={`type-badge ${inversion.tipo_inversion.toLowerCase()}`}>
                          {inversion.tipo_inversion === "Capital" ? "Dueño Único" : "Accionista"}
                        </span>
                      ) : (
                        <span className="type-badge capital">No especificado</span>
                      )}
                    </div>
                    <div className="table-cell">
                      <span className="monto-value">${Number(inversion.monto_invertido).toLocaleString("es-CO")}</span>
                    </div>
                    <div className="table-cell">
                      <span className="fecha-value">
                        {new Date(inversion.fecha_inversion).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                    <div className="table-cell">
                      {inversion.proyectos?.estado ? (
                        <span className={`estado-badge ${inversion.proyectos.estado.toLowerCase().replace(/ /g, "-")}`}>
                          {inversion.proyectos.estado}
                        </span>
                      ) : (
                        <span className="estado-badge buscando-inversion">Sin estado</span>
                      )}
                    </div>
                    <div className="table-cell">
                      <button
                        className="btn-table-action"
                        onClick={() => navigate(`/invertir/${inversion.id_proyecto}`)}
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
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No se encontraron inversiones</h3>
                <p>Intenta con otro filtro o explora nuevos proyectos</p>
              </div>
            )}
          </>
        )}

        {/* Vista Oportunidades */}
        {vistaActual === "oportunidades" && (
          <>
            <div className="section-header">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Nuevas Oportunidades
              </h2>
              <button className="btn-view-all" onClick={() => navigate("/projects")}>
                Ver todos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {proyectos.length > 0 ? (
              <div className="projects-grid">
                {proyectos.map((proyecto) => (
                  <div key={proyecto.id} className="project-card-modern">
                    <div className="project-image-wrapper">
                      <img
                        src={proyecto.imagen_url || "/placeholder.svg?height=300&width=400&query=agricultural project"}
                        alt={proyecto.nombre}
                      />
                      <div className="project-badge new">Nuevo</div>
                    </div>
                    <div className="project-card-content">
                      <h3>{proyecto.nombre}</h3>
                      <p className="project-description">{proyecto.descripcion}</p>

                      <div className="project-stats-row">
                        <div className="project-stat">
                          <span className="stat-label-small">Costo Total</span>
                          <span className="stat-value-small">${Number(proyecto.costos).toLocaleString("es-CO")}</span>
                        </div>
                        <div className="project-stat">
                          <span className="stat-label-small">Recaudado</span>
                          <span className="stat-value-small">
                            ${Number(proyecto.monto_recaudado).toLocaleString("es-CO")}
                          </span>
                        </div>
                      </div>

                      <div className="project-progress-bar">
                        <div
                          className="project-progress-fill"
                          style={{
                            width: `${(Number(proyecto.monto_recaudado) / Number(proyecto.costos)) * 100}%`,
                          }}
                        ></div>
                      </div>

                      <button className="btn-view-project primary" onClick={() => navigate(`/invertir/${proyecto.id}`)}>
                        Invertir Ahora
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
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🌱</div>
                <h3>No hay proyectos disponibles</h3>
                <p>Vuelve pronto para ver nuevas oportunidades de inversión</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Inversiones
