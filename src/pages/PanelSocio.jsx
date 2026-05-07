import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import SubscriptionGuard from '../components/SubscriptionGuard';
import { LogOut, Store } from 'lucide-react';

export default function PanelSocio() {
  const { currentUser, logout } = useAuth();
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    // Escuchamos los datos reales del socio en la BD
    const socioRef = ref(db, `socios/tiendas/${currentUser.uid}`);
    const unsub = onValue(socioRef, (snapshot) => {
      if (snapshot.exists()) {
        setPartnerData({ id: currentUser.uid, ...snapshot.val() });
      } else {
        // MOCK TEMPORAL: Si haces login con otra cuenta de Google para probar,
        // forzamos el estado a "vencido" hace 4 días para que veas el Bloqueador en acción.
        setPartnerData({
          id: currentUser.uid,
          nombreTienda: currentUser.email,
          subscriptionStatus: 'vencido', 
          nextPaymentDate: Date.now() - (4 * 24 * 60 * 60 * 1000) 
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  if (loading) return <div className="p-8 text-center text-white">Cargando tu panel...</div>;

  // EL GUARDIÁN DE LA TAREA 1 EN ACCIÓN
  return (
    <SubscriptionGuard partnerData={partnerData} partnerType="tiendas">
      <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800 p-6 rounded-[2rem] border border-gray-700 shadow-xl mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#118C4F]/20 rounded-2xl text-[#118C4F]"><Store size={32}/></div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Mi Negocio</h1>
                <p className="text-gray-400 font-bold text-sm">{partnerData?.nombreTienda || currentUser.email}</p>
              </div>
            </div>
            <button onClick={logout} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-3 rounded-xl font-black transition-all w-full md:w-auto justify-center">
              <LogOut size={18}/> SALIR
            </button>
          </div>
          
          <div className="bg-gray-800 p-10 rounded-[2.5rem] border border-gray-700 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Bienvenido al Panel de Socios de Pana Voy</h2>
            <p className="text-gray-400 mt-2 font-medium">Si estás viendo esta pantalla, tu pago de quincena está solvente o te encuentras dentro de los 3 días de gracia.</p>
          </div>
          
        </div>
      </div>
    </SubscriptionGuard>
  );
}