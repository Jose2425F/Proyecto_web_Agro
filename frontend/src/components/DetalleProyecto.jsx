import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useUser } from "../hooks/useUser"
import "./DetalleProyecto.css"

const DetalleProyecto = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userId } = useUser()
  const [proyecto, setProyecto] = useState(null)
  const [inversiones, setInversiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [likeLoading, setLikeLoading] = useState(false)

useEffect(() => {
  if (!id) return;
  let isMounted = true;

  const loadAllData = async () => {
    try {
      setLoading(true);

      // 🔹 Ejecutar todas las queries en paralelo
      const [proyectoRes, inversionesRes, likesRes, userLikeRes] = await Promise.all([
        supabase
          .from("proyectos")
          .select(`
            *,
            usuarios:id_usuario (
              nombre,
              apellido,
              foto_perfil,
              correo
            )
          `)
          .eq("id", id)
          .single(),

        supabase
          .from("inversiones")
          .select(`
            *,
            usuarios:id_inversor (
              nombre,
              apellido,
              foto_perfil
            )
          `)
          .eq("id_proyecto", id)
          .order("fecha_inversion", { ascending: false }),

        supabase
          .from("likes_proyecto")
          .select("*", { count: "exact", head: true })
          .eq("id_proyecto", id),

        userId
          ? supabase
              .from("likes_proyecto")
              .select("*")
              .eq("id_proyecto", id)
              .eq("id_usuario", userId)
              .single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (!isMounted) return;

      if (proyectoRes.error) console.error("Error al cargar proyecto:", proyectoRes.error);
      if (inversionesRes.error) console.error("Error al cargar inversiones:", inversionesRes.error);
      if (likesRes.error) console.error("Error al cargar likes:", likesRes.error);
      if (userLikeRes.error) console.error("Error al verificar like del usuario:", userLikeRes.error);

      setProyecto(proyectoRes.data);
      setInversiones(inversionesRes.data || []);
      setLikesCount(likesRes.count || 0);
      setLiked(!!userLikeRes.data);
    } catch (error) {
      console.error("Error cargando datos del proyecto:", error);
      if (isMounted) setProyecto(null);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  loadAllData();

  return () => {
    isMounted = false;
  };
}, [id, userId, supabase]);

const refreshLikesCount = async () => {
  const { count, error } = await supabase
    .from("likes_proyecto")
    .select("*", { count: "exact", head: true })
    .eq("id_proyecto", id)

  if (!error) {
    setLikesCount(count || 0)
  }
}

const handleLike = async () => {
  if (!userId) {
    navigate("/login")
    return
  }

  if (likeLoading) return

  setLikeLoading(true)

  try {
    if (liked) {
      const { error } = await supabase
        .from("likes_proyecto")
        .delete()
        .eq("id_proyecto", id)
        .eq("id_usuario", userId)

      if (error) throw error

      setLikesCount((prev) => Math.max(0, prev - 1))
      setLiked(false)
    } else {
      const { error } = await supabase
        .from("likes_proyecto")
        .insert([{ id_proyecto: id, id_usuario: userId }])

      if (error && error.code !== "23505") {
        throw error
      }

      if (!error) {
        setLikesCount((prev) => prev + 1)
      }

      setLiked(true)
    }

    await refreshLikesCount()
  } catch (error) {
    console.error("Error al dar like:", error)
  } finally {
    setLikeLoading(false)
  }
}

const formatMonto = (monto) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(monto);

const calcularProgreso = () => {
  if (!proyecto) return 0;
  return ((proyecto.monto_recaudado / proyecto.costos) * 100).toFixed(1);
};

if (loading) {
  return (
    <div className="detalle-loading">
      <div className="spinner"></div>
      <p>Cargando proyecto...</p>
    </div>
  );
}

if (!proyecto) {
  return (
    <div className="detalle-error">
      <h2>Proyecto no encontrado</h2>
      <button onClick={() => navigate("/projects")}>Volver a Proyectos</button>
    </div>
  );
}

const progreso = calcularProgreso();
const montoDisponible = proyecto.costos - proyecto.monto_recaudado;
const numeroInversores = new Set(inversiones.map((inv) => inv.id_inversor)).size;

  return (
    <div className="detalle-proyecto-container">
      <div className="detalle-proyecto-header">
        <button className="btn-back-detalle" onClick={() => navigate("/projects")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>
        <h1>{proyecto.nombre}</h1>
        <div className="detalle-meta-info">
          <span className={`estado-proyecto estado-${proyecto.estado.toLowerCase().replace(/ /g, "-")}`}>
            {proyecto.estado}
          </span>
          <div className="meta-items-group">
            <div className="meta-item-detalle">
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
            <div className="meta-item-detalle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{numeroInversores} inversores</span>
            </div>
            <button
              className={`btn-like-detalle ${liked ? "liked" : ""}`}
              onClick={handleLike}
              disabled={likeLoading}
              aria-pressed={liked}
            >
              <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{likesCount || 0}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="detalle-proyecto-body">
        <div className="detalle-proyecto-img-container">
          <img
            className="detalle-proyecto-img"
            src={proyecto.imagen_url || "/placeholder.svg?height=400&width=600"}
            alt={proyecto.nombre}
            onError={(e) => {
              e.target.src = "/placeholder.svg?height=400&width=600"
            }}
          />
        </div>

        <div className="detalle-proyecto-info">
          <div className="progress-section">
            <h3>Financiamiento</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${Math.min(progreso, 100)}%` }}></div>
              <div className="progress-bar-text">{progreso}%</div>
            </div>
            <div className="progress-labels">
              <span style={{ color: "#14c900", fontWeight: "600" }}>{formatMonto(proyecto.monto_recaudado)}</span>
              <span style={{ color: "#888" }}>de {formatMonto(proyecto.costos)}</span>
            </div>
            <div className="progress-percentage">{progreso}% Completado</div>
          </div>

          <div className="descripcion">
            <h3>Descripción del Proyecto</h3>
            <p>{proyecto.descripcion}</p>
          </div>

          <div className="info-adicional">
            <p>
              <strong>Producción Estimada:</strong> {proyecto.produccion_estimada} toneladas
            </p>
            <p>
              <strong>Inversores:</strong> {numeroInversores} personas
            </p>
            <p>
              <strong>Total Inversiones:</strong> {inversiones.length}
            </p>
            <p>
              <strong>Disponible para invertir:</strong> {formatMonto(montoDisponible)}
            </p>
          </div>

          <div className="actions-container">
            <button
              className="btn-support"
              onClick={() => navigate(`/invertir/${proyecto.id}`)}
              disabled={proyecto.estado !== "Buscando Inversión" || montoDisponible <= 0}
            >
              <i className="icon">💰</i>
              {montoDisponible <= 0 ? "Financiamiento Completo" : "Invertir Ahora"}
            </button>
          </div>

          <div className="creator-section-detalle">
            <h3>Creador del Proyecto</h3>
            <div className="creator-info-detalle">
              <img
                src={proyecto.usuarios?.foto_perfil || "/placeholder.svg?height=60&width=60"}
                alt={`${proyecto.usuarios?.nombre} ${proyecto.usuarios?.apellido}`}
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=60&width=60"
                }}
              />
              <div>
                <h4>
                  {proyecto.usuarios?.nombre} {proyecto.usuarios?.apellido}
                </h4>
                <p className="creator-role-detalle">Campesino</p>
                <p className="creator-email-detalle">{proyecto.usuarios?.correo}</p>
              </div>
            </div>
          </div>

          {inversiones.length > 0 && (
            <div className="inversiones-section-detalle">
              <h3>Inversiones Recibidas ({inversiones.length})</h3>
              <div className="inversiones-list-detalle">
                {inversiones.slice(0, 5).map((inversion) => (
                  <div key={inversion.id} className="inversion-item-detalle">
                    <img
                      src={inversion.usuarios?.foto_perfil || "/placeholder.svg?height=40&width=40"}
                      alt={`${inversion.usuarios?.nombre} ${inversion.usuarios?.apellido}`}
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=40&width=40"
                      }}
                    />
                    <div className="inversion-info-detalle">
                      <h5>
                        {inversion.usuarios?.nombre} {inversion.usuarios?.apellido}
                      </h5>
                      <p className="inversion-tipo-detalle">
                        {inversion.tipo_inversion === "Capital" ? "Dueño Único" : "Accionista"}
                      </p>
                    </div>
                    <div className="inversion-details-detalle">
                      <span className="inversion-monto-detalle">{formatMonto(inversion.monto_invertido)}</span>
                      <span className="inversion-fecha-detalle">
                        {new Date(inversion.fecha_inversion).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {inversiones.length > 5 && (
                <p style={{ textAlign: "center", color: "#888", marginTop: "1rem", fontSize: "0.9rem" }}>
                  Y {inversiones.length - 5} inversiones más...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetalleProyecto
