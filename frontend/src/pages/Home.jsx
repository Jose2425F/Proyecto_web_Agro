
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkLoginStatus = () => {
      const user = localStorage.getItem('user');
      if (user) {
        setIsLoggedIn(true);
        try {
          const userData = JSON.parse(user);
          setUserName(userData.nombreCompleto || userData.nombre || userData.UsuarioRegistro || 'Usuario'); // Usar nombre completo, luego nombre, luego nombre de usuario, luego genérico
        } catch (e) {
          console.error("Error al parsear los datos de usuario de localStorage", e);
          setUserName('Usuario');
        }
      } else {
        setIsLoggedIn(false);
        setUserName('');
      }
    };

    checkLoginStatus(); // Check status on mount

    // Add event listener for storage changes
    window.addEventListener('storage', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  return (
    <div className="pageContainer">
      <header className="header">
        <h1>{userName ? `Bienvenido de nuevo, ${userName}` : 'Bienvenido a AgroInversión'}</h1>


        <p>Conectando agricultores con inversionistas para un futuro más próspero y sostenible.</p>
      </header>

      <section>
        <h2>¿Qué puedes hacer aquí?</h2>
        <div className="featuresSection">
          <div className="featureCard">
            <h3>Explorar Proyectos</h3>
            <p>Descubre proyectos agrícolas innovadores que necesitan tu apoyo para crecer.</p>
            <Link to="/projects" className="btn-accion btn-invertir">Ver Proyectos</Link>
          </div>
          {!isLoggedIn && (
            <div className="featureCard">
              <h3>Registrarte</h3>
              <p>Únete a nuestra comunidad como agricultor o inversionista y empieza a colaborar.</p>
              <Link to="/register" className="btn-accion btn-detalles">Crear Cuenta</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
