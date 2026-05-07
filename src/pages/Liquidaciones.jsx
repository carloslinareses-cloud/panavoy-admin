import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { Receipt, Clock, CheckCircle, Eye, X, AlertCircle, Store, Truck, Calendar, Image as ImageIcon } from 'lucide-react';
import FormularioPagoMovil from '../components/FormularioPagoMovil';
import { Plus } from 'lucide-react';

export default function Liquidaciones() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comprobanteModal, setComprobanteModal] = useState(null);
  const [showRegistrar, setShowRegistrar] = useState(false);
  const [filtro, setFiltro] = useState('all');

  useEffect(() => {
    const pagosRef = ref(db, 'pagos_choferes');
    const unsub = onValue(pagosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const lista = Object.keys(data).map(id => ({ id, ...data[id] }));
        setPagos(lista.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      } else {
        setPagos([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalPagado = useMemo(() => pagos.filter(p => p.status === 'completed').reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0), [pagos]);
  const totalPendiente = useMemo(() => pagos.filter(p => p.status === 'pending_confirmation').reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0), [pagos]);
  const filtrados = pagos.filter(p => filtro === 'all' ? true : p.status === filtro);
  const formatearFecha = (ts) => ts ? new Date(ts).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'S/F';

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-gray-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Monitor de Liquidaciones</h2>
          <p className="text-gray-400 font-medium">Transferencias directas entre Tiendas y Choferes.</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-2xl min-w-[160px]">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Por Confirmar</p>
                <p className="text-2xl font-black text-[#FFFFCA28] mt-1">${totalPendiente.toFixed(2)}</p>
            </div>
            <div className="bg-[#118C4F]/10 border border-[#118C4F]/20 p-5 rounded-2xl min-w-[160px]">
                <p className="text-[10px] text-[#118C4F] font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle size={12}/> Liquidado</p>
                <p className="text-2xl font-black text-white mt-1">${totalPagado.toFixed(2)}</p>
            </div>
        </div>
      </div>

      <div className="flex bg-gray-800 p-1 rounded-2xl border border-gray-700 w-max">
        <button onClick={() => setFiltro('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'all' ? 'bg-[#118C4F] text-white shadow-lg shadow-[#118C4F]/20' : 'text-gray-500 hover:text-white'}`}>Todos</button>
        <button onClick={() => setFiltro('pending_confirmation')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'pending_confirmation' ? 'bg-[#118C4F] text-white shadow-lg shadow-[#118C4F]/20' : 'text-gray-500 hover:text-white'}`}>Pendientes</button>
        <button onClick={() => setFiltro('completed')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'completed' ? 'bg-[#118C4F] text-white shadow-lg shadow-[#118C4F]/20' : 'text-gray-500 hover:text-white'}`}>Completados</button>
        <button onClick={() => setShowRegistrar(true)} className="ml-4 px-4 py-2 rounded-xl bg-[#118C4F] text-white font-black flex items-center gap-2"><Plus size={14}/> Registrar Pago</button>
      </div>

      <div className="bg-gray-800 rounded-[2rem] border border-gray-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-white">
          <thead className="bg-gray-900/50 text-[10px] text-gray-500 font-black uppercase border-b border-gray-700 tracking-widest">
            <tr>
              <th className="p-6">ID Pago / Fecha</th>
              <th className="p-6">Emisor (Tienda)</th>
              <th className="p-6">Receptor (Chofer)</th>
              <th className="p-6 text-right">Monto</th>
              <th className="p-6 text-center">Estatus</th>
              <th className="p-6 text-center">Capture</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {filtrados.map((pago) => (
              <tr key={pago.id} className="hover:bg-[#118C4F]/5 transition-colors group">
                <td className="p-6">
                  <span className="font-black block uppercase tracking-tighter text-sm">#{pago.id.slice(-6)}</span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold mt-1"><Calendar size={10}/> {formatearFecha(pago.timestamp)}</span>
                </td>
                <td className="p-6"><div className="flex items-center gap-2"><Store size={14} className="text-[#118C4F]"/><span className="text-xs font-bold text-gray-300">{pago.storeId.slice(0, 12)}...</span></div></td>
                <td className="p-6"><div className="flex items-center gap-2"><Truck size={14} className="text-gray-400"/><span className="text-xs font-bold text-gray-300">{pago.choferId.slice(0, 12)}...</span></div></td>
                <td className="p-6 text-right"><span className="text-xl font-black">${parseFloat(pago.monto).toFixed(2)}</span></td>
                <td className="p-6 text-center">
                  {pago.status === 'completed' ? (
                    <span className="bg-[#118C4F]/10 text-[#118C4F] border border-[#118C4F]/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1"><CheckCircle size={10}/> CONFIRMADO</span>
                  ) : (
                    <span className="bg-[#FFFFCA28]/10 text-[#FFFFCA28] border border-[#FFFFCA28]/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1 animate-pulse"><Clock size={10}/> ESPERANDO</span>
                  )}
                </td>
                <td className="p-6 text-center">
                  {pago.comprobanteUrl ? (
                    <button onClick={() => setComprobanteModal(pago)} className="p-2 bg-gray-900 text-gray-400 hover:bg-[#118C4F] hover:text-white rounded-xl transition-all shadow-lg mx-auto block"><Eye size={18} /></button>
                  ) : (
                    <span className="text-[10px] text-gray-600 font-bold uppercase">Sin Capture</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && !loading && (
          <div className="p-20 text-center flex flex-col items-center"><Receipt size={48} className="text-gray-700 mb-4" /><p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No hay liquidaciones</p></div>
        )}
      </div>

      {comprobanteModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl flex flex-col border-t-[#118C4F] border-t-4">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#118C4F]/20 rounded-xl text-[#118C4F]"><ImageIcon size={20}/></div>
                <div><h3 className="text-sm font-black text-white uppercase tracking-widest">Comprobante de Pago</h3><p className="text-[10px] text-gray-500 font-mono">ID: #{comprobanteModal.id.slice(-8)}</p></div>
              </div>
              <button onClick={() => setComprobanteModal(null)} className="p-2 bg-gray-900 rounded-full text-gray-500 hover:text-white transition-all"><X size={20}/></button>
            </div>
            <div className="p-6 bg-gray-900 flex justify-center items-center">
              <img src={comprobanteModal.comprobanteUrl} alt="Capture" className="max-h-[60vh] object-contain rounded-2xl border border-gray-700 shadow-2xl" />
            </div>
            <div className="p-6 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-gray-500">Monto Transferido</span>
                <span className="text-2xl font-black text-white">${parseFloat(comprobanteModal.monto).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
      {showRegistrar && (
        <div className="fixed inset-0 bg-black/70 z-[220] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-6 bg-gray-900 rounded-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black">Registrar Pago Móvil</h3>
              <button onClick={() => setShowRegistrar(false)} className="text-gray-400">Cerrar</button>
            </div>
            <FormularioPagoMovil defaultStoreId={'admin_panel'} onSuccess={() => setShowRegistrar(false)} />
          </div>
        </div>
      )}
    </div>
  );
}