import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../App.css';

const DetalleProyecto = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await fetch(`/Proyecto_web_Agro/php/proyecto_detalle.php?id=${id}`);
        if (!response.ok) {
          throw new Error('Error al obtener los detalles del proyecto');
        }
        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]);

  const handleInvest = () => {
    alert('Gracias por tu interés en invertir en este proyecto.');
  };

  const handleLike = () => {
    alert('¡Has dado like a este proyecto!');
  };

  const handleFavorite = () => {
    alert('Este proyecto ha sido agregado a tus favoritos.');
  };

  if (loading) {
    return <div className="page-container">Cargando...</div>;
  }

  if (error) {
    return <div className="page-container">Error: {error}</div>;
  }

  const progressPercentage = Math.round((project.monto_recaudado / project.costos) * 100);

  return (
    <div className="page-container">
      <div className="detalle-proyecto-container">
        <div className="detalle-proyecto-header">
          <h1>{project.nombre}</h1>
          <span className={`estado-proyecto ${project.estado.toLowerCase().replace(' ', '-')}`}>
            {project.estado}
          </span>
        </div>

        <div className="detalle-proyecto-body">
          <div className="detalle-proyecto-img-container">
            <img
              src={`/` + project.imagen_url.replace(/\\/g, '/')}
              alt={project.nombre}
              className="detalle-proyecto-img"
            />
          </div>

          <div className="detalle-proyecto-info">
            <p className="descripcion">{project.descripcion}</p>
            
            <div className="progress-section">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
                <span className="progress-bar-text">{progressPercentage}%</span>
              </div>
              <div className="progress-labels">
                <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(project.monto_recaudado)}</span>
                <span>Meta: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(project.costos)}</span>
              </div>
            </div>

            <div className="info-adicional">
              <p><strong>Producción Estimada:</strong> {project.produccion_estimada}</p>
              <p><strong>Fecha de Creación:</strong> {new Date(project.fecha_creacion).toLocaleDateString()}</p>
              <p><strong>Likes:</strong> {project.likes_count}</p>
            </div>

            <div className="actions-container">
              {project.estado !== 'En Progreso' && (
                  <button className="btn-support" onClick={handleInvest}>Invertir</button>
              )}
              <button className="btn-like" onClick={handleLike}>Dar Like</button>
              <button className="btn-favorite" onClick={handleFavorite}>Agregar a Favoritos</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleProyecto;