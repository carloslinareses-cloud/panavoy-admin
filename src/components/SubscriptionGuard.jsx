import React, { useState, useMemo } from 'react';
import { db, storage } from '../firebase/config';
import { ref as dbRef, push, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AlertTriangle, UploadCloud, CheckCircle, Lock } from 'lucide-react';

// Función nativa para comprimir imágenes en el cliente (Client-Side)
const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
};

export default function SubscriptionGuard({ children, partnerData, partnerType }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Lógica de fechas y bloqueos
  const { isBlocked, showBanner, isPending } = useMemo(() => {
    if (!partnerData || !partnerData.nextPaymentDate) {
      return { isBlocked: false, showBanner: false, isPending: false };
    }

    const now = Date.now();
    const dueDate = partnerData.nextPaymentDate;
    const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 Días en Milisegundos
    
    const status = partnerData.subscriptionStatus;
    const isPastDue = now > dueDate;
    const isPastGrace = now > (dueDate + GRACE_PERIOD_MS);

    // Si ya reportó el pago, le permitimos operar mientras el Admin aprueba
    if (status === 'pending_approval') {
      return { isBlocked: false, showBanner: false, isPending: true };
    }

    return {
      isBlocked: isPastGrace && status !== 'active',
      showBanner: isPastDue && !isPastGrace && status !== 'active',
      isPending: false
    };
  }, [partnerData]);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (selected) {
      // Comprimimos inmediatamente al seleccionar
      const compressed = await compressImage(selected);
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    }
  };

  const handlePaymentSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    
    try {
      const uid = partnerData.id;
      const timestamp = Date.now();
      
      // 1. Subir al Storage
      const imgRef = storageRef(storage, `comprobantes_plataforma/${uid}/${timestamp}.jpg`);
      await uploadBytes(imgRef, file);
      const url = await getDownloadURL(imgRef);

      // 2. Registrar en pagos_plataforma
      await push(dbRef(db, 'pagos_plataforma'), {
        uid,
        tipoSocio: partnerType, // 'tiendas', 'choferes' o 'taxis'
        monto: 15,
        comprobanteUrl: url,
        status: 'pending',
        timestamp
      });

      // 3. Actualizar status del socio para desbloquearlo temporalmente
      await update(dbRef(db, `socios/${partnerType}/${uid}`), {
        subscriptionStatus: 'pending_approval'
      });

    } catch (error) {
      console.error("Error al procesar el pago:", error);
      alert("Hubo un error al enviar el comprobante. Intente de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  // Renderizado Condicional del Bloqueo (Glassmorphism aplicado)
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Acento decorativo */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[#118C4F]"></div>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Quincena Vencida</h2>
            <p className="text-gray-400 mt-2 text-sm font-medium">Su prórroga de 3 días terminó. Reporte su pago de $15 para reactivar sus operaciones.</p>
          </div>

          <div className="space-y-6">
            {!preview ? (
              <label className="border-2 border-dashed border-gray-600 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#118C4F] hover:bg-[#118C4F]/5 transition-all group">
                <UploadCloud size={40} className="text-gray-500 group-hover:text-[#118C4F] mb-3 transition-colors" />
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Subir Capture de Pago Móvil</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-gray-600">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                <button 
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-lg backdrop-blur-md hover:bg-red-500 transition-colors"
                >
                  Cambiar
                </button>
              </div>
            )}

            <button 
              onClick={handlePaymentSubmit}
              disabled={!file || isUploading}
              className="w-full bg-[#118C4F] hover:bg-[#0e7642] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg shadow-[#118C4F]/20 transition-all flex items-center justify-center gap-2"
            >
              {isUploading ? 'PROCESANDO...' : 'ENVIAR REPORTE'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado Normal (Con o sin Banner)
  return (
    <>
      {showBanner && (
        <div className="bg-[#FFFFCA28] text-yellow-900 px-4 py-3 flex items-center justify-center gap-3 sticky top-0 z-50 shadow-md">
          <AlertTriangle size={20} className="animate-pulse" />
          <p className="text-sm font-black uppercase tracking-wide">
            ⚠️ Recuerda reportar tu pago de quincena. Tienes menos de 3 días de prórroga.
          </p>
        </div>
      )}
      
      {isPending && (
        <div className="bg-[#118C4F] text-white px-4 py-2 flex items-center justify-center gap-3 sticky top-0 z-50 shadow-md">
          <CheckCircle size={18} />
          <p className="text-xs font-bold uppercase tracking-widest">
            Pago en revisión. Operaciones habilitadas temporalmente.
          </p>
        </div>
      )}

      {/* Aquí se inyecta tu Panel / Dashboard */}
      {children}
    </>
  );
}