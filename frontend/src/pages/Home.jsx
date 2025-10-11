import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "../hooks/useUser.js";
import { FaSeedling } from "react-icons/fa6";
import "./Home.css";

const Home = () => {
  const { userId, setUserId } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    proyectosActivos: 0,
    inversionistas: 0,
    millonesInvertidos: 0,
  });

  const fetchInversionistasCount = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("inversiones")
        .select("id", { distinct: true });

      if (error) throw error;
      return data ? data.length : 0;
    } catch (err) {
      console.error("Error al obtener el recuento de inversionistas:", err);
      return 0;
    }
  }, []);

  const fetchTotalInvertido = useCallback(async () => {
    try {
      const { data: allProyectos, error: sumError } = await supabase
        .from("proyectos")
        .select("monto_recaudado");

      if (sumError) throw sumError;

      const total = allProyectos.reduce(
        (sum, proyecto) => sum + (proyecto.monto_recaudado || 0),
        0
      );
      return total / 1000000;
    } catch (err) {
      console.error("Error fetching total invertido:", err);
      return 0;
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      setLoading(false);
    }
  }, [setUserId]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Proyectos Activos: Contamos los que NO son 'Finalizado' ni 'Cancelado'
        const { count: activosCount, error: countError } = await supabase
          .from("proyectos")
          .select("*", { count: "exact" });

        if (countError) throw countError;

        // 2. Obtener Inversionistas y Total Invertido concurrentemente
        const [inversionistasCount, totalInvertido] = await Promise.all([
          fetchInversionistasCount(),
          fetchTotalInvertido(),
        ]);

        setStats({
          proyectosActivos: activosCount || 0,
          inversionistas: inversionistasCount || 0,
          millonesInvertidos: totalInvertido || 0,
        });
      } catch (err) {
        console.error("Error al cargar las estadísticas:", err.message);
      } finally {
        // Finaliza el estado de carga una vez que se han intentado obtener todos los datos
        setLoading(false);
      }
    };

    fetchStats();
  }, [fetchInversionistasCount, fetchTotalInvertido]);

  const formatCurrency = (num) => {
    const valorEnPesos = num * 1000000;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valorEnPesos);
  };

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsLoggedIn(true);
          setUserName(`${data.nombre} ${data.apellido}`);
        } else {
          setIsLoggedIn(false);
          setUserName("");
        }
      } catch (err) {
        console.error("Error al obtener el usuario:", err.message);
        setIsLoggedIn(false);
        setUserName("");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="loadingContainer">
        <div className="loader-spinner"></div>
        <p className="loading-text">Cargando información del usuario...</p>
      </div>
    );
  }

  return (
    <div className="pageContainer home-page">
      <div className="background-decoration">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>

      <header className="header">
        <div className="header-content">
          <div className="header-badge">
            <span className="badge-icon"><FaSeedling color="#14c900" size={25}/></span>
            <span className="badge-text">Plataforma AgroColombia</span>
            <span className="badge-icon"><FaSeedling color="#14c900" size={25}/></span>
          </div>
          <h1 className="header-title">
            {userName ? (
              <>
                <span className="greeting-text">Bienvenido de nuevo,</span>
                <span className="user-name-highlight">{userName}</span>
              </>
            ) : (
              <>
                <span className="title-line-1">Bienvenido a</span>
                <span className="title-line-2">AgroColombia</span>
              </>
            )}
          </h1>
          <p className="header-description">
            Conectando agricultores con inversionistas para un futuro más
            próspero y sostenible.
          </p>
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-number" data-target={stats.proyectosActivos}>
                {stats.proyectosActivos}
              </div>
              <div className="stat-label">Proyectos Activos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target={stats.inversionistas}>
                {stats.inversionistas}
              </div>
              <div className="stat-label">Inversionistas</div>
            </div>
            <div className="stat-item">
              <div
                className="stat-number"
                data-target={stats.millonesInvertidos}
              >
                {formatCurrency(stats.millonesInvertidos)}
              </div>
              <div className="stat-label">Total Invertido</div>
            </div>
          </div>
        </div>
        <div className="header-wave">
    <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0V30C160,50,300,80,550,80C800,80,1050,50,1200,30V0Z" className="shape-fill"></path>
    </svg>
</div>
      </header>

      <section className="features-wrapper">
        <h2 className="section-title">
          <span className="title-decoration">¿Qué puedes hacer aquí?</span>
        </h2>
        <div className="featuresSection">
          <div className="featureCard card-animate">
            <div className="card-glow"></div>
            <div className="card-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3>Explorar Proyectos</h3>
            <p>
              Descubre proyectos agrícolas innovadores que necesitan tu apoyo
              para crecer.
            </p>
            <Link to="/projects" className="btn-accion btn-invertir">
              <span className="btn-text">Ver Proyectos</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>

          {!isLoggedIn && (
            <div
              className="featureCard card-animate"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="card-glow"></div>
              <div className="card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>Registrarte</h3>
              <p>
                Únete a nuestra comunidad como agricultor o inversionista y
                empieza a colaborar.
              </p>
              <Link to="/register" className="btn-accion btn-detalles">
                <span className="btn-text">Crear Cuenta</span>
                <span className="btn-arrow">→</span>
              </Link>
            </div>
          )}

          <div
            className="featureCard card-animate"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="card-glow"></div>
            <div className="card-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h3>Invierte Seguro</h3>
            <p>
              Plataforma segura con seguimiento en tiempo real de tus
              inversiones y retornos garantizados.
            </p>
            <Link to="/projects" className="btn-accion btn-invertir">
              <span className="btn-text">Comenzar</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="benefits-section">
        <h2 className="section-title">
          <span className="title-decoration">¿Por qué elegirnos?</span>
        </h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">🔒</div>
            <h4>100% Seguro</h4>
            <p>Transacciones protegidas y verificadas</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📊</div>
            <h4>Transparencia Total</h4>
            <p>Seguimiento en tiempo real de proyectos</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🌍</div>
            <h4>Impacto Social</h4>
            <p>Apoya el desarrollo rural sostenible</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">💰</div>
            <h4>Retornos Atractivos</h4>
            <p>Inversiones con rendimientos competitivos</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;