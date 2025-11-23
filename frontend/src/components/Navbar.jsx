import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { supabase } from "../supabaseClient";
import { useUser } from "../hooks/useUser.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const LOGO_PATH = "/storage/v1/object/public/avatars/logo/Logo.png";
const LOGO_URL = SUPABASE_URL ? `${SUPABASE_URL}${LOGO_PATH}` : LOGO_PATH;

const Navbar = () => {
  const { userId, setUserId } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
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
          setProfilePic(data.foto_perfil || "");
          setUserRole(data.rol);
        }
      } catch (err) {
        console.error("Error al obtener el usuario:", err.message);
      }
    };

    fetchUser();
  }, [userId]);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Error al cerrar sesión en Supabase:", err.message || err);
      }

      setUserId(null);
      localStorage.removeItem("userId");
      localStorage.removeItem("role");
      setIsLoggedIn(false);
      setUserRole(null);
      setUserName("");
      setProfilePic("");
      setDropdownOpen(false);
      setMenuOpen(false);
      navigate("/");
    };

    doLogout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/home" onClick={() => setMenuOpen(false)}>
          <img src={LOGO_URL} alt="Logo" className="logo" />
          AgroColombia
        </Link>
      </div>
      <button
        className={`menu-icon ${menuOpen ? "is-active" : ""}`}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-controls="navbar-links"
        aria-label="Alternar menú de navegación"
        type="button"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <ul id="navbar-links" className={`navbar-links ${menuOpen ? "active" : ""}`}>
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
          <>
            <li>
              <Link to="/inversiones" onClick={() => setMenuOpen(false)}>
                Mis Inversiones
              </Link>
            </li>
            <li>
              <Link to="/simulador" onClick={() => setMenuOpen(false)}>
                Simulador
              </Link>
            </li>
          </>
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
            <li className="profile-menu desktop-profile-menu" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="profile-menu-trigger"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                aria-controls="profile-dropdown"
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
                <ul id="profile-dropdown" className="profile-dropdown">
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
