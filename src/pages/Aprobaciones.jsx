import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { ref, onValue, update, query, orderByChild, equalTo } from 'firebase/database';
import { ShieldCheck, X, Eye } from 'lucide-react';

export default function Aprobaciones() {
  const [items, setItems] = useState([]); // { id, type, data }
  const [loadingIds, setLoadingIds] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tiendasQ = query(ref(db, 'socios/tiendas'), orderByChild('status'), equalTo('pending'));
    const choferesQ = query(ref(db, 'socios/choferes'), orderByChild('status'), equalTo('pending'));
    const taxisQ = query(ref(db, 'socios/taxis'), orderByChild('status'), equalTo('pending'));

    const handleSnapshot = (type) => (snapshot) => {
      console.debug('[Aprobaciones]', type, 'snapshot:', snapshot.exists() ? snapshot.val() : null);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(id => ({ id, type, data: data[id] }));
        setItems(prev => {
          // merge: remove previous of same type, append updated
          const others = prev.filter(it => it.type !== type);
          return [...others, ...list];
        });
      } else {
        // remove items of this type
        setItems(prev => prev.filter(it => it.type !== type));
      }
      setLoading(false);
    };

    const unsubTiendas = onValue(tiendasQ, handleSnapshot('tienda'));
    const unsubChoferes = onValue(choferesQ, handleSnapshot('chofer'));
    const unsubTaxis = onValue(taxisQ, handleSnapshot('taxi'));

    return () => {
      if (typeof unsubTiendas === 'function') unsubTiendas();
      if (typeof unsubChoferes === 'function') unsubChoferes();
      if (typeof unsubTaxis === 'function') unsubTaxis();
    };
  }, []);

  const setIdLoading = (id, v) => setLoadingIds(s => ({ ...s, [id]: v }));

  const handleDecision = async (id, type, decision) => {
    setIdLoading(id, true);
    try {
      const path = `socios/${type}s/${id}`;
      const status = decision === 'approve' ? 'active' : 'rejected';
      await update(ref(db, path), { status });
    } catch (err) {
      console.error('Aprobaciones: decision error', err);
      alert('Error al procesar la decisión: ' + err.message);
    } finally {
      setIdLoading(id, false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase">Bandeja de Aprobaciones</h2>
          <p className="text-gray-400 text-sm">Revisa y aprueba socios pendientes (tiendas, choferes, taxis).</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <p className="text-gray-500 col-span-full">No hay socios pendientes.</p>
          ) : (
            items.map(it => (
              <div key={`${it.type}-${it.id}`} className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-gray-900">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-black uppercase tracking-tight">{it.data?.nombre || it.data?.nombreTienda || 'Sin Nombre'}</h3>
                        <p className="text-xs text-gray-400">{it.type.toUpperCase()} • {it.id}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{it.data?.email || it.data?.telefono || ''}</div>
                  </div>

                  <p className="text-gray-400 text-sm mb-3">{it.data?.descripcion || it.data?.categoria || ''}</p>
                </div>

                <div className="flex gap-3 mt-4">
                  <button disabled={!!loadingIds[it.id]} onClick={() => handleDecision(it.id, it.type, 'reject')} className="flex-1 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white py-3 rounded-xl font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loadingIds[it.id] ? 'Procesando...' : <><X size={16}/> Rechazar</>}
                  </button>
                  <button disabled={!!loadingIds[it.id]} onClick={() => handleDecision(it.id, it.type, 'approve')} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-black shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {loadingIds[it.id] ? 'Procesando...' : <><ShieldCheck size={16}/> Aprobar</>}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
