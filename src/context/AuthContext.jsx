import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, provider } from "../firebase/config";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Usamos .toLowerCase() para evitar errores de mayúsculas
      if (user && user.email.toLowerCase() === "carlos.linares.es@gmail.com") {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    try {
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user.email.toLowerCase() !== "carlos.linares.es@gmail.com") {
        await firebaseSignOut(auth);
        alert("Acceso denegado: " + user.email + " no está autorizado.");
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