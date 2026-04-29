import React, { useEffect, useState } from 'react';
import { db, storage } from '../firebase/config';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Trash2, Power, Image as ImageIcon, 
  MessageSquare, Layers, X, Check, Loader2, Megaphone
} from 'lucide-react';

export default function Publicidad() {
  const { currentUser } = useAuth();
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  // Estado del Formulario
  const [newAd, setNewAd] = useState({
    descripcion: '',
    whatsappNumber: '',
    foto: null,
    preview: null
  });

  const isAdmin = currentUser?.email === 'carlos.linares.es@gmail.com';

  useEffect(() => {
    const pubRef = ref(db, 'publicidad');
    const unsub = onValue(pubRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setAnuncios(Object.keys(data).map(id => ({ id, ...data[id] })));
      } else {
        setAnuncios([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAd({ ...newAd, foto: file, preview: URL.createObjectURL(file) });
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!newAd.foto || !newAd.descripcion || !newAd.whatsappNumber) return alert("Completa todos los campos.");
    setSubiendo(true);

    try {
      // 1. Subir imagen a Storage
      const name = `${Date.now()}_${newAd.foto.name}`;
      const imgRef = storageRef(storage, `publicidad/${name}`);
      await uploadBytes(imgRef, newAd.foto);
      const url = await getDownloadURL(imgRef);

      // 2. Guardar en Realtime Database
      const newAdRef = push(ref(db, 'publicidad'));
      await set(newAdRef, {
        imageUrl: url,
        descripcion: newAd.descripcion,
        whatsappNumber: newAd.whatsappNumber,
        isActive: true,
        timestamp: Date.now()
      });

      setIsModalOpen(false);
      setNewAd({ descripcion: '', whatsappNumber: '', foto: null, preview: null });
    } catch (err) {
      alert("Error al subir pauta: " + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const toggleAdStatus = async (id, currentStatus) => {
    await update(ref(db, `publicidad/${id}`), { isActive: !currentStatus });
  };

  const deleteAd = async (id) => {
    if (window.confirm("¿Eliminar esta pauta permanentemente?")) {
      await remove(ref(db, `publicidad/${id}`));
    }
  };

  const activosCount = anuncios.filter(a => a.isActive).length;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* HEADER & METRICAS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Gestor de Publicidad</h2>
          <p className="text-gray-400 font-medium">Anuncios dinámicos intercalados en la App Pana Voy.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 px-6 py-3 rounded-2xl text-center">
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Pautas Activas</p>
                <p className="text-2xl font-black text-white">{activosCount}</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-900/20 transition-all active:scale-95"
            >
                <Plus size={20}/> NUEVA PAUTA
            </button>
        </div>
      </div>

      {/* GRID DE ANUNCIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {anuncios.map((ad) => (
          <div key={ad.id} className={`bg-gray-800 border-2 rounded-[2.5rem] overflow-hidden transition-all flex flex-col ${ad.isActive ? 'border-blue-500/30' : 'border-gray-700 opacity-60'}`}>
            <div className="h-52 relative group">
              <img src={ad.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${ad.isActive ? 'bg-green-600 text-white' : 'bg-gray-900 text-gray-400'}`}>
                {ad.isActive ? 'En el Aire' : 'Pausado'}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <p className="text-white text-sm font-medium leading-relaxed italic">"{ad.descripcion}"</p>
                <div className="flex items-center gap-2 text-[11px] text-green-400 font-black">
                    <MessageSquare size={14}/> {ad.whatsappNumber}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-700/50">
                <button 
                    onClick={() => toggleAdStatus(ad.id, ad.isActive)}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all ${
                        ad.isActive ? 'bg-gray-900 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                >
                    <Power size={14}/> {ad.isActive ? 'PAUSAR' : 'ACTIVAR'}
                </button>
                <button 
                    onClick={() => deleteAd(ad.id)}
                    className="p-3 bg-gray-900 text-gray-500 hover:text-white hover:bg-red-600 rounded-xl transition-all"
                >
                    <Trash2 size={16}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CREACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] max-w-xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white"><Megaphone size={24}/></div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Programar Anuncio</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2"><X size={28}/></button>
            </div>

            <form onSubmit={handleCreateAd} className="p-8 space-y-6">
                <div className="group relative w-full h-48 bg-gray-900 border-2 border-dashed border-gray-700 rounded-3xl overflow-hidden flex flex-col items-center justify-center hover:border-blue-500/50 transition-all">
                    {newAd.preview ? (
                        <img src={newAd.preview} className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <ImageIcon size={40} className="text-gray-600 mb-2" />
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Formato Horizontal Sugerido<br/>(1080x600 px)</p>
                        </>
                    )}
                    <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-black uppercase ml-2">WhatsApp del Cliente (Link Directo)</label>
                        <input 
                            placeholder="Ej: +584241234567"
                            value={newAd.whatsappNumber}
                            onChange={e => setNewAd({...newAd, whatsappNumber: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Mensaje Persuasivo / Promo</label>
                        <textarea 
                            placeholder="Ej: ¡Solo por hoy! 2x1 en Pizzas si vienes de parte de Pana Voy..."
                            value={newAd.descripcion}
                            onChange={e => setNewAd({...newAd, descripcion: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-white focus:border-blue-500 outline-none h-24 transition-all"
                        />
                    </div>
                </div>

                <button 
                    disabled={subiendo}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                >
                    {subiendo ? <Loader2 className="animate-spin" /> : <Check size={20}/>}
                    {subiendo ? 'SUBIENDO A CLOUD STORAGE...' : 'LANZAR PUBLICIDAD'}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}