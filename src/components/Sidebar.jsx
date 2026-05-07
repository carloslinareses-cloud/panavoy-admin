import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  Receipt,
  MapPin, 
  Megaphone, 
  Settings, 
  LogOut,
  ShieldCheck,
  Wallet
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Inicio', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
    { name: 'Socios', path: '/socios', icon: <Store size={20} /> },
    { name: 'Aprobaciones', path: '/aprobaciones', icon: <ShieldCheck size={20} /> },
    { name: 'Membresías', path: '/quincenas', icon: <Wallet size={20} /> }, // <-- NUEVA PESTAÑA AÑADIDA AQUÍ
    { name: 'Pedidos', path: '/pedidos', icon: <Package size={20} /> },
    { name: 'Liquidaciones', path: '/liquidaciones', icon: <Receipt size={20} /> },
    { name: 'Radar de Flota', path: '/mapa', icon: <MapPin size={20} /> },
    { name: 'Publicidad', path: '/publicidad', icon: <Megaphone size={20} /> },
    { name: 'Configuración', path: '/config', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col h-screen sticky top-0 z-50">
      {/* LOGO AREA */}
      <div className="p-8">
        <h1 className="text-3xl font-black text-[#118C4F] tracking-tighter italic">Pana Voy</h1>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Admin Console</p>
      </div>
      
      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2 mt-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-[1.2rem] transition-all duration-300 group ${
                isActive 
                ? 'bg-[#118C4F] text-white shadow-xl shadow-[#118C4F]/20' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="font-bold text-sm tracking-tight">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER / LOGOUT */}
      <div className="p-4 border-t border-gray-800/50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-4 text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-2xl transition-all duration-300 font-black text-xs uppercase tracking-widest group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;