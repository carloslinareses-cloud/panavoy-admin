import React, { useEffect, useState, useMemo } from 'react';
import { db, storage } from '../firebase/config';
import { ref as dbRef, onValue, update, remove } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { CheckCircle, XCircle, Clock, Eye, Trash2, X, Wallet, AlertTriangle, Image as ImageIcon } from 'lucide-react';

export default function Quincenas() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comprobanteModal, setComprobanteModal] = useState(null);
  const [filtro, setFiltro] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const pagosRef = dbRef(db, 'pagos_plataforma');
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

  // Lógica inteligente para calcular el próximo vencimiento (Día 14 o Fin de mes)
  const calcularProximaFecha = () => {
    const hoy = new Date();
    const dia = hoy.getDate();
    let proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    if (dia < 14) {
      proximaFecha.setDate(14);
    } else if (dia >= 14 && dia <= 27) {
      // Fin de mes
      proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
    } else {
      // Si paga el 28, 29, 30 o 31, brinca al 14 del mes siguiente
      proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 14, 23, 59, 59);
    }
    return proximaFecha.getTime();
  };

  const handleDecision = async (pago, decision) => {
    if (!window.confirm(`¿Seguro que deseas ${decision === 'approved' ? 'APROBAR' : 'RECHAZAR'} este pago?`)) return;
    setIsProcessing(true);
    
    try {
      const updates = {};
      const statusPago = decision === 'approved' ? 'approved' : 'rejected';
      const statusSocio = decision === 'approved' ? 'active' : 'vencido';
      
      updates[`pagos_plataforma/${pago.id}/status`] = statusPago;
      updates[`socios/${pago.tipoSocio}/${pago.uid}/subscriptionStatus`] = statusSocio;

      if (decision === 'approved') {
        updates[`socios/${pago.tipoSocio}/${pago.uid}/nextPaymentDate`] = calcularProximaFecha();
      }

      await update(dbRef(db), updates);
    } catch (error) {
      alert("Error al procesar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const limpiarAntiguos = async () => {
    const limiteDias = 15 * 24 * 60 * 60 * 1000;
    const limiteTimestamp = Date.now() - limiteDias;
    
    const pagosViejos = pagos.filter(p => p.status !== 'pending' && p.timestamp < limiteTimestamp);
    
    if (pagosViejos.length === 0) {
      return alert("No hay recibos antiguos (más de 15 días) para limpiar.");
    }

    if (!window.confirm(`⚠️ Cost Saving: Se eliminarán ${pagosViejos.length} recibos viejos de la base de datos y de Storage. ¿Continuar?`)) return;

    setIsProcessing(true);
    let borrados = 0;

    for (const p of pagosViejos) {
      try {
        if (p.comprobanteUrl) {
          const fileRef = storageRef(storage, p.comprobanteUrl);
          await deleteObject(fileRef).catch(() => console.log("Archivo ya no existía en storage"));
        }
        await remove(dbRef(db, `pagos_plataforma/${p.id}`));
        borrados++;
      } catch (error) {
        console.error("Error borrando recibo:", p.id, error);
      }
    }
    
    setIsProcessing(false);
    alert(`Limpieza profunda completada. Se liberó espacio de ${borrados} recibos.`);
  };

  const formatearFecha = (ts) => ts ? new Date(ts).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'S/F';
  const filtrados = pagos.filter(p => p.status === filtro);
  const totalPendientes = pagos.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-gray-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Suscripciones (Quincena)</h2>
          <p className="text-gray-400 font-medium">Auditoría de mensualidades pagadas por Socios a la plataforma.</p>
        </div>
        <div className="flex gap-4">
            <button onClick={limpiarAntiguos} disabled={isProcessing} className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-5 rounded-2xl flex items-center gap-2 font-black transition-all text-xs uppercase tracking-widest shadow-lg">
                <Trash2 size={16}/> Limpiar (+15 Días)
            </button>
            <div className="bg-[#FFFFCA28]/10 border border-[#FFFFCA28]/20 p-5 rounded-2xl min-w-[160px]">
                <p className="text-[10px] text-[#FFFFCA28] font-black uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Por Revisar</p>
                <p className="text-2xl font-black text-white mt-1">{totalPendientes}</p>
            </div>
        </div>
      </div>

      <div className="flex bg-gray-800 p-1 rounded-2xl border border-gray-700 w-max">
        <button onClick={() => setFiltro('pending')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'pending' ? 'bg-[#118C4F] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Pendientes</button>
        <button onClick={() => setFiltro('approved')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'approved' ? 'bg-[#118C4F] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Aprobados</button>
        <button onClick={() => setFiltro('rejected')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === 'rejected' ? 'bg-[#118C4F] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Rechazados</button>
      </div>

      <div className="bg-gray-800 rounded-[2rem] border border-gray-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-white">
          <thead className="bg-gray-900/50 text-[10px] text-gray-500 font-black uppercase border-b border-gray-700 tracking-widest">
            <tr>
              <th className="p-6">ID Pago / Fecha</th>
              <th className="p-6">Socio (Emisor)</th>
              <th className="p-6 text-center">Capture</th>
              <th className="p-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {filtrados.map((pago) => (
              <tr key={pago.id} className="hover:bg-[#118C4F]/5 transition-colors group">
                <td className="p-6">
                  <span className="font-black block uppercase tracking-tighter text-sm">#{pago.id.slice(-6)}</span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold mt-1"><Calendar size={10}/> {formatearFecha(pago.timestamp)}</span>
                </td>
                <td className="p-6">
                  <span className="text-xs font-black text-white uppercase tracking-widest bg-gray-900 px-2 py-1 rounded-lg">{pago.tipoSocio}</span>
                  <span className="block text-xs font-bold text-gray-400 mt-1 font-mono">{pago.uid.slice(0, 15)}...</span>
                </td>
                <td className="p-6 text-center">
                  {pago.comprobanteUrl ? (
                    <button onClick={() => setComprobanteModal(pago)} className="p-2 bg-gray-900 text-gray-400 hover:bg-[#118C4F] hover:text-white rounded-xl transition-all shadow-lg mx-auto block"><Eye size={18} /></button>
                  ) : (
                    <span className="text-[10px] text-gray-600 font-bold uppercase">Sin Capture</span>
                  )}
                </td>
                <td className="p-6 text-center">
                  {pago.status === 'pending' ? (
                    <div className="flex justify-center gap-2">
                        <button disabled={isProcessing} onClick={() => handleDecision(pago, 'rejected')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50"><XCircle size={18}/></button>
                        <button disabled={isProcessing} onClick={() => handleDecision(pago, 'approved')} className="p-2 bg-[#118C4F]/20 text-[#118C4F] hover:bg-[#118C4F] hover:text-white rounded-xl transition-all disabled:opacity-50"><CheckCircle size={18}/></button>
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1 border ${pago.status === 'approved' ? 'bg-[#118C4F]/10 text-[#118C4F] border-[#118C4F]/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {pago.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && !loading && (
          <div className="p-20 text-center flex flex-col items-center"><Wallet size={48} className="text-gray-700 mb-4" /><p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Bandeja Vacía</p></div>
        )}
      </div>

      {/* Modal de Capture */}
      {comprobanteModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl flex flex-col border-t-[#118C4F] border-t-4">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#118C4F]/20 rounded-xl text-[#118C4F]"><ImageIcon size={20}/></div>
                <div><h3 className="text-sm font-black text-white uppercase tracking-widest">Comprobante de Pago</h3></div>
              </div>
              <button onClick={() => setComprobanteModal(null)} className="p-2 bg-gray-900 rounded-full text-gray-500 hover:text-white transition-all"><X size={20}/></button>
            </div>
            <div className="p-6 bg-gray-900 flex justify-center items-center">
              <img src={comprobanteModal.comprobanteUrl} alt="Capture" className="max-h-[65vh] object-contain rounded-2xl border border-gray-700 shadow-2xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}