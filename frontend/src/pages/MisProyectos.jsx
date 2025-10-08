import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "../hooks/useUser";

const getEstadoClase = (estado) => {
  return (
    "estado-" +
    estado
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, "-")
  );
};

const MisProyectos = () => {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMisProyectos = async () => {
      if (!userId) {
        setError("Debes iniciar sesión para ver tus proyectos.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("proyectos")
          .select("*")
          .eq("id_usuario", userId);

        if (error) throw error;

        setProyectos(data);
      } catch (err) {
        console.error("Error al cargar mis proyectos:", err);
        setError("Error al cargar tus proyectos. Intenta recargar la página.");
      } finally {
        setLoading(false);
      }
    };

    fetchMisProyectos();
  }, [userId]);

  if (loading) {
    return <div className="loading-state">Cargando tus proyectos...</div>;
  }

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  if (proyectos.length === 0) {
    return (
      <div
        className="empty-state"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "400px", 
          padding: "40px",
          backgroundColor: "#2A2A2A", 
          borderRadius: "8px",
          border: "1px solid #a5a5a5ff",
          margin: "40px auto",
          maxWidth: "600px",
        }}
      >
        <span
          style={{ fontSize: "4rem", color: "#4CAF50", marginBottom: "15px" }}
          role="img"
          aria-label="Caja vacía"
        >
          🌱
        </span>
        <h2 style={{ color: "#ffffffff", marginBottom: "10px" }}>
          ¡Aún no has creado ningún proyecto!
        </h2>
        <p style={{ color: "#ffffffff", marginBottom: "25px", fontSize: "1.1rem" }}>
          Es momento de sembrar tu idea. Publica tu proyecto agrícola para
          empezar a buscar inversión.
        </p>
        <button
          className="btn-accion btn-invertir"
          onClick={() => navigate("/crear-proyecto")}
          style={{ padding: "10px 20px", fontSize: "1rem", fontWeight: "bold" }}
        >
          Crear Nuevo Proyecto
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ textAlign: "center", width: "100%" }}>
          <h1>Mis Proyectos Publicados</h1>
          <p>Gestiona y sigue el progreso de los proyectos que has creado.</p>
        </div>
        <div
          style={{
            alignSelf: "flex-end",
            marginTop: "-60px",
            padding: "0 30px",
          }}
        >
          <button
            className="btn-accion btn-invertir"
            onClick={() => navigate("/crear-proyecto")}
          >
            + Nuevo Proyecto
          </button>
        </div>
      </div>
      <div className="projects-grid">
        {proyectos.map((proyecto) => {
          const porcentaje =
            proyecto.costos > 0
              ? Math.min(
                  100,
                  (proyecto.monto_recaudado / proyecto.costos) * 100
                )
              : 0;

          return (
            <div key={proyecto.id} className="project-card">
              <div className="project-image-container">
                <img
                  src={proyecto.imagen_url || "url-imagen-por-defecto.jpg"}
                  alt={proyecto.nombre}
                  className="project-image"
                />
                <span
                  className={`estado-proyecto ${getEstadoClase(
                    proyecto.estado
                  )}`}
                >
                  {proyecto.estado}
                </span>
              </div>
              <div className="project-content">
                <h4>{proyecto.nombre}</h4>
                <p className="project-description">
                  {proyecto.descripcion.length > 150
                    ? proyecto.descripcion.substring(0, 150) + "..."
                    : proyecto.descripcion}
                </p>

                <div className="progreso-info">
                  <div className="progreso">
                    <div
                      className="progreso-barra"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="meta">
                    <span>
                      <strong>
                        {new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(proyecto.monto_recaudado)}
                      </strong>{" "}
                      de{" "}
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(proyecto.costos)}
                    </span>
                  </div>
                </div>

                <div className="card-actions">
                  {proyecto.estado === "Buscando Inversión" && (
                    <button className="btn-accion btn-invertir" disabled>
                      Gestionar
                    </button>
                  )}
                  <button
                    className="btn-accion btn-detalles"
                    onClick={() => navigate(`/projects/${proyecto.id}`)}
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MisProyectos;
