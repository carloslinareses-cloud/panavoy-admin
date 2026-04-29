import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { ref, onValue, set } from 'firebase/database';
import { DollarSign, Percent, RefreshCw, Save } from 'lucide-react';

export default function Config() {
  const [config, setConfig] = useState({ tasa_bcv: 0, comision: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onValue(ref(db, 'config'), (snapshot) => {
      if (snapshot.exists()) setConfig(snapshot.val());
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await set(ref(db, 'config'), config);
      alert("Configuración guardada en Charallave con éxito.");
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold">Economía del Negocio</h2>

      <div className="grid gap-6">
        {/* TASA BCV */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-4 text-yellow-500">
            <DollarSign size={24} />
            <h3 className="text-xl font-semibold text-white">Tasa BCV</h3>
          </div>
          <div className="flex gap-4">
            <input 
              type="number" 
              value={config.tasa_bcv}
              onChange={(e) => setConfig({...config, tasa_bcv: parseFloat(e.target.value)})}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-2xl font-bold text-center"
            />
            <button className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors">
              <RefreshCw size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">* Esta tasa se usa para mostrar el equivalente en Bs a los clientes.</p>
        </div>

        {/* COMISIONES */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-4 text-blue-500">
            <Percent size={24} />
            <h3 className="text-xl font-semibold text-white">Comisión por Pedido</h3>
          </div>
          <div className="relative">
            <input 
              type="number" 
              value={config.comision}
              onChange={(e) => setConfig({...config, comision: parseFloat(e.target.value)})}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-2xl font-bold text-center"
            />
            <span className="absolute right-4 top-3.5 text-gray-500 text-xl">%</span>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
        >
          <Save size={20} /> {loading ? 'Guardando...' : 'Guardar Cambios Globales'}
        </button>
      </div>
    </div>
  );
}