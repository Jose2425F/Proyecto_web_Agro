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
          // console.log("🚫 No hay sesión activa en Supabase");
        }
      }

      setLoading(false);
    };

    initializeUser();

    // Suscríbete a los cambios de estado de autenticación para que la interfaz de usuario reaccione cuando se cierre la sesión en otro lugar.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null);
        setRole(null);
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const id = session.user.id;
        (async () => {
          try {
            const { data: userProfile } = await supabase
              .from('usuarios')
              .select('rol')
              .eq('id', id)
              .single();
            if (userProfile) {
              setUserId(id);
              setRole(userProfile.rol);
              localStorage.setItem('userId', id);
              localStorage.setItem('role', userProfile.rol);
            }
          } catch (e) {
            console.error('Error fetching profile on SIGNED_IN:', e.message || e);
          }
        })();
      }
    });

    return () => {
      if (listener && typeof listener.subscription?.unsubscribe === 'function') {
        listener.subscription.unsubscribe();
      } else if (listener && typeof listener.unsubscribe === 'function') {
        listener.unsubscribe();
      }
    };
  }, []);
  if (loading) return <p>Cargando sesión...</p>;

  return (
    <UserContext.Provider value={{ userId, setUserId, role, setRole }}>
      {children}
    </UserContext.Provider>
  );
};
