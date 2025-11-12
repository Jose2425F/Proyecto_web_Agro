import React, { useState, useEffect } from "react";
import { UserContext } from "./UserContext.jsx";
import { supabase } from "../supabaseClient.js";

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initializeUser = async () => {
      const storedUserId = localStorage.getItem("userId");
      const storedRole = localStorage.getItem("role");

      if (storedUserId && storedRole) {
        setUserId(storedUserId);
        setRole(storedRole);
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { id } = session.user;
          const { data: userProfile } = await supabase
            .from("usuarios")
            .select("rol")
            .eq("id", id)
            .single();

          if (userProfile) {
            setUserId(id);
            setRole(userProfile.rol);
            localStorage.setItem("userId", id);
            localStorage.setItem("role", userProfile.rol);
          }
        } else {
          console.log("🚫 No hay sesión activa en Supabase");
        }
      }

      setLoading(false);
    };

    initializeUser();
  }, []);
  if (loading) return <p>Cargando sesión...</p>;

  return (
    <UserContext.Provider value={{ userId, setUserId, role, setRole }}>
      {children}
    </UserContext.Provider>
  );
};
