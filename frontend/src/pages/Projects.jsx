import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "../hooks/useUser.js";
import "./Projects.css";

const Projects = () => {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [sortBy, setSortBy] = useState("recientes");
  const [likeLoading, setLikeLoading] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    montoTotal: 0,
    montoRecaudado: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, []);
  useEffect(() => {
    filterAndSortProjects();
  }, [projects, searchTerm, filterEstado, sortBy]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("proyectos")
        .select(
          `
          *,
          usuarios:id_usuario (nombre, apellido, foto_perfil),
          likes_proyecto!left (id_usuario)
        `
        )
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;

      const projectsWithLikes = (data || []).map((p) => ({
        ...p,
        likes_proyecto: Array.isArray(p.likes_proyecto) ? p.likes_proyecto : [],
        likes_count: p.likes_proyecto ? p.likes_proyecto.length : 0,
      }));

      setProjects(projectsWithLikes);
      calculateStats(projectsWithLikes);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const activos = data.filter(
      (p) => p.estado === "Buscando Inversión"
    ).length;
    const montoTotal = data.reduce(
      (sum, p) => sum + (Number(p.costos) || 0),
      0
    );
    const montoRecaudado = data.reduce(
      (sum, p) => sum + (Number(p.monto_recaudado) || 0),
      0
    );
    setStats({ total, activos, montoTotal, montoRecaudado });
  };

  // FORMATEO INTELIGENTE DE MONTOS
  const formatMonto = (monto, forceCompact = false) => {
    const num = Number(monto) || 0;
    if (num === 0) return "$0";

    const shouldCompact =
      forceCompact || window.innerWidth < 768 || num >= 50_000_000;

    if (shouldCompact) {
      if (num >= 1_000_000_000) {
        const value = num / 1_000_000_000;
        return value % 1 === 0
          ? `$${value.toLocaleString("es-CO")} mil M`
          : `$${value.toFixed(1)} mil M`;
      }
      if (num >= 1_000_000) {
        const value = num / 1_000_000;
        return value % 1 === 0
          ? `$${value.toLocaleString("es-CO")}M`
          : `$${value.toFixed(1)}M`;
      }
    }

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const calcularProgreso = (p) => {
    if (!p.costos || p.costos <= 0) return 0;
    return Math.min(((p.monto_recaudado || 0) / p.costos) * 100, 100).toFixed(
      1
    );
  };

  const filterAndSortProjects = () => {
    let filtered = [...projects];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(term) ||
          p.descripcion?.toLowerCase().includes(term)
      );
    }

    if (filterEstado !== "todos") {
      filtered = filtered.filter((p) => p.estado === filterEstado);
    }

    switch (sortBy) {
      case "recientes":
        filtered.sort(
          (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
        );
        break;
      case "populares":
        filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      case "progreso":
        filtered.sort((a, b) => {
          const pa = a.costos > 0 ? a.monto_recaudado / a.costos : 0;
          const pb = b.costos > 0 ? b.monto_recaudado / b.costos : 0;
          return pb - pa;
        });
        break;
    }

    setFilteredProjects(filtered);
  };

  const handleToggleLike = async (projectId, isCurrentlyLiked) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    if (likeLoading[projectId]) return;

    setLikeLoading((prev) => ({ ...prev, [projectId]: true }));

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from("likes_proyecto")
          .delete()
          .eq("id_proyecto", projectId)
          .eq("id_usuario", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes_proyecto")
          .insert([{ id_proyecto: projectId, id_usuario: userId }]);
        if (error) throw error;
      }

      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const updatedLikesCount = Math.max(
            0,
            (project.likes_count || 0) + (isCurrentlyLiked ? -1 : 1)
          );

          const updatedLikesList = isCurrentlyLiked
            ? (project.likes_proyecto || []).filter(
                (like) => like.id_usuario !== userId
              )
            : [...(project.likes_proyecto || []), { id_usuario: userId }];

          return {
            ...project,
            likes_count: updatedLikesCount,
            likes_proyecto: updatedLikesList,
          };
        })
      );
    } catch (error) {
      console.error("Error al cambiar el estado del like:", error.message || error);
    } finally {
      setLikeLoading((prev) => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
    }
  };

  if (loading) {
    return (
      <div className="projects-page-loading" role="status" aria-live="polite">
        <div className="projects-page-spinner" aria-hidden="true"></div>
        <p>Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <main className="projects-page-container">
      <header className="projects-page-header">
        <h1>Proyectos Disponibles</h1>
        <p className="projects-page-subtitle">
          Invierte en proyectos agrícolas y apoya el desarrollo del campo
          colombiano
        </p>
      </header>

      <section className="projects-page-stats" aria-label="Estadísticas">
        {[
          { icon: "building", label: "Total Proyectos", value: stats.total },
          {
            icon: "check",
            label: "Proyectos a Invertir",
            value: stats.activos,
          },
          {
            icon: "money",
            label: "Capital Total",
            value: formatMonto(stats.montoTotal, true),
          },
          {
            icon: "chart",
            label: "Recaudado",
            value: formatMonto(stats.montoRecaudado, true),
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="projects-page-stat-card"
            aria-label={stat.label + ": " + stat.value}
          >
            <div className="projects-page-stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    i === 0
                      ? "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      : i === 1
                      ? "M9 12l2 2 4-4m6 2a9 9 0 11-14 0 9 9 0 0114 0z"
                      : i === 2
                      ? "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      : "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  }
                />
              </svg>
            </div>
            <div className="projects-page-stat-info">
              <p className="projects-page-stat-label">{stat.label}</p>
              <p className="projects-page-stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="projects-page-filters" aria-label="Filtros">
        <div className="projects-page-search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <label htmlFor="search" className="visually-hidden">
            Buscar proyectos
          </label>
          <input
            id="search"
            type="text"
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="projects-page-filter-group">
          <label htmlFor="estado" className="visually-hidden">
            Estado
          </label>
          <select
            id="estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="projects-page-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="Buscando Inversión">Buscando Inversión</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Completado">Completado</option>
          </select>

          <label htmlFor="orden" className="visually-hidden">
            Ordenar por
          </label>
          <select
            id="orden"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="projects-page-select"
          >
            <option value="recientes">Más recientes</option>
            <option value="populares">Más populares</option>
            <option value="progreso">Mayor progreso</option>
          </select>
        </div>
      </section>

      {filteredProjects.length === 0 ? (
        <div className="projects-page-empty" role="status">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3>No se encontraron proyectos</h3>
          <p>Intenta ajustar los filtros</p>
        </div>
      ) : (
        <section className="projects-page-grid" aria-label="Proyectos">
          {filteredProjects.map((proyecto) => {
            const progreso = calcularProgreso(proyecto);
            const faltante =
              (proyecto.costos || 0) - (proyecto.monto_recaudado || 0);
            const puedeInvertir =
              proyecto.estado === "Buscando Inversión" && faltante > 0;
            const creador = `${proyecto.usuarios?.nombre || "Usuario"} ${
              proyecto.usuarios?.apellido || ""
            }`.trim();
            const likeEntries = proyecto.likes_proyecto || [];
            const isLiked = likeEntries.some((like) => like.id_usuario === userId);
            const displayLikes = proyecto.likes_count || 0;

            return (
              <article key={proyecto.id} className="projects-page-card">
                <div className="projects-page-card-image">
                  <img
                    src={
                      proyecto.imagen_url ||
                      "/placeholder.svg?height=220&width=400"
                    }
                    alt={`Imagen del proyecto ${proyecto.nombre}`}
                    loading="lazy"
                    onError={(e) =>
                      (e.target.src = "/placeholder.svg?height=220&width=400")
                    }
                  />
                  <span
                    className={`projects-page-badge projects-page-badge-${proyecto.estado
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {proyecto.estado}
                  </span>
                </div>

                <div className="projects-page-card-content">
                  <h3>{proyecto.nombre}</h3>
                  <p className="projects-page-card-description">
                    {proyecto.descripcion}
                  </p>

                  <div className="projects-page-creator">
                    <img
                      src={
                        proyecto.usuarios?.foto_perfil ||
                        "/placeholder.svg?height=40&width=40"
                      }
                      alt=""
                      loading="lazy"
                    />
                    <div>
                      <p className="projects-page-creator-label">Creado por</p>
                      <p className="projects-page-creator-name">{creador}</p>
                    </div>
                  </div>

                  <div
                    className="projects-page-progress"
                    aria-label={`Progreso: ${progreso}%`}
                  >
                    <div
                      className="projects-page-progress-bar"
                      role="progressbar"
                      aria-valuenow={progreso}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        className="projects-page-progress-fill"
                        style={{ width: `${progreso}%` }}
                      ></div>
                    </div>
                    <div className="projects-page-progress-info">
                      <span>{formatMonto(proyecto.monto_recaudado)}</span>
                      <span>{progreso}%</span>
                    </div>
                    <p className="projects-page-progress-meta">
                      Meta: {formatMonto(proyecto.costos)}
                    </p>
                  </div>

                  <div className="projects-page-card-stats">
                    <div className="projects-page-card-stat">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <time dateTime={proyecto.fecha_creacion}>
                        {new Date(proyecto.fecha_creacion).toLocaleDateString(
                          "es-CO"
                        )}
                      </time>
                    </div>
                    <button
                      type="button"
                      className={`projects-page-card-stat projects-page-like-btn ${
                        isLiked ? "liked" : ""
                      }`}
                      onClick={() => handleToggleLike(proyecto.id, isLiked)}
                      aria-pressed={isLiked}
                      aria-label={
                        isLiked
                          ? "Quitar me gusta al proyecto"
                          : "Marcar me gusta al proyecto"
                      }
                      disabled={likeLoading[proyecto.id]}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={isLiked ? "currentColor" : "none"}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{displayLikes}</span>
                    </button>
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
                      disabled={!puedeInvertir}
                    >
                      {faltante <= 0
                        ? "Completo"
                        : puedeInvertir
                        ? "Invertir"
                        : "No disponible"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};

export default Projects;
