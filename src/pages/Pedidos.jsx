import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { ShoppingBag, Clock, CheckCircle, Truck, User, Store, AlertCircle } from 'lucide-react';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [tasa, setTasa] = useState(0);

  useEffect(() => {
    const tasaRef = ref(db, 'config/tasa_bcv');
    const unsubTasa = onValue(tasaRef, (snapshot) => {
      if (snapshot.exists()) setTasa(parseFloat(snapshot.val()) || 0);
    });

    const pedidosRef = ref(db, 'pedidos');
    const unsubPedidos = onValue(pedidosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Mapeo profundo para capturar pedidos de todas las tiendas
        const lista = [];
        Object.keys(data || {}).forEach((storeId) => {
          const storeData = data[storeId];
          if (storeData && typeof storeData === 'object') {
            Object.keys(storeData).forEach((pedidoId) => {
              const pedidoObj = storeData[pedidoId] || {};
              lista.push({ id: pedidoId, storeId, ...pedidoObj });
            });
          }
        });
        setPedidos(lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      } else {
        setPedidos([]);
      }
    });

    return () => {
      if (typeof unsubTasa === 'function') unsubTasa();
      if (typeof unsubPedidos === 'function') unsubPedidos();
    };
  }, []);

  const totalUsd = pedidos.reduce((acc, p) => acc + (parseFloat(p?.total) || 0), 0);
  const tasaNum = parseFloat(tasa) || 0;

  const getStatusStyle = (status) => {
    const s = (status || '').toString().toLowerCase();
    switch (s) {
      case 'pending':
      case 'pendiente':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'on the way':
      case 'en_camino':
      case 'en camino':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed':
      case 'delivered':
      case 'entregado':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Monitor de Pedidos</h2>
          <p className="text-gray-400 font-medium">Flujo transaccional en vivo — Charallave</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl backdrop-blur-sm">
          <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest mb-1">Ventas Totales (Hoy)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">${totalUsd.toFixed(2)}</h3>
            <span className="text-sm text-gray-500 font-bold">≈ {(totalUsd * tasaNum).toFixed(2)} Bs</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="group bg-gray-800/50 border border-gray-700 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-6 hover:border-blue-500/30 hover:bg-gray-800 transition-all">
            
            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="bg-gray-900 p-4 rounded-xl group-hover:scale-110 transition-transform">
                <ShoppingBag className="text-blue-500" size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Orden ID</p>
                <p className="font-bold text-white text-lg">#{(pedido.id || '').slice(-6).toUpperCase()}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <User size={12}/> {pedido.cliente || 'Consumidor'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 min-w-[150px]">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
                <Store size={14} className="text-gray-600"/> {pedido.storeId?.slice(0, 10)}...
              </div>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase w-fit ${getStatusStyle(pedido.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-current ${String(pedido.status).toLowerCase() === 'pending' ? 'animate-ping' : ''}`}></span>
                {pedido.status || 'Recibido'}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <p className="text-[10px] text-gray-500 font-black uppercase">Monto Total</p>
              <p className="text-2xl font-black text-white">${(parseFloat(pedido?.total) || 0).toFixed(2)}</p>
              <p className="text-[10px] text-gray-400 font-mono">{((parseFloat(pedido?.total) || 0) * tasaNum).toFixed(2)} Bs</p>
            </div>
          </div>
        ))}
        
        {pedidos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm text-center">No se detectan transacciones activas hoy</p>
          </div>
        )}
      </div>
    </div>
  );
}
