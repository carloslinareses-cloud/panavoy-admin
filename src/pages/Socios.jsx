import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase/config';
import { ref, onValue, update } from 'firebase/database';
import { 
  Store, Truck, Check, X, Eye, ShieldCheck, 
  AlertCircle, Users, Camera, FileText, MessageSquare,
  RotateCw, ZoomIn, ZoomOut, BellRing, Zap
} from 'lucide-react';

export default function Socios() {
  const [socios, setSocios] = useState({ tiendas: [], choferes: [] });
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [filtro, setFiltro] = useState('pending');
  
  // Estados para el visor de imágenes
  const [rotacion, setRotacion] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const sociosRef = ref(db, 'socios');
    const unsub = onValue(sociosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const tiendas = data.tiendas ? Object.keys(data.tiendas).map(id => ({ id, type: 'tienda', ...data.tiendas[id] })) : [];
        const choferes = data.choferes ? Object.keys(data.choferes).map(id => ({ id, type: 'chofer', ...data.choferes[id] })) : [];
        setSocios({ tiendas, choferes });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- LÓGICA DE NOTIFICACIONES PUSH ---
  const sendPushNotification = async (token, title, body) => {
    if (!token) {
      console.log("Socio sin FCM Token, no se puede enviar push.");
      return;
    }
    // Aquí es donde conectarías con tu Server Key de FCM o tu Backend
    console.log(`Disparando Push a ${token}: [${title}] ${body}`);
  };

  const handleDecision = async (id, type, decision) => {
    const path = `socios/${type}s/${id}`;
    const updates = { status: decision };
    
    let pushTitle = "";
    let pushBody = "";

    if (decision === 'approved') {
      pushTitle = "¡Cuenta Activada! 🚀";
      pushBody = "Felicidades, ya puedes empezar a recibir pedidos en Pana Voy.";
    } else {
      if (!motivoRechazo) return alert("Por favor, escribe un motivo para el rechazo.");
      updates.mensajeRechazo = motivoRechazo;
      pushTitle = "Revisión de Cuenta ⚠️";
      pushBody = `Tu solicitud requiere cambios: ${motivoRechazo}`;
    }

    try {
      await update(ref(db, path), updates);
      
      // Intentar enviar la notificación si el token existe
      if (modalData?.fcmToken) {
        await sendPushNotification(modalData.fcmToken, pushTitle, pushBody);
      }

      cerrarModal();
      setMotivoRechazo('');
    } catch (err) {
      alert('Error en la sincronización espejo: ' + err.message);
    }
  };

  const cerrarModal = () => {
    setModalData(null);
    setRotacion(0);
    setZoom(1);
    setMotivoRechazo('');
  };

  const countPending = (list) => list.filter(s => s.status === 'pending').length;

  // Acciones Urgentes Memoized
  const urgentes = useMemo(() => {
    return [...socios.tiendas, ...socios.choferes].filter(s => s.status === 'pending');
  }, [socios]);

  const renderSocioCard = (socio) => (
    <div key={socio.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-2xl transition-all group animate-in fade-in duration-500">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${socio.type === 'tienda' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'} group-hover:scale-110 transition-transform`}>
          {socio.type === 'tienda' ? <Store size={24} /> : <Truck size={24} />}
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border ${
            socio.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
            socio.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            }`}>
            {socio.status || 'pending'}
            </span>
            {socio.fcmToken && <BellRing size={12} className="text-blue-500 animate-pulse" title="FCM Disponible" />}
        </div>
      </div>

      <div className="space-y-1 mb-6">
        <h4 className="font-black text-white text-lg truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">
          {socio.nombre || socio.nombreTienda || 'Sin Nombre'}
        </h4>
        <p className="text-gray-400 text-xs truncate font-medium">{socio.email}</p>
        <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] bg-gray-900 text-gray-500 px-2 py-0.5 rounded font-mono">ID: {socio.id.slice(-6)}</span>
            {socio.type === 'chofer' && <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">{socio.vehiculo}</span>}
        </div>
      </div>

      <button 
        onClick={() => setModalData(socio)}
        className="w-full bg-gray-700 hover:bg-blue-600 text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
      >
        <Eye size={16} /> REVISAR EXPEDIENTE
      </button>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      
      {/* SECCIÓN: ACCIONES URGENTES (SOLO SI HAY PENDIENTES) */}
      {urgentes.length > 0 && (
        <div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-[2.5rem] shadow-2xl shadow-blue-900/20 animate-in slide-in-from-top duration-700">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
                <Zap size={20} className="fill-current"/>
                <h3 className="font-black uppercase tracking-widest text-sm">Buzón de Acciones Urgentes</h3>
            </div>
            <div className="flex flex-wrap gap-3">
                {urgentes.map(u => (
                    <button 
                        key={u.id} 
                        onClick={() => setModalData(u)}
                        className="bg-gray-800 hover:bg-blue-600 border border-gray-700 px-4 py-2 rounded-2xl flex items-center gap-3 transition-all text-left"
                    >
                        <div className="text-xs">
                            <p className="text-gray-500 font-black uppercase text-[9px] leading-none mb-1">Pendiente {u.type}</p>
                            <p className="text-white font-bold">{u.nombre || u.nombreTienda}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* Cabecera con Filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-gray-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Auditoría de Socios</h2>
          <p className="text-gray-400 font-medium">Valida documentos legales para activar comercios y flota.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex bg-gray-800 p-1 rounded-2xl border border-gray-700">
                <button onClick={() => setFiltro('pending')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filtro === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>PENDIENTES</button>
                <button onClick={() => setFiltro('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filtro === 'all' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>TODOS</button>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-2xl text-center">
                <p className="text-[10px] text-yellow-600 font-black uppercase">Por Aprobar</p>
                <p className="text-xl font-black text-white">{countPending(socios.tiendas) + countPending(socios.choferes)}</p>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* SECCIÓN TIENDAS */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Store size={20} /></div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Aliados Comerciales</h3>
              <span className="bg-gray-800 px-2 py-0.5 rounded-full text-xs text-gray-500 border border-gray-700">{socios.tiendas.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {socios.tiendas.filter(s => filtro === 'all' ? true : s.status === 'pending').map(renderSocioCard)}
            </div>
          </section>

          {/* SECCIÓN CHOFERES */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-500/20 p-2 rounded-lg text-green-400"><Truck size={20} /></div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Flota Pana Voy</h3>
              <span className="bg-gray-800 px-2 py-0.5 rounded-full text-xs text-gray-500 border border-gray-700">{socios.choferes.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {socios.choferes.filter(s => filtro === 'all' ? true : s.status === 'pending').map(renderSocioCard)}
            </div>
          </section>
        </div>
      )}

      {/* MODAL DE AUDITORÍA AVANZADO */}
      {modalData && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] max-w-6xl w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            
            <div className="p-8 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-600/20"><ShieldCheck size={28}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{modalData.nombre || modalData.nombreTienda}</h3>
                        <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">{modalData.type} • {modalData.email}</p>
                    </div>
                </div>
                <button onClick={cerrarModal} className="p-2 bg-gray-900 rounded-full text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 space-y-6 flex flex-col h-full">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                            <Camera size={14}/> Evidencia Fotográfica
                        </h4>
                        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl">
                            <button onClick={() => setRotacion(r => r + 90)} className="p-2 text-gray-400 hover:text-white" title="Rotar"><RotateCw size={18}/></button>
                            <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 text-gray-400 hover:text-white"><ZoomIn size={18}/></button>
                            <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 text-gray-400 hover:text-white"><ZoomOut size={18}/></button>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-gray-900 rounded-3xl overflow-auto flex items-center justify-center p-4 border border-gray-700 shadow-inner relative">
                        <div 
                            className="transition-transform duration-300 ease-out"
                            style={{ transform: `rotate(${rotacion}deg) scale(${zoom})` }}
                        >
                            {modalData.type === 'tienda' ? (
                                <div className="space-y-8">
                                    <img src={modalData.rifUrl} alt="RIF" className="max-w-full rounded-lg shadow-2xl"/>
                                    <img src={modalData.fachadaUrl} alt="Fachada" className="max-w-full rounded-lg shadow-2xl"/>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <img src={modalData.licenciaUrl} alt="Licencia" className="max-w-full rounded-lg shadow-2xl"/>
                                    <img src={modalData.cedulaUrl} alt="Cédula" className="max-w-full rounded-lg shadow-2xl"/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-900/30 flex flex-col justify-between border-l border-gray-700">
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-white font-black uppercase tracking-tighter mb-4">Información Extra</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700/50">
                                    <span className="text-gray-500 block text-[9px] font-black uppercase mb-1">Teléfono</span>
                                    <span className="text-white font-bold">{modalData.telefono || 'N/A'}</span>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700/50">
                                    <span className="text-gray-500 block text-[9px] font-black uppercase mb-1">{modalData.type === 'tienda' ? 'Zelle' : 'Placa'}</span>
                                    <span className="text-white font-bold">{modalData.zelleEmail || modalData.placa || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-white font-black uppercase tracking-tighter flex items-center gap-2 text-red-500">
                                <MessageSquare size={16}/> Comentarios de Auditoría
                            </h4>
                            <textarea 
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                placeholder="Escribe aquí el motivo si decides rechazar..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-5 text-sm text-white focus:border-red-500 outline-none h-40 transition-all resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => handleDecision(modalData.id, modalData.type, 'rejected')}
                            className="flex-1 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white py-4 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <X size={18} /> RECHAZAR
                        </button>
                        <button 
                            onClick={() => handleDecision(modalData.id, modalData.type, 'approved')}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-green-900/40 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Check size={18} /> APROBAR
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}