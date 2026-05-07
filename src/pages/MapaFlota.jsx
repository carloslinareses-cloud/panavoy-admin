import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import L from 'leaflet';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

const createDriverIcon = (status, bearing) => {
  let color = "#9ca3af"; // Offline
  let glow = "transparent";
  
  if (status === 'online_idle') {
      color = "#22c55e"; // Libre
      glow = "rgba(34, 197, 94, 0.4)";
  }
  if (status === 'online_busy') {
      color = "#ef4444"; // Ocupado
      glow = "rgba(239, 68, 68, 0.4)";
  }

  return L.divIcon({
    html: `
      <div style="transform: rotate(${bearing}deg); transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); filter: drop-shadow(0 0 5px ${glow});">
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>
    `,
    className: "custom-driver-icon",
    iconSize: [45, 45],
    iconAnchor: [22.5, 22.5],
  });
};

function AutoBounds({ drivers = [] }) {
  const map = useMap();
  useEffect(() => {
    if ((drivers?.length || 0) > 0) {
      const onlineDrivers = (drivers || []).filter(d => d.isOnline);
      const valid = onlineDrivers.filter(d => d.location?.lat && d.location?.lng);
      if (valid.length > 0) {
          const bounds = L.latLngBounds(valid.map(d => [d.location.lat, d.location.lng]));
          map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });
      }
    }
  }, [drivers, map]);
  return null;
}

export default function MapaFlota() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOnline, setFilterOnline] = useState(true);

  useEffect(() => {
    const driversRef = ref(db, 'socios/choferes');
    const unsub = onValue(driversRef, (snapshot) => {
      console.debug('[MapaFlota] drivers snapshot:', snapshot.exists() ? snapshot.val() : null);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const processed = Object.keys(data).map(id => {
          const driver = data[id];
          let status = 'offline';
          if (driver.isOnline) {
            status = driver.activeDelivery ? 'online_busy' : 'online_idle';
          }
          return { id, ...driver, currentStatus: status };
        }).filter(d => d.location?.lat && d.location?.lng);

        setDrivers(processed);
        setLoading(false);
      }
      else {
        setDrivers([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const timeSince = (date) => {
    if (!date) return "N/A";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `hace segundos`;
    const interval = Math.floor(seconds / 60);
    return `hace ${interval} min`;
  };

  const filteredDrivers = useMemo(() => 
    filterOnline ? (drivers || []).filter(d => d.isOnline) : (drivers || [])
  , [drivers, filterOnline]);

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-xl gap-4">
        <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400">
                <MapPin size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white">Radar de Flota</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Charallave en vivo</p>
            </div>
        </div>

        <div className="flex items-center gap-6 bg-gray-900/50 p-3 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFilterOnline(!filterOnline)}>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${filterOnline ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${filterOnline ? 'left-6' : 'left-1'}`}></div>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase">Solo Online</span>
          </div>
          <div className="h-8 w-px bg-gray-700"></div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[10px] text-green-400 font-black uppercase">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> LIBRE
            </div>
            <div className="flex items-center gap-2 text-[10px] text-red-400 font-black uppercase">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span> BUSY
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-3xl overflow-hidden border border-gray-700 shadow-2xl relative group">
        {loading ? (
          <div className="flex items-center justify-center h-[calc(100vh-250px)] w-full">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <div className="text-sm text-gray-400 font-black uppercase">Cargando flota...</div>
            </div>
          </div>
        ) : (
          <MapContainer 
            center={[10.2447, -66.8623]} 
            zoom={14} 
            zoomControl={false}
            style={{ height: 'calc(100vh - 250px)', width: '100%' }}
          >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />
          
          <AutoBounds drivers={filteredDrivers} />

          {filteredDrivers?.filter(d => d.location?.lat && d.location?.lng).map((d) => (
            <Marker 
              key={d.id} 
              position={[d.location.lat, d.location.lng]} 
              icon={createDriverIcon(d.currentStatus, d.location.bearing || 0)}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="p-3 bg-gray-800 text-white rounded-lg border border-gray-700 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
                    <div className={`w-2 h-2 rounded-full ${d.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <h4 className="font-black text-sm uppercase tracking-tight">{d.nombre}</h4>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-bold uppercase">Vehículo</span>
                        <span className="text-blue-400 font-black uppercase">{d.placa}</span>
                    </div>
                    <div className="flex justify-between bg-gray-900 p-1.5 rounded">
                        <span className="text-gray-500 font-bold uppercase">Update</span>
                        <span className="text-white font-mono">{timeSince(d.location?.timestamp)}</span>
                    </div>
                    {d.currentStatus === 'online_busy' && (
                        <div className="bg-red-500/20 text-red-400 p-1 rounded text-center font-black animate-pulse uppercase">
                            Entrega en curso
                        </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        )}

        {/* INDICADOR DE CONTEO FLOTANTE */}
        <div className="absolute bottom-6 left-6 z-[400] bg-gray-900/80 backdrop-blur border border-gray-700 px-4 py-2 rounded-2xl">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Visible</p>
            <p className="text-2xl font-black text-white">{filteredDrivers.length}</p>
        </div>
      </div>
    </div>
  );
}