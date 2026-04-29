import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Inicio', path: '/', icon: '📊' },
    { name: 'Clientes', path: '/clientes', icon: '👥' },
    { name: 'Socios', path: '/socios', icon: '🏪' },
    { name: 'Pedidos', path: '/pedidos', icon: '🛵' },
    { name: 'Radar de Flota', path: '/mapa', icon: '📍' },
    { name: 'Configuración', path: '/config', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-500">Pana Voy</h1>
        <p className="text-xs text-gray-400 uppercase tracking-widest">Admin Panel</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors font-medium"
        >
          <span>🚪</span> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;