import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = () => {
      const user = localStorage.getItem('user');
      if (user) {
        setIsLoggedIn(true);
        try {
          const userData = JSON.parse(user);
          setUserRole(userData.rol);
          setUserName(userData.nombre);
          setProfilePic(userData.foto_perfil);
        } catch (e) {
          console.error("Error al parsear los datos de usuario de localStorage", e);
          setUserRole(null);
          setUserName('');
          setProfilePic('');
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
        setUserName('');
        setProfilePic('');
      }
    };

    checkLoginStatus();

    window.addEventListener('storage', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserRole(null);
    setUserName('');
    setProfilePic('');
    navigate('/');
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
        {!isLoggedIn ? (
          <li>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
          </li>
        ) : (
          <li className="profile-menu">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="profile-menu-trigger">
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar alt={userName} src={profilePic} sx={{ width: 37, height: 37 }}/>
              </Stack>
            </button>
            {dropdownOpen && (
              <ul className="profile-dropdown">
                <li>
                  <Link to="/perfil" onClick={() => {setMenuOpen(false); setDropdownOpen(false);}}>Mi Perfil</Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
                </li>
              </ul>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
