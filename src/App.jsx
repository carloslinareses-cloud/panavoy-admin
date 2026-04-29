import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componentes y Páginas
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Socios from './pages/Socios';
import Pedidos from './pages/Pedidos';
import Config from './pages/Config';
import Login from './pages/Login';
import MapaFlota from './pages/MapaFlota';
import Publicidad from './pages/Publicidad'; // <-- NUEVA IMPORTACIÓN

function AppRoutes() {
  const { currentUser, loading } = useAuth();

  // Pantalla de Carga Estilizada (Pana Style)
  if (loading) {
    return (
      <div className="h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
        <div className="relative flex items-center justify-center">
          {/* Efecto de pulso en el logo de carga */}
          <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full animate-ping"></div>
          <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <h2 className="mt-8 text-2xl font-black italic tracking-tighter text-blue-500">Pana Voy</h2>
        <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse">Sincronizando Terminal...</p>
      </div>
    );
  }

  // Rutas de Invitados (No logueados)
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Panel Administrativo (Logueados)
  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Sidebar />
      
      {/* Contenedor Principal con Scroll Suave */}
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/mapa" element={<MapaFlota />} />
            <Route path="/publicidad" element={<Publicidad />} /> {/* <-- RUTA ACTIVADA */}
            <Route path="/config" element={<Config />} />
            
            {/* Redirección automática si la ruta no existe */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}