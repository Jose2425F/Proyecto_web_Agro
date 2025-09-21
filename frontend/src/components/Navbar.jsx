import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" onClick={() => setMenuOpen(false)}>AgroColombia</Link>
      </div>
      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
        <li>
          <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
        </li>
        <li>
          <Link to="/projects" onClick={() => setMenuOpen(false)}>Proyectos</Link>
        </li>
        <li>
            <Link to="/register" onClick={() => setMenuOpen(false)}>Registro</Link>
        </li>
        <li>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
