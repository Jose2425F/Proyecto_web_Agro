import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { supabase } from "../supabaseClient";
import { useUser } from "../hooks/useUser.js";

const Navbar = () => {
  const { userId, setUserId } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

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
          setProfilePic(data.foto_perfil || "");
          setUserRole(data.rol);
        }
      } catch (err) {
        console.error("Error al obtener el usuario:", err.message);
      }
    };

    fetchUser();
  }, [userId]);

  const handleLogout = () => {
    setUserId(null); 
    localStorage.removeItem("userId"); 
    setIsLoggedIn(false);
    setUserRole(null);
    setUserName("");
    setProfilePic("");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/home" onClick={() => setMenuOpen(false)}>
          AgroColombia
        </Link>
      </div>
      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <ul className={`navbar-links ${menuOpen ? "active" : ""}`}>
        <li>
          <Link to="/home" onClick={() => setMenuOpen(false)}>
            Inicio
          </Link>
        </li>
        <li>
          <Link to="/projects" onClick={() => setMenuOpen(false)}>
            Proyectos
          </Link>
        </li>
        {isLoggedIn && userRole === "inversionista" && (
          <li>
            <Link to="/inversiones" onClick={() => setMenuOpen(false)}>
              Mis Inversiones
            </Link>
          </li>
        )}
        {isLoggedIn && userRole === "campesino" && (
          <li>
            <Link to="/mis-proyectos" onClick={() => setMenuOpen(false)}>
              Mis Proyectos
            </Link>
          </li>
        )}
        {isLoggedIn &&
          (userRole === "administrador" ||
            userRole === "administradorsupremo") && (
            <li>
              <Link to="/admin-panel" onClick={() => setMenuOpen(false)}>
                Panel Admin
              </Link>
            </li>
          )}
        {!isLoggedIn ? (
          <li>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          </li>
        ) : (
          <>
            {/* Menú de perfil para escritorio */}
            <li className="profile-menu desktop-profile-menu">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="profile-menu-trigger"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    alt={userName}
                    src={profilePic}
                    sx={{ width: 48, height: 48 }}
                  />
                </Stack>
              </button>
              {dropdownOpen && (
                <ul className="profile-dropdown">
                  <li>
                    <button
                      onClick={() => {
                        navigate("/perfil");
                        setMenuOpen(false);
                        setDropdownOpen(false);
                      }}
                      className="profile-dropdown-btn"
                    >
                      Mi Perfil
                    </button>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="btn-logout">
                      Cerrar Sesión
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {/* Enlaces de perfil para móvil */}
            <li className="mobile-profile-link">
              <Link to="/perfil" onClick={() => setMenuOpen(false)}>
                <Avatar
                  alt={userName}
                  src={profilePic}
                  sx={{ width: 48, height: 48 }}
                />
                <span className="mobile-username">{userName}</span>
              </Link>
            </li>
            <li className="mobile-logout">
              <button onClick={handleLogout} className="btn-logout">
                Cerrar Sesión
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
