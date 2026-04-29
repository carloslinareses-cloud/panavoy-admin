import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase/config';
import { ref, onValue, update, query, orderByChild, equalTo } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { 
  Store, Truck, Check, X, Eye, ShieldCheck, 
  AlertCircle, Users, Camera, FileText, MessageSquare,
  RotateCw, ZoomIn, ZoomOut, BellRing, Zap, 
  ShieldAlert, Phone, MapPin, Star, Circle, CarFront // <-- NUEVO ICONO: CarFront
} from 'lucide-react';

export default function Socios() {
  const { currentUser } = useAuth();
  // MEJORA: Agregado el array de 'taxis' al estado inicial
  const [socios, setSocios] = useState({ tiendas: [], choferes: [], taxis: [] });
  const [sosAlerts, setSosAlerts] = useState([]); 
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // <-- NUEVO: Estado de carga para los botones
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [filtro, setFiltro] = useState('pending');
  
  const [rotacion, setRotacion] = useState(0);
  const [zoom, setZoom] = useState(1);

  const isAdmin = currentUser?.email === 'carlos.linares.es@gmail.com';

  useEffect(() => {
    // 1. LISTENER DE SOCIOS GENERAL (Auditoría: Tiendas, Choferes, Taxis)
    const sociosRef = ref(db, 'socios');
    const unsubSocios = onValue(sociosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const tiendas = data?.tiendas ? Object.keys(data.tiendas).map(id => ({ id, type: 'tienda', ...data.tiendas[id] })) : [];
        const choferes = data?.choferes ? Object.keys(data.choferes).map(id => ({ id, type: 'chofer', ...data.choferes[id] })) : [];
        // MEJORA: Lectura segura del nuevo nodo de Taxis
        const taxis = data?.taxis ? Object.keys(data.taxis).map(id => ({ id, type: 'taxi', ...data.taxis[id] })) : [];
        
        setSocios({ tiendas, choferes, taxis });
      } else {
        setSocios({ tiendas: [], choferes: [], taxis: [] });
      }
      setLoading(false);
    });

    // 2. LISTENER DE EMERGENCIAS SOS (Mantenido intacto)
    const sosQuery = query(ref(db, 'socios/choferes'), orderByChild('needsSupport'), equalTo(true));
    const unsubSos = onValue(sosQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          setSosAlerts(Object.keys(data).map(id => ({ id, ...data[id] })));
        } else {
          setSosAlerts([]);
        }
      } else {
        setSosAlerts([]);
      }
    });

    return () => {
      if (typeof unsubSocios === 'function') unsubSocios();
      if (typeof unsubSos === 'function') unsubSos();
    };
  }, []);

  // --- LÓGICA DE SOPORTE SOS ---
  const resolverSOS = async (choferId) => {
    if (!isAdmin) return;
    try {
      await update(ref(db, `socios/choferes/${choferId}`), { needsSupport: false });
    } catch (err) {
      alert("Error al cerrar SOS: " + err.message);
    }
  };

  // --- RANKING DE CHOFERES ---
  const rankingChoferes = useMemo(() => {
    const list = Array.isArray(socios?.choferes) ? socios.choferes : [];
    return [...list].sort((a, b) => (parseFloat(b?.ratingTotal) || 0) - (parseFloat(a?.ratingTotal) || 0));
  }, [socios?.choferes]);

  // MEJORA: Lógica de Decisión con Loading State y Toasts nativos
  const handleDecision = async (id, type, decision) => {
    setIsUpdating(true);
    // Magia pura: type='taxi' + 's' = 'taxis', coincide exacto con Firebase
    const path = `socios/${type}s/${id}`;
    const updates = { status: decision };
    
    if (decision === 'rejected') {
      if (!motivoRechazo) {
        setIsUpdating(false);
        return alert("Por favor, escribe un motivo de rechazo.");
      }
      updates.mensajeRechazo = motivoRechazo;
    }

    try {
      await update(ref(db, path), updates);
      alert(`✅ ¡Operación Exitosa! El ${type} ha sido ${decision === 'approved' ? 'aprobado' : 'rechazado'}.`);
      cerrarModal();
    } catch (err) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const cerrarModal = () => {
    setModalData(null);
    setRotacion(0);
    setZoom(1);
    setMotivoRechazo('');
  };

  const renderSocioCard = (socio) => (
    <div key={socio?.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-2xl transition-all group animate-in fade-in">
      <div className="flex justify-between items-start mb-4">
        {/* MEJORA: Color e ícono dinámico para el Taxi */}
        <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${
          socio?.type === 'tienda' ? 'bg-blue-500/10 text-blue-400' : 
          socio?.type === 'chofer' ? 'bg-green-500/10 text-green-400' : 
          'bg-yellow-500/10 text-yellow-400'
        }`}>
          {socio?.type === 'tienda' ? <Store size={24} /> : socio?.type === 'chofer' ? <Truck size={24} /> : <CarFront size={24} />}
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border ${
              socio?.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
              socio?.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            }`}>
              {socio?.status || 'pending'}
            </span>
            {socio?.fcmToken && <BellRing size={12} className="text-blue-500 animate-pulse" />}
        </div>
      </div>
      <div className="space-y-1 mb-6">
        <h4 className="font-black text-white text-lg truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{socio?.nombre || socio?.nombreTienda}</h4>
        <p className="text-gray-400 text-xs truncate font-medium">{socio?.telefono || socio?.email}</p>
        
        {/* MEJORA: Visualización rápida de la placa para Taxis */}
        {socio?.type === 'taxi' && (
          <p className="text-[10px] text-gray-500 uppercase font-black mt-2 bg-gray-900 inline-block px-2 py-1 rounded-md">
            Placa: <span className="text-white">{socio?.placa || 'N/A'}</span>
          </p>
        )}
      </div>
      <button onClick={() => setModalData(socio)} className="w-full bg-gray-700 hover:bg-blue-600 text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg">
        <Eye size={16} /> REVISAR EXPEDIENTE
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      
      {/* 🚨 BARRA GLOBAL DE SOS */}
      {Array.isArray(sosAlerts) && sosAlerts.length > 0 && (
        <div className="sticky top-0 z-[120] animate-in slide-in-from-top duration-500">
          {sosAlerts.map(alert => (
            <div key={alert?.id} className="bg-red-600 border-b-4 border-red-800 p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between animate-pulse">
              <div className="flex items-center gap-4 text-white">
                <ShieldAlert size={32} className="animate-bounce" />
                <div>
                  <h3 className="font-black uppercase tracking-tighter text-lg">Emergencia SOS: Soporte Requerido</h3>
                  <p className="text-sm font-bold opacity-90">El chofer <span className="underline">{alert?.nombre}</span> reporta un incidente.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <a href={`tel:${alert?.telefono || ''}`} className="bg-white text-red-600 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:scale-105 transition-transform">
                  <Phone size={14}/> LLAMAR AHORA
                </a>
                <button className="bg-black text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:scale-105 transition-transform">
                  <MapPin size={14}/> VER GPS VIVO
                </button>
                <button onClick={() => resolverSOS(alert?.id)} className="bg-green-500 text-white px-6 py-2 rounded-xl font-black text-xs shadow-lg hover:bg-green-400 transition-colors">
                  RESOLVER
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-gray-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Gestión de Flota & Socios</h2>
          <p className="text-gray-400 font-medium">Auditoría legal, Taxis y Soporte en Vivo.</p>
        </div>
        <div className="flex bg-gray-800 p-1 rounded-2xl border border-gray-700">
          <button onClick={() => setFiltro('pending')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filtro === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>PENDIENTES</button>
          <button onClick={() => setFiltro('ranking')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filtro === 'ranking' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>RANKING</button>
          <button onClick={() => setFiltro('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filtro === 'all' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>TODOS</button>
        </div>
      </div>

      {filtro === 'ranking' ? (
        /* --- VISTA DE RANKING --- */
        <div className="bg-gray-800 border border-gray-700 rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-700">
                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Posición / Chofer</th>
                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Estatus</th>
                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Viajes Totales</th>
                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Rating</th>
                <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Perfil</th>
              </tr>
            </thead>
            <tbody>
              {(rankingChoferes || []).map((c, i) => (
                <tr key={c?.id || i} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-all group">
                  <td className="p-6 flex items-center gap-4">
                    <span className="text-xl font-black text-gray-700 group-hover:text-blue-500 transition-colors w-8">#{i + 1}</span>
                    <div>
                      <p className="font-black text-white uppercase text-sm">{c?.nombre || 'Sin Nombre'}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{(c?.id || '').slice(-8)}</p>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2">
                      <Circle size={8} className={`fill-current ${c?.isOnline ? 'text-green-500 animate-pulse' : 'text-gray-600'}`} />
                      <span className={`text-[10px] font-black uppercase ${c?.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                        {c?.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-center font-bold text-white">{c?.viajesTotales || 0}</td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span className="font-black text-white">{((parseFloat(c?.ratingTotal) || 0)).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={() => setModalData(c)} className="p-2 hover:bg-blue-600/20 rounded-lg text-gray-500 hover:text-blue-500 transition-all">
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* --- VISTA DE AUDITORÍA (TIENDAS, CHOFERES Y TAXIS) --- */
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6 text-blue-400">
              <Store size={20} />
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Aliados Comerciales</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(socios?.tiendas ?? []).filter(s => filtro === 'all' ? true : s?.status === 'pending').map(renderSocioCard)}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6 text-green-400">
              <Truck size={20} />
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Flota Delivery</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(socios?.choferes ?? []).filter(s => filtro === 'all' ? true : s?.status === 'pending').map(renderSocioCard)}
            </div>
          </section>

          {/* MEJORA: NUEVA SECCIÓN DE TAXIS UBER */}
          <section>
            <div className="flex items-center gap-3 mb-6 text-yellow-400">
              <CarFront size={20} />
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Línea de Taxis (Uber)</h3>
            </div>
            {(socios?.taxis ?? []).filter(s => filtro === 'all' ? true : s?.status === 'pending').length === 0 ? (
              <p className="text-gray-500 font-bold uppercase text-xs">No hay solicitudes de taxis pendientes.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(socios?.taxis ?? []).filter(s => filtro === 'all' ? true : s?.status === 'pending').map(renderSocioCard)}
              </div>
            )}
          </section>
        </div>
      )}

      {/* MODAL DE AUDITORÍA MULTIPROPÓSITO */}
      {modalData && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[130] p-4 animate-in fade-in duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] max-w-6xl w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl text-white shadow-xl ${modalData?.type === 'tienda' ? 'bg-blue-600' : modalData?.type === 'taxi' ? 'bg-yellow-500' : 'bg-green-600'}`}>
                      <ShieldCheck size={28}/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{modalData?.nombre || modalData?.nombreTienda}</h3>
                        <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">{modalData?.type} • {modalData?.email}</p>
                    </div>
                </div>
                <button onClick={cerrarModal} className="p-2 bg-gray-900 rounded-full text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel Izquierdo: Visor Fotográfico */}
                <div className="p-8 space-y-6 flex flex-col h-full">
                    <div className="flex justify-between items-center text-xs font-black text-blue-500 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Camera size={14}/> Evidencia Fotográfica</span>
                        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl">
                            <button onClick={() => setRotacion(r => r + 90)} className="p-2 text-gray-400 hover:text-white"><RotateCw size={18}/></button>
                            <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 text-gray-400 hover:text-white"><ZoomIn size={18}/></button>
                            <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 text-gray-400 hover:text-white"><ZoomOut size={18}/></button>
                        </div>
                    </div>
                    <div className="flex-1 bg-gray-900 rounded-3xl overflow-auto flex items-center justify-center border border-gray-700 shadow-inner relative">
                        <div className="transition-transform duration-300" style={{ transform: `rotate(${rotacion}deg) scale(${zoom})` }}>
                            {modalData?.type === 'tienda' && (
                                <div className="space-y-8 p-4"><img src={modalData?.rifUrl} alt="RIF" className="rounded-lg"/><img src={modalData?.fachadaUrl} alt="Fachada" className="rounded-lg"/></div>
                            )}
                            {modalData?.type === 'chofer' && (
                                <div className="space-y-8 p-4"><img src={modalData?.licenciaUrl} alt="Licencia" className="rounded-lg"/><img src={modalData?.cedulaUrl} alt="Cédula" className="rounded-lg"/></div>
                            )}
                            {/* MEJORA: Layout tipo grilla vertical para los 4 documentos del Taxi */}
                            {modalData?.type === 'taxi' && (
                                <div className="space-y-8 p-4 max-w-md text-center mx-auto">
                                  <div className="space-y-2"><p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Vehículo</p><img src={modalData?.fotoVehiculoUrl} alt="Vehículo" className="rounded-lg border border-gray-700 w-full shadow-lg"/></div>
                                  <div className="space-y-2"><p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Licencia</p><img src={modalData?.licenciaUrl} alt="Licencia" className="rounded-lg border border-gray-700 w-full shadow-lg"/></div>
                                  <div className="space-y-2"><p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Certificado Médico</p><img src={modalData?.certificadoMedicoUrl} alt="Certificado" className="rounded-lg border border-gray-700 w-full shadow-lg"/></div>
                                  <div className="space-y-2"><p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Antecedentes</p><img src={modalData?.antecedentesUrl} alt="Antecedentes" className="rounded-lg border border-gray-700 w-full shadow-lg"/></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Datos y Acciones */}
                <div className="p-8 bg-gray-900/30 flex flex-col justify-between border-l border-gray-700">
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-white font-black uppercase tracking-tighter mb-4">Detalles Técnicos</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700/50">
                                    <span className="text-gray-500 block text-[9px] font-black uppercase mb-1">Teléfono</span>
                                    <span className="text-white font-bold">{modalData?.telefono || 'N/A'}</span>
                                </div>
                                
                                {modalData?.type === 'tienda' && (
                                  <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700/50"><span className="text-gray-500 block text-[9px] font-black uppercase mb-1">Categoría</span><span className="text-white font-bold uppercase">{modalData?.categoria || 'N/A'}</span></div>
                                )}
                                {modalData?.type === 'chofer' && (
                                  <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700/50"><span className="text-gray-500 block text-[9px] font-black uppercase mb-1">Placa</span><span className="text-white font-bold uppercase">{modalData?.placa || 'N/A'}</span></div>
                                )}
                                
                                {/* MEJORA: Datos exclusivos y obligatorios del Taxi */}
                                {modalData?.type === 'taxi' && (
                                  <>
                                    <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700/50">
                                      <span className="text-gray-500 block text-[9px] font-black uppercase mb-1">Cédula</span>
                                      <span className="text-white font-bold uppercase">{modalData?.cedula || 'N/A'}</span>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700/50 col-span-2">
                                      <span className="text-gray-500 block text-[9px] font-black uppercase mb-1">Vehículo Verificado</span>
                                      <span className="text-white font-bold uppercase">{modalData?.marcaVehiculo} {modalData?.modeloVehiculo} ({modalData?.anioVehiculo})</span>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700/50 col-span-2">
                                      <span className="text-gray-500 block text-[9px] font-black uppercase mb-1">Placa Taxi</span>
                                      <span className="text-yellow-500 font-black text-xl uppercase tracking-widest">{modalData?.placa || 'N/A'}</span>
                                    </div>
                                  </>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-white font-black uppercase tracking-tighter flex items-center gap-2 text-red-500"><MessageSquare size={16}/> Veredicto</h4>
                            <textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Escribe el motivo si decides rechazar..." className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-5 text-sm text-white focus:border-red-500 outline-none h-32 transition-all resize-none shadow-inner"/>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button 
                          disabled={isUpdating}
                          onClick={() => handleDecision(modalData?.id, modalData?.type, 'rejected')} 
                          className="flex-1 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'PROCESANDO...' : <><X size={18} /> RECHAZAR</>}
                        </button>
                        <button 
                          disabled={isUpdating}
                          onClick={() => handleDecision(modalData?.id, modalData?.type, 'approved')} 
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-green-900/40 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'PROCESANDO...' : <><Check size={18} /> APROBAR</>}
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