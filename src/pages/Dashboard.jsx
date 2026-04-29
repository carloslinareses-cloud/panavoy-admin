import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';

const Dashboard = () => {
  const [stats, setStats] = useState({ ventasHoy: 0, pedidosHoy: 0, tasa: 0 });

  useEffect(() => {
    // Escuchar Tasa BCV
    onValue(ref(db, 'config/tasa_bcv'), (snapshot) => {
      if (snapshot.exists()) setStats(prev => ({ ...prev, tasa: snapshot.val() }));
    });

    // Escuchar Pedidos del día
    onValue(ref(db, 'pedidos'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const lista = Object.values(data);
        const hoy = new Date().toLocaleDateString();
        const pedidosHoy = lista.filter(p => new Date(p.timestamp).toLocaleDateString() === hoy);
        const totalUsd = pedidosHoy.reduce((acc, p) => acc + (p.total || 0), 0);
        setStats(prev => ({ ...prev, pedidosHoy: pedidosHoy.length, ventasHoy: totalUsd }));
      }
    });
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Radar de Negocio</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm">Ventas de Hoy (USD)</p>
          <h3 className="text-4xl font-bold text-green-400">${stats.ventasHoy.toFixed(2)}</h3>
          <p className="text-xs text-gray-500 mt-2">≈ {(stats.ventasHoy * stats.tasa).toFixed(2)} Bs</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm">Pedidos Activos</p>
          <h3 className="text-4xl font-bold text-blue-400">{stats.pedidosHoy}</h3>
          <p className="text-xs text-gray-500 mt-2">Órdenes realizadas hoy</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm">Tasa BCV</p>
          <h3 className="text-4xl font-bold text-yellow-500">{stats.tasa}</h3>
          <p className="text-xs text-gray-500 mt-2">Bs por Dólar</p>
        </div>
      </div>

      <div className="mt-12 bg-gray-800 p-8 rounded-xl border border-gray-700 text-center">
        <p className="text-gray-400 italic">Selecciona una opción del menú lateral para gestionar Clientes o Socios.</p>
      </div>
    </div>
  );
};

export default Dashboard;