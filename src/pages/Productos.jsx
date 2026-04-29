import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase/config';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { 
  Package, Search, Filter, Edit3, Power, 
  Pill, Clock, AlertTriangle, Factory, 
  CheckCircle2, XCircle, ChevronRight, Save
} from 'lucide-react';

export default function Productos() {
  const { currentUser } = useAuth();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  
  // Estados de Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroStock, setFiltroStock] = useState('todos'); // 'todos', 'bajo'
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroMarca, setFiltroMarca] = useState('');

  const isAdmin = currentUser?.email === 'carlos.linares.es@gmail.com';

  useEffect(() => {
    const productosRef = ref(db, 'productos');
    const unsub = onValue(productosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const listaAplanada = [];
        
        Object.keys(data).forEach(storeId => {
          Object.keys(data[storeId]).forEach(prodId => {
            listaAplanada.push({ 
              id: prodId, 
              storeId, 
              ...data[storeId][prodId] 
            });
          });
        });
        setProductos(listaAplanada);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // LÓGICA DE FILTRADO AVANZADO
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchNombre = p.nombre?.toLowerCase().includes(busqueda.toLowerCase());
      const matchMarca = p.marca?.toLowerCase().includes(filtroMarca.toLowerCase());
      const matchCat = filtroCategoria === 'todas' || p.categoriaTienda === filtroCategoria;
      const matchStock = filtroStock === 'bajo' ? (p.stock < 5) : true;
      
      return matchNombre && matchMarca && matchCat && matchStock;
    });
  }, [productos, busqueda, filtroMarca, filtroCategoria, filtroStock]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Acceso denegado.");

    const path = `productos/${editModal.storeId}/${editModal.id}`;
    try {
      await update(ref(db, path), editModal);
      setEditModal(null);
    } catch (err) {
      alert("Error al actualizar: " + err.message);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* HEADER & RESUMEN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Gestión de Inventario</h2>
          <p className="text-gray-400 font-medium">Control global de productos, stocks y normativas legales.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl">
            <p className="text-[10px] text-red-500 font-black uppercase">Críticos (Sin Stock)</p>
            <p className="text-2xl font-black text-white">{productos.filter(p => p.stock <= 0).length}</p>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS AVANZADA */}
      <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 p-6 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" placeholder="Producto..." 
            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-12 text-sm text-white focus:border-blue-500 outline-none"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" placeholder="Marca (Farmatodo, Nestlé...)" 
            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-12 text-sm text-white focus:border-blue-500 outline-none"
            onChange={(e) => setFiltroMarca(e.target.value)}
          />
        </div>

        <select 
          onChange={(e) => setFiltroStock(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="todos">Todos los niveles de Stock</option>
          <option value="bajo">⚠️ Bajo Stock (Menos de 5)</option>
        </select>

        <select 
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="todas">Todas las Categorías</option>
          <option value="Farmacia">Farmacias</option>
          <option value="Restaurante">Restaurantes</option>
          <option value="Supermercado">Supermercados</option>
        </select>
      </div>

      {/* GRILLA DE PRODUCTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {productosFiltrados.map((p) => (
          <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-[2rem] overflow-hidden hover:border-blue-500/50 transition-all flex flex-col group">
            {/* Imagen y Badges */}
            <div className="h-44 bg-gray-900 relative">
              <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {p.stock < 5 && (
                  <span className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                    <AlertTriangle size={10}/> BAJO STOCK
                  </span>
                )}
                {p.categoriaTienda === 'Farmacia' && p.requiereRecipe && (
                  <span className="bg-orange-600 text-white text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                    <Pill size={10}/> RÉCIPE OBLIGATORIO
                  </span>
                )}
              </div>
            </div>

            {/* Contenido Condicional */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-white font-black text-lg uppercase tracking-tight leading-tight">{p.nombre}</h4>
                  <span className="text-2xl font-black text-blue-400">${parseFloat(p.precio).toFixed(2)}</span>
                </div>
                <p className="text-gray-500 text-[10px] font-bold uppercase mt-1 tracking-widest">{p.marca || 'Sin Marca'} • {p.categoria}</p>
              </div>

              {/* Detalle Específico según Categoría */}
              <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/30">
                {p.categoriaTienda === 'Restaurante' ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-bold">PREPARACIÓN:</span>
                    <span className="text-green-400 font-black flex items-center gap-1">
                      <Clock size={12}/> {p.tiempoPrep || '15-20'} MIN
                    </span>
                  </div>
                ) : p.categoriaTienda === 'Farmacia' ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-bold">VENTA:</span>
                    <span className={`font-black ${p.requiereRecipe ? 'text-red-500' : 'text-blue-400'}`}>
                      {p.requiereRecipe ? 'CON RÉCIPE' : 'VENTA LIBRE'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-bold">DISPONIBILIDAD:</span>
                    <span className="text-white font-black uppercase">{p.stock} UNIDADES</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setEditModal(p)}
                className="w-full py-3 bg-gray-700 hover:bg-blue-600 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={14}/> EDITAR PRODUCTO
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EDITOR GLOBAL */}
      {editModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/20"><Edit3 size={24}/></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase">Editor Global</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase">Tienda ID: {editModal.storeId}</p>
                </div>
              </div>
              <button onClick={() => setEditModal(null)} className="text-gray-500 hover:text-white"><XCircle size={32}/></button>
            </div>

            <form onSubmit={handleUpdate} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase">Nombre del Producto</label>
                  <input 
                    value={editModal.nombre} 
                    onChange={(e) => setEditModal({...editModal, nombre: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase">Precio ($)</label>
                  <input 
                    type="number" step="0.01"
                    value={editModal.precio} 
                    onChange={(e) => setEditModal({...editModal, precio: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase">Marca / Fabricante</label>
                  <input 
                    value={editModal.marca || ''} 
                    onChange={(e) => setEditModal({...editModal, marca: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase">Stock Actual</label>
                  <input 
                    type="number"
                    value={editModal.stock} 
                    onChange={(e) => setEditModal({...editModal, stock: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* CAMPOS DINÁMICOS EN EL EDITOR */}
              {editModal.categoriaTienda === 'Farmacia' && (
                <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pill className="text-orange-500" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">¿Requiere Récipe Médico?</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditModal({...editModal, requiereRecipe: !editModal.requiereRecipe})}
                    className={`w-12 h-6 rounded-full transition-all relative ${editModal.requiereRecipe ? 'bg-orange-600' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editModal.requiereRecipe ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              )}

              {editModal.categoriaTienda === 'Restaurante' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase">Tiempo de Preparación (Minutos)</label>
                  <input 
                    type="number"
                    value={editModal.tiempoPrep || ''} 
                    onChange={(e) => setEditModal({...editModal, tiempoPrep: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                    placeholder="Ej: 20"
                  />
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20}/> GUARDAR CAMBIOS GLOBALES
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}