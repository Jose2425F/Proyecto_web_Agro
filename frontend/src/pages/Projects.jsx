import React, { useState, useEffect } from 'react';
import cafe from '../assets/proyectos/cultivo-de-cafe-colombiano.jpg';


const getEstadoClase = (estado) => {
    return 'estado-' + estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-');
}


    // Estado del componente para datos, carga y errores
const Projects = () => {

    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //  Hook para la llamada a la API
    useEffect(() => {
        const fetchProyectos = async () => {
            try {
                // Realiza la petición a tu archivo PHP
                const response = await fetch('/Proyecto_web_Agro/php/traer_proyecto.php');
                if (!response.ok) {
                    throw new Error('No se pudo obtener la información de los proyectos.');
                }
                const data = await response.json();
                setProyectos(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProyectos();
    }, []);

    
  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <h1>Proyectos</h1>
        <p>Explora los proyectos agrícolas que buscan transformar el campo.</p>
      </div>
      <div className="projects-grid">
        {/* 4. Mapeo Dinámico: */}
        {/* Se usa la variable de estado `proyectos` en lugar de la data estática. */}
        {proyectos.map(proyecto => {
            const porcentaje = (proyecto.costos > 0) ? Math.min(100, (proyecto.monto_recaudado / proyecto.costos) * 100) : 0;
            return (
                <div key={proyecto.id} className="project-card">
                    <div className="project-image-container">
                        {/* La URL de la imagen ahora proviene de la base de datos */}
                        <img src={proyecto.imagen_url} alt={proyecto.nombre} className="project-image" />
                        <span className={`estado-proyecto ${getEstadoClase(proyecto.estado)}`}>{proyecto.estado}</span>
                    </div>
                    <div className="project-content"> 
                      <h4>{proyecto.nombre}</h4>
                     <p className="project-description">
                        {proyecto.descripcion.length > 100 ? proyecto.descripcion.substring(0, 150) + '...' : proyecto.descripcion}
                      </p>
                      
                      <div className="progreso-info">
                          <div className="progreso">
                              <div className="progreso-barra" style={{ width: `${porcentaje}%` }}></div>
                          </div>
                          <div className="meta">
                             <span><strong>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(proyecto.monto_recaudado)}</strong> de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(proyecto.costos)}</span>
                          </div>
                      </div>

                      <div className="card-actions">
                          <button className="btn-accion btn-invertir">Invertir</button>
                          <button className="btn-accion btn-detalles">Ver Detalles</button>
                      </div>
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default Projects;