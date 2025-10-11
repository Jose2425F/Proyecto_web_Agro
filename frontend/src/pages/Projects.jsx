import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // 👈 IMPORTAR EL CLIENTE DE SUPABASE

const getEstadoClase = (estado) => {
    return 'estado-' + estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-');
}

// Estado del componente para datos, carga y errores
const Projects = () => {
    const navigate = useNavigate();
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProyectos = async () => {
            try {
                const { data, error } = await supabase
                    .from("proyectos")
                    .select("*") 
                    .order('fecha_creacion', { ascending: false });

                if (error) {
                    throw new Error(`Error al obtener los proyectos: ${error.message}`);
                }
                
                setProyectos(data);
                
            } catch (err) {
                console.error("Fallo la carga de proyectos:", err);
                setError('No se pudo obtener la información de los proyectos. Intenta recargar.');
            } finally {
                setLoading(false);
            }
        };

        fetchProyectos();
    }, []); 

    if (loading) {
        return <div className="loading-state" style={{ textAlign: 'center', padding: '50px' }}>Cargando proyectos...</div>;
    }
    if (error) {
        return <div className="error-state" style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Error: {error}</div>;
    }
    if (proyectos.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>No hay proyectos disponibles en este momento.</h2>
            </div>
        );
    }
    
    return (
        <div style={{ padding: '0 20px' }}>
            <div style={{ textAlign: 'center' }}>
                <h1>Proyectos</h1>
                <p>Explora los proyectos agrícolas que buscan transformar el campo.</p>
            </div>
            
            <div className="projects-grid">
                {proyectos.map(proyecto => {
                    const porcentaje = (proyecto.costos > 0) ? Math.min(100, (proyecto.monto_recaudado / proyecto.costos) * 100) : 0;
                    return (
                        <div key={proyecto.id} className="project-card">
                            <div className="project-image-container">
                                <img 
                                    src={proyecto.imagen_url} 
                                    alt={proyecto.nombre} 
                                    className="project-image" 
                                />
                                <span className={`estado-proyecto ${getEstadoClase(proyecto.estado)}`}>{proyecto.estado}</span>
                            </div>
                            <div className="project-content"> 
                                <h4>{proyecto.nombre}</h4>
                                <p className="project-description">
                                    {proyecto.descripcion.length > 150 ? proyecto.descripcion.substring(0, 150) + '...' : proyecto.descripcion}
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
                                    {
                                        proyecto.estado != "En Progreso" && (
                                            <button 
                                            className="btn-accion btn-invertir"
                                            onClick={() => navigate(`/invertir/${proyecto.id}`)}
                                            >
                                              Invertir
                                            </button>
                                        )
                                    }
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

export default Projects;