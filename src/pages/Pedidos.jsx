import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { ShoppingBag, Clock, CheckCircle, Truck, User, Store, AlertCircle, Wallet, Banknote, CarFront, MapPin } from 'lucide-react';

export default function Pedidos() {
  const [pedidosData, setPedidosData] = useState([]);
  const [viajesData, setViajesData] = useState([]);
  const [tasa, setTasa] = useState(0);

  useEffect(() => {
    const tasaRef = ref(db, 'config/tasa_bcv');
    const unsubTasa = onValue(tasaRef, (snapshot) => {
      if (snapshot.exists()) setTasa(parseFloat(snapshot.val()) || 0);
    });

    // LISTENER 1: PEDIDOS DELIVERY
    const pedidosRef = ref(db, 'pedidos');
    const unsubPedidos = onValue(pedidosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const lista = [];
        Object.keys(data || {}).forEach((storeId) => {
          const storeData = data[storeId];
          if (storeData && typeof storeData === 'object') {
            Object.keys(storeData).forEach((pedidoId) => {
              lista.push({ id: pedidoId, storeId, type: 'delivery', ...storeData[pedidoId] });
            });
          }
        });
        setPedidosData(lista);
      } else {
        setPedidosData([]);
      }
    });

    // LISTENER 2: VIAJES (TAXIS)
    const viajesRef = ref(db, 'viajes');
    const unsubViajes = onValue(viajesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const lista = Object.keys(data || {}).map(id => ({ id, type: 'taxi', ...data[id] }));
        setViajesData(lista);
      } else {
        setViajesData([]);
      }
    });

    return () => {
      if (typeof unsubTasa === 'function') unsubTasa();
      if (typeof unsubPedidos === 'function') unsubPedidos();
      if (typeof unsubViajes === 'function') unsubViajes();
    };
  }, []);

  // FUSIONAMOS Y ORDENAMOS (NUEVO + VIEJO)
  const pedidosCompletos = useMemo(() => {
    return [...pedidosData, ...viajesData].sort((a, b) => new Date(b.fecha || b.timestamp || 0) - new Date(a.fecha || a.timestamp || 0));
  }, [pedidosData, viajesData]);

  const totalUsd = pedidosCompletos.reduce((acc, p) => acc + (parseFloat(p?.total || p?.monto) || 0), 0);
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
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Monitor de Operaciones</h2>
          <p className="text-gray-400 font-medium">Flujo transaccional en vivo (Delivery & Taxis)</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl backdrop-blur-sm">
          <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest mb-1">Volumen Operativo</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">${totalUsd.toFixed(2)}</h3>
            <span className="text-sm text-gray-500 font-bold">≈ {(totalUsd * tasaNum).toFixed(2)} Bs</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {pedidosCompletos.map((pedido) => {
          const isTaxi = pedido.type === 'taxi';
          const montoTotal = parseFloat(pedido.total || pedido.monto) || 0;
          const montoBolivares = parseFloat(pedido.montoBS) || (montoTotal * tasaNum);

          return (
            <div key={pedido.id} className="group bg-gray-800/50 border border-gray-700 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-6 hover:border-blue-500/30 hover:bg-gray-800 transition-all">
              
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className={`p-4 rounded-xl group-hover:scale-110 transition-transform shadow-inner ${isTaxi ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-900 text-blue-500'}`}>
                  {isTaxi ? <CarFront size={24} /> : <ShoppingBag size={24} />}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">{isTaxi ? 'Viaje ID' : 'Orden ID'}</p>
                  <p className="font-bold text-white text-lg">#{(pedido.id || '').slice(-6).toUpperCase()}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <User size={12}/> {pedido.cliente || 'Consumidor'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[150px]">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
                  {isTaxi ? <MapPin size={14} className="text-gray-500"/> : <Store size={14} className="text-gray-500"/>}
                  {isTaxi ? 'Ruta de Transporte' : (pedido.storeId?.slice(0, 15) + '...')}
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase w-fit ${getStatusStyle(pedido.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${String(pedido.status).toLowerCase() === 'pending' ? 'animate-ping' : ''}`}></span>
                  {pedido.status || 'Recibido'}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <p className="text-[10px] text-gray-500 font-black uppercase">Liquidación</p>
                <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-700/50">
                  <span className="text-xl font-black text-white">${montoTotal.toFixed(2)}</span>
                  <span className="text-gray-600 font-black">|</span>
                  <span className="text-sm font-black text-blue-400">{montoBolivares.toFixed(2)} Bs</span>
                </div>
                
                {/* BADGE DE MÉTODO DE PAGO */}
                {pedido.metodoPago === 'Efectivo' ? (
                  <span className="bg-green-500/10 text-green-500 text-[9px] font-black px-2 py-1 rounded-lg border border-green-500/20 flex items-center gap-1 w-max shadow-sm mt-1 uppercase tracking-widest">
                    <Banknote size={12}/> Pago en Efectivo
                  </span>
                ) : (
                  <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1 w-max shadow-sm mt-1 uppercase tracking-widest">
                    <Wallet size={12}/> {pedido.metodoPago || 'Pago Digital'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        
        {pedidosCompletos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm text-center">No se detectan transacciones activas hoy</p>
          </div>
        )}
      </div>
    </div>
  );
}