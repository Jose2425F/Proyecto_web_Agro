import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Para obtener el ID del proyecto desde la URL
import '../App.css'; // Asegúrate de importar los estilos globales
import cafe from '../assets/proyectos/cultivo-de-cafe-colombiano.jpg';

const ProjectDetails = () => {
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

  return (
    <div className="page-container">
      <div className="project-details">
        <div className="project-header">
          <h1>{project.nombre}</h1>
          <span className={`estado-proyecto ${project.estado.toLowerCase().replace(' ', '-')}`}>
            {project.estado}
          </span>
        </div>

        <div className="project-body">
          <div className="project-image-container">
            <img
              src={project.imagen_url || cafe}
              alt="Imagen del Proyecto"
              className="project-image"
            />
          </div>

          <div className="details-container">
            <p><strong>Descripción:</strong> {project.descripcion}</p>
            <p><strong>Recaudado:</strong> ${project.monto_recaudado}</p>
            <p><strong>Meta:</strong> ${project.costos}</p>
            <p><strong>Producción Estimada:</strong> {project.produccion_estimada}</p>
            <p><strong>Fecha de Creación:</strong> {new Date(project.fecha_creacion).toLocaleDateString()}</p>
            <p><strong>Likes:</strong> {project.likes_count}</p>
          </div>

          {/* Barra de progreso con texto centrado */}
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${(project.monto_recaudado / project.costos) * 100}%` }}
            ></div>
            <span className="progress-text">
              {`${Math.round((project.monto_recaudado / project.costos) * 100)}% 
              ($${project.monto_recaudado.toLocaleString()} / $${project.costos.toLocaleString()})`}
            </span>
          </div>

          {/* Botones de interacción */}
          <div className="actions-container">
            <button className="btn-support" onClick={handleInvest}>Invertir</button>
            <button className="btn-like" onClick={handleLike}>Dar Like</button>
            <button className="btn-favorite" onClick={handleFavorite}>Agregar a Favoritos</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;