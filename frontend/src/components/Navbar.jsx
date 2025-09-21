import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // Nuevo estado para el rol del usuario
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = () => {
      const user = localStorage.getItem('user');
      if (user) {
        setIsLoggedIn(true);
        try {
          const userData = JSON.parse(user);
          setUserRole(userData.rol); // Guardar el rol del usuario
        } catch (e) {
          console.error("Error al parsear los datos de usuario de localStorage", e);
          setUserRole(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    };

    checkLoginStatus(); // Comprobamos el estado del login

    window.addEventListener('storage', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user'); // Borrar datos de usuario de localStorage
    setIsLoggedIn(false); // Actualizar el estado de inicio de sesión
    setUserRole(null); // Limpiar el rol al cerrar sesión
    navigate('/'); // Redirigir a la página de inicio
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/home" onClick={() => setMenuOpen(false)}>AgroColombia</Link>
      </div>
      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
        <li>
          <Link to="/home" onClick={() => setMenuOpen(false)}>Inicio</Link>
        </li>
        <li>
          <Link to="/projects" onClick={() => setMenuOpen(false)}>Proyectos</Link>
        </li>
        {isLoggedIn && userRole === 'inversionista' && (
          <li>
            <Link to="/inversiones" onClick={() => setMenuOpen(false)}>Mis Inversiones</Link>
          </li>
        )}
        {isLoggedIn && userRole === 'campesino' && (
          <li>
            <Link to="/mis-proyectos" onClick={() => setMenuOpen(false)}>Mis Proyectos</Link>
          </li>
        )}
        {isLoggedIn && (userRole === 'administrador' || userRole === 'administradorsupremo') && (
          <li>
            <Link to="/admin-panel" onClick={() => setMenuOpen(false)}>Panel Admin</Link>
          </li>
        )}
        {!isLoggedIn && (
          <>
            <li>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            </li>
          </>
        )}
        {isLoggedIn && (
          <li>
            <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
