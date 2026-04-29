import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase/config';
import { ref, onValue, update } from 'firebase/database'; // Importamos update
import { 
  Search, User, MapPin, Calendar, Filter, X, 
  Map as MapIcon, ChevronRight, Phone, Mail, 
  Home, Info, CircleUser, Edit, Save, MapPinned 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('Todos');
  const [filtroSector, setFiltroSector] = useState('Todos');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [editandoCliente, setEditandoCliente] = useState(null); // Nuevo estado para edición
  const [loading, setLoading] = useState(true);

  // Verificación de Admin (Punto Crítico de Seguridad)
  // Nota: Asegúrate de tener acceso al correo del usuario logueado aquí. 
  // Ejemplo usando un valor quemado por ahora basado en tu instrucción:
  const adminEmail = 'carlos.linares.es@gmail.com'; 
  const esAdmin = true; // Aquí deberías validar contra tu AuthContext: currentUser?.email === adminEmail

  useEffect(() => {
    const unsub = onValue(ref(db, 'clientes'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setClientes(Object.keys(data).map(id => ({ id, ...data[id] })));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Lógica de Guardado Maestro
  const handleGuardarCambios = async () => {
    if (!esAdmin) return alert("Acción no autorizada");
    
    try {
      const { id, ...datos } = editandoCliente;
      const updates = {};
      updates[`/clientes/${id}`] = datos;
      
      await update(ref(db), updates);
      setEditandoCliente(null);
      // Aquí podrías disparar una notificación de éxito
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error al sincronizar con Firebase");
    }
  };

  // Lógica de Segmentación (Mantenida)
  const statsEdad = useMemo(() => {
    const rangos = { '18-25': 0, '26-35': 0, '36-50': 0, '50+': 0 };
    clientes.forEach(c => {
      if (c.fechaNacimiento) {
        const hoy = new Date();
        const cumple = new Date(c.fechaNacimiento);
        let edad = hoy.getFullYear() - cumple.getFullYear();
        if (edad <= 25) rangos['18-25']++;
        else if (edad <= 35) rangos['26-35']++;
        else if (edad <= 50) rangos['36-50']++;
        else rangos['50+']++;
      }
    });
    return Object.keys(rangos).map(key => ({ name: key, value: rangos[key] }));
  }, [clientes]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const sectoresDisponibles = useMemo(() => {
    const s = new Set(clientes.map(c => c.direccionDetallada?.sector).filter(Boolean));
    return ['Todos', ...Array.from(s)];
  }, [clientes]);

  const filtrados = clientes.filter(c => {
    const searchLow = busqueda.toLowerCase();
    const matchesBusqueda = 
        c.nombre?.toLowerCase().includes(searchLow) || 
        c.telefono?.includes(busqueda) || 
        c.direccionDetallada?.sector?.toLowerCase().includes(searchLow);
    const matchesGenero = filtroGenero === 'Todos' || c.genero === filtroGenero;
    const matchesSector = filtroSector === 'Todos' || c.direccionDetallada?.sector === filtroSector;
    return matchesBusqueda && matchesGenero && matchesSector;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER & ANALYTICS (Mantenido) */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
        <div className="flex-1">
          <h2 className="text-4xl font-black text-white tracking-tight">Gestión de Clientes</h2>
          <p className="text-gray-400 font-medium">Análisis demográfico y geográfico de Charallave</p>
          <div className="flex gap-4 mt-6">
            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-2xl min-w-[140px]">
                <p className="text-[10px] text-gray-500 font-black uppercase">Total</p>
                <p className="text-2xl font-black text-white">{clientes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 w-full xl:w-96 h-60 shadow-xl">
          <p className="text-[11px] font-black uppercase text-gray-400 mb-4 flex items-center gap-2">
            <CircleUser size={14} className="text-blue-500"/> Segmentación por Edad
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statsEdad} innerRadius={50} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                {statsEdad.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }} />
              <Legend verticalAlign="middle" align="right" layout="vertical" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FILTROS (Mantenido) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-800/80 backdrop-blur p-4 rounded-2xl border border-gray-700 sticky top-4 z-30 shadow-lg">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input 
            type="text" placeholder="Buscar por nombre, tlf o sector..." 
            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-blue-500 outline-none text-white"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select className="bg-gray-900 border border-gray-700 rounded-xl py-2 px-3 text-sm text-white" onChange={(e) => setFiltroGenero(e.target.value)}>
          <option value="Todos">Todos los Géneros</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>
        <select className="bg-gray-900 border border-gray-700 rounded-xl py-2 px-3 text-sm text-white" onChange={(e) => setFiltroSector(e.target.value)}>
          {sectoresDisponibles.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Todos los Sectores' : s}</option>)}
        </select>
      </div>

      {/* TABLA CON ACCIONES */}
      <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-white">
          <thead className="bg-gray-900/50 text-[11px] text-gray-500 font-black uppercase border-b border-gray-700 tracking-wider">
            <tr>
              <th className="p-5 text-center">Perfil</th>
              <th className="p-5">Nombre / ID</th>
              <th className="p-5">Ubicación (Sector)</th>
              <th className="p-5">Contacto</th>
              <th className="p-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {filtrados.map(c => (
              <tr key={c.id} className="hover:bg-blue-500/5 transition-all group">
                <td className="p-5 text-center" onClick={() => setClienteSeleccionado(c)}>
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <User size={24} />
                  </div>
                </td>
                <td className="p-5" onClick={() => setClienteSeleccionado(c)}>
                  <span className="font-black block">{c.nombre || 'Anonimo'}</span>
                  <span className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{c.id.slice(0,18)}...</span>
                </td>
                <td className="p-5" onClick={() => setClienteSeleccionado(c)}>
                    <div className="flex items-center gap-2 text-sm font-bold capitalize">
                        <MapPin size={14} className="text-red-500/50" />
                        {c.direccionDetallada?.sector || 'Sin sector'}
                    </div>
                </td>
                <td className="p-5" onClick={() => setClienteSeleccionado(c)}>
                  <span className="text-sm font-black block">{c.telefono}</span>
                  <span className="text-[10px] text-gray-500 font-black px-2 py-0.5 bg-gray-900 rounded-lg">{c.genero || 'N/A'}</span>
                </td>
                <td className="p-5 text-center">
                  <div className="flex gap-2 justify-center">
                    <button 
                      onClick={() => setEditandoCliente({ ...c })}
                      className="p-2 bg-gray-900 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-lg"
                      title="Editar Datos"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => setClienteSeleccionado(c)}
                      className="p-2 bg-gray-900 text-gray-400 hover:bg-white hover:text-gray-900 rounded-xl transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN MAESTRA */}
      {editandoCliente && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[150] p-4 animate-in zoom-in duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] max-w-2xl w-full overflow-hidden shadow-2xl border-t-blue-500 border-t-4">
            <div className="p-8 border-b border-gray-700 flex justify-between items-center bg-gray-900/40">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400"><Edit size={24}/></div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Modo Editor Admin</h3>
              </div>
              <button onClick={() => setEditandoCliente(null)} className="text-gray-500 hover:text-white p-2"><X size={24}/></button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Bloque: Información Personal */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-2"><User size={12}/> Información Personal</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold ml-2">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={editandoCliente.nombre || ''} 
                      onChange={(e) => setEditandoCliente({...editandoCliente, nombre: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold ml-2">Género</label>
                    <select 
                      value={editandoCliente.genero || ''} 
                      onChange={(e) => setEditandoCliente({...editandoCliente, genero: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold ml-2">Cumpleaños</label>
                    <input 
                      type="date" 
                      value={editandoCliente.fechaNacimiento || ''} 
                      onChange={(e) => setEditandoCliente({...editandoCliente, fechaNacimiento: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold ml-2">Teléfono de Contacto</label>
                    <input 
                      type="text" 
                      value={editandoCliente.telefono || ''} 
                      onChange={(e) => setEditandoCliente({...editandoCliente, telefono: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque: Logística de Entrega */}
              <div className="space-y-4 pt-4 border-t border-gray-700/50">
                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-2"><MapPinned size={12}/> Hub de Entrega (Charallave)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold ml-2">Sector</label>
                    <input 
                      type="text" 
                      value={editandoCliente.direccionDetallada?.sector || ''} 
                      onChange={(e) => setEditandoCliente({...editandoCliente, direccionDetallada: {...editandoCliente.direccionDetallada, sector: e.target.value}})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold ml-2">Calle / Avenida</label>
                    <input 
                      type="text" 
                      value={editandoCliente.direccionDetallada?.calle || ''} 
                      onChange={(e) => setEditandoCliente({...editandoCliente, direccionDetallada: {...editandoCliente.direccionDetallada, calle: e.target.value}})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold ml-2">Nro de Casa</label>
                    <input 
                      type="text" 
                      value={editandoCliente.direccionDetallada?.casa || ''} 
                      onChange={(e) => setEditandoCliente({...editandoCliente, direccionDetallada: {...editandoCliente.direccionDetallada, casa: e.target.value}})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold ml-2">Punto de Referencia</label>
                    <input 
                      type="text" 
                      value={editandoCliente.direccionDetallada?.referencia || ''} 
                      onChange={(e) => setEditandoCliente({...editandoCliente, direccionDetallada: {...editandoCliente.direccionDetallada, referencia: e.target.value}})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-900/40 border-t border-gray-700">
              <button 
                onClick={handleGuardarCambios}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm active:scale-95"
              >
                <Save size={20}/> Guardar Cambios en Firebase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLADO VISTA (Mantenido) */}
      {clienteSeleccionado && !editandoCliente && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in zoom-in duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl relative border-t-blue-500 border-t-4">
            <button onClick={() => setClienteSeleccionado(null)} className="absolute top-6 right-6 z-[110] bg-gray-900 text-gray-400 hover:text-white p-3 rounded-full transition-all border border-gray-700">
              <X size={20} />
            </button>

            {/* INFORMACIÓN IZQUIERDA */}
            <div className="p-10 space-y-8 overflow-y-auto max-h-[85vh]">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-900/40 border-4 border-gray-800">
                  <User size={40} className="text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white leading-none">{clienteSeleccionado.nombre}</h3>
                  <p className="text-blue-500 text-sm font-bold mt-2 uppercase tracking-widest">{clienteSeleccionado.genero || 'Usuario'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-900/50 p-5 rounded-3xl border border-gray-700/50 flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl"><Phone className="text-blue-500" size={20}/></div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-black">Teléfono</p>
                    <p className="text-white font-bold">{clienteSeleccionado.telefono}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-gray-700/50 space-y-4 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-blue-400 font-black tracking-tighter flex items-center gap-2"><Home size={14}/> Domicilio Registrado</p>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div><span className="text-gray-500 block text-[10px] font-black uppercase">Sector</span> <span className="text-white font-bold text-sm">{clienteSeleccionado.direccionDetallada?.sector || 'S/D'}</span></div>
                  <div><span className="text-gray-500 block text-[10px] font-black uppercase">Calle</span> <span className="text-white font-bold text-sm">{clienteSeleccionado.direccionDetallada?.calle || 'S/D'}</span></div>
                </div>
              </div>

              <button 
                onClick={() => { setEditandoCliente({...clienteSeleccionado}); setClienteSeleccionado(null); }}
                className="w-full bg-gray-900 hover:bg-blue-600 text-white font-black py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs border border-gray-700"
              >
                <Edit size={14}/> EDITAR PERFIL COMPLETO
              </button>
            </div>

            {/* MAPA DERECHA (Mantenido) */}
            <div className="h-full min-h-[400px] md:min-h-full relative border-l border-gray-700">
                {clienteSeleccionado.coordenadas ? (
                    <MapContainer center={[clienteSeleccionado.coordenadas.lat, clienteSeleccionado.coordenadas.lng]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <Marker position={[clienteSeleccionado.coordenadas.lat, clienteSeleccionado.coordenadas.lng]} />
                    </MapContainer>
                ) : (
                    <div className="h-full bg-gray-900 flex flex-col items-center justify-center p-12 text-center text-gray-600 font-bold uppercase text-[10px]">Coordenadas no vinculadas</div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}