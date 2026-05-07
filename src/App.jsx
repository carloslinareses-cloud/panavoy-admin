import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componentes y Páginas Admin
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Socios from './pages/Socios';
import Aprobaciones from './pages/Aprobaciones';
import Quincenas from './pages/Quincenas'; // <-- Importación agregada
import Pedidos from './pages/Pedidos';
import Liquidaciones from './pages/Liquidaciones';
import Config from './pages/Config';
import Login from './pages/Login';
import MapaFlota from './pages/MapaFlota';
import Publicidad from './pages/Publicidad';

function AppRoutes() {
  const { currentUser, loading } = useAuth();

  // Pantalla de Carga Estilizada (Pana Style con Verde Marca)
  if (loading) {
    return (
      <div className="h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 bg-[#118C4F]/20 rounded-full animate-ping"></div>
          <div className="w-16 h-16 border-4 border-[#118C4F]/10 border-t-[#118C4F] rounded-full animate-spin"></div>
        </div>
        <h2 className="mt-8 text-2xl font-black italic tracking-tighter text-[#118C4F]">Pana Voy</h2>
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

  // Panel Administrativo Exclusivo (Solo Carlos)
  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white selection:bg-[#118C4F]/30">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/aprobaciones" element={<Aprobaciones />} />
            <Route path="/quincenas" element={<Quincenas />} /> {/* <-- Ruta agregada */}
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/liquidaciones" element={<Liquidaciones />} />
            <Route path="/mapa" element={<MapaFlota />} />
            <Route path="/publicidad" element={<Publicidad />} />
            <Route path="/config" element={<Config />} />
            
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