import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useUser } from "../hooks/useUser"
import DescriptionAlerts from "../components/DescriptionAlerts"
import Avatar from "@mui/material/Avatar"
import "./AdminPanel.css"

const AdminPanel = () => {
  const { userId } = useUser()
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [alert, setAlert] = useState({ severity: "", title: "", message: "" })
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
  })

  useEffect(() => {
    fetchCurrentUser()
  }, [userId])

  useEffect(() => {
    if (currentUser) {
      fetchData()
    }
  }, [currentUser])

  const fetchCurrentUser = async () => {
    if (!userId) {
      return
    }

    try {
      const { data, error } = await supabase.from("usuarios").select("*").eq("id", userId).single()

      if (error) throw error

      if (data.rol !== "administrador" && data.rol !== "administradorsupremo") {
        showAlert("error", "Acceso Denegado", "No tienes permisos para acceder a este panel")
        return
      }

      setCurrentUser(data)
    } catch (error) {
      console.error("Error fetching current user:", error)
      showAlert("error", "Error", "No se pudo verificar los permisos del usuario")
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, projectsRes] = await Promise.all([
        supabase.from("usuarios").select("*").order("created_at", { ascending: false }),
        supabase.from("proyectos").select("*, usuarios(nombre, apellido)").order("fecha_creacion", { ascending: false }),
      ])

      let updatedUsers = []

      if (projectsRes.data) {
        setProjects(projectsRes.data)
        setStats((prev) => ({
          ...prev,
          totalProjects: projectsRes.data.length,
          activeProjects: projectsRes.data.filter((p) => p.estado === "Buscando Inversión").length,
        }))

        const projectCounts = projectsRes.data.reduce((acc, project) => {
          const userId = project.id_usuario
          acc[userId] = (acc[userId] || 0) + 1
          return acc
        }, {})

        if (usersRes.data) {
          updatedUsers = usersRes.data.map((user) => ({
            ...user,
            total_proyectos: projectCounts[user.id] || 0,
          }))
          setUsers(updatedUsers)
          setStats((prev) => ({
            ...prev,
            totalUsers: updatedUsers.length,
            activeUsers: updatedUsers.filter((u) => u.cuenta_estado === "activa").length,
          }))
        }
      } else if (usersRes.data) {
        setUsers(usersRes.data)
        setStats((prev) => ({
          ...prev,
          totalUsers: usersRes.data.length,
          activeUsers: usersRes.data.filter((u) => u.cuenta_estado === "activa").length,
        }))
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      showAlert("error", "Error", "No se pudieron cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (severity, title, message) => {
    setAlert({ severity, title, message })
    setTimeout(() => setAlert({ severity: "", title: "", message: "" }), 5000)
  }

  const handleUpdateUser = async (user) => {
    if (!user.nombre || !user.apellido) {
      showAlert("error", "Error de Validación", "El nombre y apellido no pueden estar vacíos")
      return
    }

    if (user.id === userId && user.rol !== currentUser.rol) {
      showAlert("error", "Error", "No puedes cambiar tu propio rol")
      return
    }

    if (
      currentUser.rol === 'administrador' && 
      (editingUser.rol.includes('administrador') || user.rol.includes('administrador')) && 
      editingUser.rol !== user.rol 
    ) {
      showAlert("error", "Acceso Denegado", "Un administrador regular solo puede cambiar el rol de Campesinos o Inversionistas.")
      return
    }
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          cuenta_estado: user.cuenta_estado,
        })
        .eq("id", user.id)

      if (error) throw error

      setUsers(users.map((u) => (u.id === user.id ? user : u)))
      setEditingUser(null)
      showAlert("success", "Éxito", "Usuario actualizado correctamente")

      setStats((prev) => ({
        ...prev,
        activeUsers: users.filter((u) => u.cuenta_estado === "activa").length,
      }))
    } catch (error) {
      console.error("Error updating user:", error)
      showAlert("error", "Error", "No se pudo actualizar el usuario")
    }
  }

  const getAvailableRoles = (editingUserId) => {
    if (editingUserId === userId) {
      return [currentUser.rol]
    }

    if (currentUser.rol === "administradorsupremo") {
      return ["inversionista", "campesino", "administrador", "administradorsupremo"]
    }

    if (currentUser.rol === "administrador") {
      if (users.find(u => u.id === editingUserId)?.rol.includes('administrador')) {
          return [users.find(u => u.id === editingUserId)?.rol]
      }
      return ["inversionista", "campesino"]
    }

    return []
  }

  const handleUpdateProject = async (project) => {
    if (
      !project.nombre ||
      !project.descripcion ||
      project.costos === null ||
      project.monto_recaudado === null
    ) {
      showAlert("error", "Error de Validación", "El nombre, descripción, costos y monto recaudado no pueden estar vacíos.")
      return
    }

    try {
      const { error } = await supabase
        .from("proyectos")
        .update({
          nombre: project.nombre,
          descripcion: project.descripcion,
          estado: project.estado,
          costos: project.costos,
          monto_recaudado: project.monto_recaudado,
        })
        .eq("id", project.id)

      if (error) throw error

      setProjects(projects.map((p) => (p.id === project.id ? project : p)))
      setEditingProject(null)
      showAlert("success", "Éxito", "Proyecto actualizado correctamente")

      setStats((prev) => ({
        ...prev,
        activeProjects: projects.filter((p) => p.estado === "buscando inversion").length,
      }))
    } catch (error) {
      console.error("Error updating project:", error)
      showAlert("error", "Error", "No se pudo actualizar el proyecto")
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("¿Estás seguro de eliminar este proyecto?")) return

    try {
      const { error } = await supabase.from("proyectos").delete().eq("id", projectId)

      if (error) throw error

      setProjects(projects.filter((p) => p.id !== projectId))
      showAlert("success", "Éxito", "Proyecto eliminado correctamente")

      setStats((prev) => ({
        ...prev,
        totalProjects: prev.totalProjects - 1,
      }))
    } catch (error) {
      console.error("Error deleting project:", error)
      showAlert("error", "Error", "No se pudo eliminar el proyecto")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.rol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredProjects = projects.filter(
    (project) =>
      project.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.usuarios?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.usuarios?.apellido?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!userId) {
    return (
      <div className="admin-panel-container">
        <div className="admin-loading">
        <div className="loading-spinner"></div>
          <h1>No puedes entrar aquí</h1>
          <p>Inicia sesión con una cuenta de administrador para acceder</p>
          <span className="loader"></span>
          <button onClick={() => window.location.href = "/login"}>Iniciar Sesión</button>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="admin-panel-container">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Verificando permisos, por favor espera. Si tarda es porque te falta el rango...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-panel-alerts">
        <DescriptionAlerts severity={alert.severity} title={alert.title} message={alert.message} />
      </div>

      <div className="admin-panel-header">
        <h1>Panel de {currentUser.rol === "administradorsupremo" ? "Administrador Supremo" : "Administrador"}</h1>
        <p>Gestiona usuarios y proyectos de la plataforma</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon users-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Usuarios</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon active-icon">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.activeUsers}</h3>
            <p>Usuarios Activos</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon projects-icon">
            <i className="fas fa-project-diagram"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>Total Proyectos</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon investment-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.activeProjects}</h3>
            <p>Buscando Inversión</p>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          <i className="fas fa-users"></i>
          <span>Usuarios</span>
          <span className="tab-badge">{users.length}</span>
        </button>
        <button
          className={`admin-tab ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <i className="fas fa-project-diagram"></i>
          <span>Proyectos</span>
          <span className="tab-badge">{projects.length}</span>
        </button>
      </div>

      <div className="admin-search-container">
        <div className="admin-search-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder={activeTab === "users" ? "Buscar usuarios..." : "Buscar proyectos..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm("")}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      ) : (
        <>
          {activeTab === "users" && (
            <div className="admin-content">
              {filteredUsers.length === 0 ? (
                <div className="admin-empty-state">
                  <i className="fas fa-user-slash"></i>
                  <h3>No se encontraron usuarios</h3>
                  <p>Intenta con otro término de búsqueda</p>
                </div>
              ) : (
                <div className="admin-grid">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="admin-card user-card">
                      <div className="card-header">
                        <div className="user-avatar-section">
                          <Avatar src={user.foto_perfil} alt={user.nombre} sx={{ width: 60, height: 60 }} />
                          <div className="user-basic-info">
                            <h3>
                              {user.nombre} {user.apellido}
                            </h3>
                            <p className="user-email">{user.email}</p>
                          </div>
                        </div>
                        <span className={`status-badge ${user.cuenta_estado === "activa" ? "active" : "inactive"}`}>
                          {user.cuenta_estado === "activa" ? "Activa" : "Inactiva"}
                        </span>
                      </div>

                      {editingUser?.id === user.id ? (
                        <div className="edit-form">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Nombre</label>
                              <input
                                type="text"
                                value={editingUser.nombre}
                                onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                              />
                            </div>
                            <div className="form-group">
                              <label>Apellido</label>
                              <input
                                type="text"
                                value={editingUser.apellido}
                                onChange={(e) => setEditingUser({ ...editingUser, apellido: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Rol</label>
                              <select
                                value={editingUser.rol}
                                onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value })}
                                disabled={editingUser.id === userId}
                              >
                                {getAvailableRoles(editingUser.id).map((role) => (
                                  <option key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </option>
                                ))}
                              </select>
                              {editingUser.id === userId && (
                                <small style={{ color: "#aeb1a4ff", fontSize: "0.8rem" }}>
                                  No puedes cambiar tu propio rol 
                                </small>
                              )}
                            </div>
                            <div className="form-group">
                              <label>Estado de Cuenta</label>
                              <select
                                value={editingUser.cuenta_estado}
                                onChange={(e) => setEditingUser({ ...editingUser, cuenta_estado: e.target.value })}
                              >
                                <option value="activa">Activa</option>
                                <option value="inactiva">Inactiva</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-actions">
                            <button className="btn-save" onClick={() => handleUpdateUser(editingUser)}>
                              <i className="fas fa-check"></i> Guardar
                            </button>
                            <button className="btn-cancel" onClick={() => setEditingUser(null)}>
                              <i className="fas fa-times"></i> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="card-info">
                            <div className="info-item">
                              <i className="fas fa-user"></i>
                              <span>{user.nombre} {user.apellido || "No especificado"}</span>
                            </div>
                            <div className="info-item">
                              <i className="fas fa-user-tag"></i>
                              <span className={`role-badge role-${user.rol}`}>{user.rol}</span>
                            </div>
                            <div className="info-item">
                              <i className="fas fa-project-diagram"></i>
                              <span>Total Proyectos: {user.total_proyectos || 0}</span>
                            </div>
                            <div className="info-item">
                              <i className="fas fa-calendar"></i>
                              <span>{new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="card-actions">
                            <button className="btn-edit" onClick={() => setEditingUser({ ...user })}
                              disabled={user.rol === 'administradorsupremo' && currentUser?.rol !== 'administradorsupremo'}
                              >
                              <i className="fas fa-edit"></i> Editar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div className="admin-content">
              {filteredProjects.length === 0 ? (
                <div className="admin-empty-state">
                  <i className="fas fa-folder-open"></i>
                  <h3>No se encontraron proyectos</h3>
                  <p>Intenta con otro término de búsqueda</p>
                </div>
              ) : (
                <div className="admin-grid">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="admin-card project-card">
                      <div className="project-image-wrapper">
                        <img
                          src={project.imagen_url || "/placeholder.svg?height=200&width=400"}
                          alt={project.nombre}
                          className="project-image"
                        />
                        <span className={`estado-badge estado-${project.estado.replace(" ", "-")}`}>
                          {project.estado}
                        </span>
                      </div>

                      {editingProject?.id === project.id ? (
                        <div className="edit-form">
                          <div className="form-group">
                            <label>Nombre del Proyecto</label>
                            <input
                              type="text"
                              value={editingProject.nombre}
                              onChange={(e) => setEditingProject({ ...editingProject, nombre: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Descripción</label>
                            <textarea
                              value={editingProject.descripcion}
                              onChange={(e) => setEditingProject({ ...editingProject, descripcion: e.target.value })}
                              rows="3"
                            />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Estado</label>
                              <select
                                value={editingProject.estado}
                                onChange={(e) => setEditingProject({ ...editingProject, estado: e.target.value })}
                              >
                                <option value="Buscando Inversión">Buscando Inversión</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Completado">Completado</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Costos ($)</label>
                              <input
                                type="number"
                                value={editingProject.costos}
                                onChange={(e) =>
                                  setEditingProject({ ...editingProject, costos: Number.parseFloat(e.target.value) })
                                }
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Monto Recaudado ($)</label>
                            <input
                              type="number"
                              value={editingProject.monto_recaudado}
                              onChange={(e) =>
                                setEditingProject({
                                  ...editingProject,
                                  monto_recaudado: Number.parseFloat(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="form-actions">
                            <button className="btn-save" onClick={() => handleUpdateProject(editingProject)}>
                              <i className="fas fa-check"></i> Guardar
                            </button>
                            <button className="btn-cancel" onClick={() => setEditingProject(null)}>
                              <i className="fas fa-times"></i> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="project-content">
                            <h3>{project.nombre}</h3>
                            <p className="project-description">{project.descripcion}</p>

                            <div className="project-progress">
                              <div className="progress-bar-container">
                                <div
                                  className="progress-bar"
                                  style={{
                                    width: `${Math.min((project.monto_recaudado / project.costos) * 100, 100)}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="progress-info">
                                <span>${project.monto_recaudado?.toLocaleString() || 0}</span>
                                <span>${project.costos?.toLocaleString() || 0}</span>
                              </div>
                            </div>

                            <div className="project-meta">
                              <div className="meta-item">
                                <i className="fas fa-user"></i>
                                <span>Creador: {project.usuarios?.nombre} {project.usuarios?.apellido}</span>
                              </div>
                              <div className="meta-item">
                                <i className="fas fa-calendar"></i>
                                <span>{new Date(project.fecha_creacion).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="card-actions">
                            <button className="btn-edit" onClick={() => setEditingProject({ ...project })}>
                              <i className="fas fa-edit"></i> Editar
                            </button>
                            <button className="btn-delete" onClick={() => handleDeleteProject(project.id)}>
                              <i className="fas fa-trash"></i> Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminPanel