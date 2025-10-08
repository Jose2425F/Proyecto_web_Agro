import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "../hooks/useUser.js";
import "./Home.css";

const Home = () => {
  const { userId, setUserId } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

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
      <div
        className="loadingContainer"
        style={{ textAlign: "center", padding: "50px" }}
      >
        <p>Cargando información del usuario...</p>
      </div>
    );
  }

  return (
    <div className="pageContainer">
      <header className="header">
        <h1>
          {userName
            ? `Bienvenido de nuevo, ${userName}`
            : "Bienvenido a AgroInversión"}
        </h1>
        <p>
          Conectando agricultores con inversionistas para un futuro más próspero
          y sostenible.
        </p>
      </header>

      <section>
        <h2>¿Qué puedes hacer aquí?</h2>
        <div className="featuresSection">
          <div className="featureCard">
            <h3>Explorar Proyectos</h3>
            <p>
              Descubre proyectos agrícolas innovadores que necesitan tu apoyo
              para crecer.
            </p>
            <Link to="/projects" className="btn-accion btn-invertir">
              Ver Proyectos
            </Link>
          </div>
          {!isLoggedIn && (
            <div className="featureCard">
              <h3>Registrarte</h3>
              <p>
                Únete a nuestra comunidad como agricultor o inversionista y
                empieza a colaborar.
              </p>
              <Link to="/register" className="btn-accion btn-detalles">
                Crear Cuenta
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
