import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, provider } from "../firebase/config";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInAnonymously,
} from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let triedAnonymous = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Bloqueo estricto: Solo tú puedes pasar de esta línea
          if (user.email && user.email.toLowerCase() === "carlos.linares.es@gmail.com") {
            setCurrentUser(user);
          } else {
            setCurrentUser(null);
          }
        } else {
          // Si no hay usuario, intentamos iniciar sesión anónima UNA vez
          if (!triedAnonymous) {
            triedAnonymous = true;
            try {
              await signInAnonymously(auth);
            } catch (e) {
              console.warn('Anonymous sign-in failed:', e);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    try {
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Expulsión inmediata si el correo no es el tuyo
      if (user.email.toLowerCase() !== "carlos.linares.es@gmail.com") {
        await firebaseSignOut(auth);
        alert("Acceso denegado: " + user.email + " no está autorizado en esta plataforma.");
        return null;
      }
      
      return user;
    } catch (err) {
      console.error("Error al firmar:", err);
      alert("Error de Firebase: " + err.code);
      throw err;
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loginWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);