
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="pageContainer">
      <header className="header">
        <h1>Bienvenido a AgroInversión</h1>
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
          <div className="featureCard">
            <h3>Registrarte</h3>
            <p>Únete a nuestra comunidad como agricultor o inversionista y empieza a colaborar.</p>
            <Link to="/register" className="btn-accion btn-detalles">Crear Cuenta</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
