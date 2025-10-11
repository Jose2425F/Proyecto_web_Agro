import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./Projects.css"

const Projects = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState("todos")
  const [sortBy, setSortBy] = useState("recientes")
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    montoTotal: 0,
    montoRecaudado: 0,
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    filterAndSortProjects()
  }, [projects, searchTerm, filterEstado, sortBy])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("proyectos")
        .select(`
          *,
          usuarios:id_usuario (
            nombre,
            apellido,
            foto_perfil
          )
        `)
        .order("fecha_creacion", { ascending: false })

      if (error) throw error

      setProjects(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error("Error al cargar proyectos:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (projectsData) => {
    const total = projectsData.length
    const activos = projectsData.filter((p) => p.estado === "Buscando Inversión").length
    const montoTotal = projectsData.reduce((sum, p) => sum + (Number.parseFloat(p.costos) || 0), 0)
    const montoRecaudado = projectsData.reduce((sum, p) => sum + (Number.parseFloat(p.monto_recaudado) || 0), 0)

    setStats({ total, activos, montoTotal, montoRecaudado })
  }

  const filterAndSortProjects = () => {
    let filtered = [...projects]

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por estado
    if (filterEstado !== "todos") {
      filtered = filtered.filter((p) => p.estado === filterEstado)
    }

    // Ordenar
    switch (sortBy) {
      case "recientes":
        filtered.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
        break
      case "populares":
        filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        break
      case "progreso":
        filtered.sort((a, b) => {
          const progresoA = (a.monto_recaudado / a.costos) * 100
          const progresoB = (b.monto_recaudado / b.costos) * 100
          return progresoB - progresoA
        })
        break
      default:
        break
    }

    setFilteredProjects(filtered)
  }

  const formatMonto = (monto) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(monto)
  }

  const calcularProgreso = (proyecto) => {
    return ((proyecto.monto_recaudado / proyecto.costos) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="projects-page-loading">
        <div className="projects-page-spinner"></div>
        <p>Cargando proyectos...</p>
      </div>
    )
  }

  return (
    <div className="projects-page-container">
      {/* Header */}
      <div className="projects-page-header">
        <h1>Proyectos Disponibles</h1>
        <p className="projects-page-subtitle">
          Invierte en proyectos agrícolas y apoya el desarrollo del campo colombiano
        </p>
      </div>

      {/* Estadísticas */}
      <div className="projects-page-stats">
        <div className="projects-page-stat-card">
          <div className="projects-page-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className="projects-page-stat-info">
            <p className="projects-page-stat-label">Total Proyectos</p>
            <p className="projects-page-stat-value">{stats.total}</p>
          </div>
        </div>

        <div className="projects-page-stat-card">
          <div className="projects-page-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-14 0 9 9 0 0114 0z"
              />
            </svg>
          </div>
          <div className="projects-page-stat-info">
            <p className="projects-page-stat-label">Proyectos a Invertir</p>
            <p className="projects-page-stat-value">{stats.activos}</p>
          </div>
        </div>

        <div className="projects-page-stat-card">
          <div className="projects-page-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="projects-page-stat-info">
            <p className="projects-page-stat-label">Capital Total</p>
            <p className="projects-page-stat-value">{formatMonto(stats.montoTotal)}</p>
          </div>
        </div>

        <div className="projects-page-stat-card">
          <div className="projects-page-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="projects-page-stat-info">
            <p className="projects-page-stat-label">Recaudado</p>
            <p className="projects-page-stat-value">{formatMonto(stats.montoRecaudado)}</p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="projects-page-filters">
        <div className="projects-page-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="projects-page-filter-group">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="projects-page-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="Buscando Inversión">Buscando Inversión</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Completado">Completado</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="projects-page-select">
            <option value="recientes">Más recientes</option>
            <option value="populares">Más populares</option>
            <option value="progreso">Mayor progreso</option>
          </select>
        </div>
      </div>

      {/* Grid de proyectos */}
      {filteredProjects.length === 0 ? (
        <div className="projects-page-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3>No se encontraron proyectos</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="projects-page-grid">
          {filteredProjects.map((proyecto) => {
            const progreso = calcularProgreso(proyecto)
            const montoDisponible = proyecto.costos - proyecto.monto_recaudado

            return (
              <div key={proyecto.id} className="projects-page-card">
                <div className="projects-page-card-image">
                  <img
                    src={proyecto.imagen_url || "/placeholder.svg?height=200&width=400"}
                    alt={proyecto.nombre}
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=200&width=400"
                    }}
                  />
                  <span className={`projects-page-badge projects-page-badge-${proyecto.estado.toLowerCase().replace(/\s+/g, '-')}`}>
                    {proyecto.estado}
                  </span>
                </div>

                <div className="projects-page-card-content">
                  <h3>{proyecto.nombre}</h3>
                  <p className="projects-page-card-description">{proyecto.descripcion}</p>

                  <div className="projects-page-creator">
                    <img
                      src={proyecto.usuarios?.foto_perfil || "/placeholder.svg?height=40&width=40"}
                      alt={`${proyecto.usuarios?.nombre} ${proyecto.usuarios?.apellido}`}
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=40&width=40"
                      }}
                    />
                    <div>
                      <p className="projects-page-creator-label">Creado por</p>
                      <p className="projects-page-creator-name">
                        {proyecto.usuarios?.nombre} {proyecto.usuarios?.apellido}
                      </p>
                    </div>
                  </div>

                  <div className="projects-page-progress">
                    <div className="projects-page-progress-bar">
                      <div
                        className="projects-page-progress-fill"
                        style={{ width: `${Math.min(progreso, 100)}%` }}
                      ></div>
                    </div>
                    <div className="projects-page-progress-info">
                      <span>{formatMonto(proyecto.monto_recaudado)}</span>
                      <span>{progreso}%</span>
                    </div>
                    <p className="projects-page-progress-meta">Meta: {formatMonto(proyecto.costos)}</p>
                  </div>

                  <div className="projects-page-card-stats">
                    <div className="projects-page-card-stat">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{new Date(proyecto.fecha_creacion).toLocaleDateString("es-CO")}</span>
                    </div>
                    <div className="projects-page-card-stat">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{proyecto.likes_count || 0}</span>
                    </div>
                  </div>

                  <div className="projects-page-card-actions">
                    <button
                      className="projects-page-btn projects-page-btn-secondary"
                      onClick={() => navigate(`/projects/${proyecto.id}`)}
                    >
                      Ver Detalles
                    </button>
                    <button
                      className="projects-page-btn projects-page-btn-primary"
                      onClick={() => navigate(`/invertir/${proyecto.id}`)}
                      disabled={proyecto.estado !== "Buscando Inversión" || montoDisponible <= 0}
                    >
                      {montoDisponible <= 0 ? "Completo" : "Invertir"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Projects
