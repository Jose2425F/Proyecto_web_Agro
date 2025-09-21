import React from 'react';
import cafe from '../assets/proyectos/cultivo-de-cafe-colombiano.jpg';
import huerta from '../assets/proyectos/images.jpeg';
import miel from '../assets/proyectos/istockphoto-1328004520-612x612.jpg';
import banano from '../assets/proyectos/banana-growing-plantation.png';

// Datos de ejemplo (mock data)
const mockProjects = [
  {
    id: 1,
    nombre: 'Cultivo de Café Sostenible',
    estado: 'Buscando Inversión',
    costos: 5000,
    monto_recaudado: 1500,
    descripcion: 'Proyecto para implementar prácticas de cultivo de café amigables con el medio ambiente en la sierra.',
    img: cafe,
  },
  {
    id: 2,
    nombre: 'Huerta Orgánica Comunitaria',
    estado: 'En Progreso',
    costos: 3000,
    monto_recaudado: 3000,
    descripcion: 'Creación de una huerta orgánica para abastecer a la comunidad local con vegetales frescos y saludables.',
    img: huerta,
  },
  {
    id: 3,
    nombre: 'Apicultura y Producción de Miel',
    estado: 'Completado',
    costos: 2000,
    monto_recaudado: 2500, // A veces se recauda más
    descripcion: 'Instalación de colmenas para la producción y comercialización de miel de abeja pura.',
    img: miel,
  },
    {
    id: 4,
    nombre: 'Cosecha de Plátanos de Exportación',
    estado: 'Buscando Inversión',
    costos: 8000,
    monto_recaudado: 2000,
    descripcion: 'Expansión de cultivo de plátanos para cumplir con estándares de exportación y abrir nuevos mercados.',
    img: banano,
  },
];

const getEstadoClase = (estado) => {
    return 'estado-' + estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-');
}

const Projects = () => {
  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <h1>Proyectos</h1>
        <p>Explora los proyectos agrícolas que buscan transformar el campo.</p>
      </div>
      <div className="projects-grid">
        {mockProjects.map(proyecto => {
            const porcentaje = (proyecto.costos > 0) ? Math.min(100, (proyecto.monto_recaudado / proyecto.costos) * 100) : 0;
            return (
                <div key={proyecto.id} className="project-card">
                    <div className="project-image-container">
                        <img src={proyecto.img} alt={proyecto.nombre} className="project-image" />
                        <span className={`estado-proyecto ${getEstadoClase(proyecto.estado)}`}>{proyecto.estado}</span>
                    </div>
                    <div className="project-content"> 
                      <h4>{proyecto.nombre}</h4>
                      <p className="project-description">{proyecto.descripcion}</p>
                      
                      <div className="progreso-info">
                          <div className="progreso">
                              <div className="progreso-barra" style={{ width: `${porcentaje}%` }}></div>
                          </div>
                          <div className="meta">
                              <span><strong>${proyecto.monto_recaudado.toLocaleString()}</strong> de ${proyecto.costos.toLocaleString()}</span>
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