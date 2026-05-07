import React, { useState } from 'react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/config';
import { ref as dbRef, push } from 'firebase/database';
import { Banknote, Image, UploadCloud } from 'lucide-react';

const BANCOS = [
  'Banesco', 'Provincial', 'Mercantil', 'Venezuela', 'BOD', 'Caribe', 'BFC', '100% Banco', 'Bancaribe', 'Banco Plaza',
  'BNC', 'Banplus', 'Banesco International', 'BBVA', 'Banco del Tesoro', 'Banco de Venezuela', 'Banco Exterior', 'Mi Banco', 'Banco Activo', 'Banco Sofitasa',
  'Otras'
];

const OPERADORAS = ['0414','0424','0412','0416','0426','0500'];

export default function FormularioPagoMovil({ defaultStoreId = '', onSuccess = () => {} }) {
  const storage = getStorage();
  const [form, setForm] = useState({ banco: BANCOS[0], operadora: OPERADORAS[0], telefono: '', tipoDoc: 'V', documento: '', choferId: '', monto: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleFile = (e) => setFile(e.target.files?.[0] || null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.choferId || !form.monto) return alert('Completa Chofer y Monto');
    setSubmitting(true);
    try {
      let url = '';
      if (file) {
        const path = `pagos_choferes/${Date.now()}_${file.name}`;
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, file);
        url = await getDownloadURL(sRef);
      }

      const payload = {
        storeId: defaultStoreId || 'unknown_store',
        choferId: form.choferId,
        monto: parseFloat(form.monto) || 0,
        banco: form.banco,
        operadora: form.operadora,
        telefono: form.telefono,
        tipoDoc: form.tipoDoc,
        documento: form.documento,
        comprobanteUrl: url || null,
        status: 'pending_confirmation',
        timestamp: Date.now()
      };

      await push(dbRef(db, 'pagos_choferes'), payload);
      onSuccess(payload);
      setForm({ banco: BANCOS[0], operadora: OPERADORAS[0], telefono: '', tipoDoc: 'V', documento: '', choferId: '', monto: '' });
      setFile(null);
      alert('Comprobante subido y registro creado.');
    } catch (err) {
      console.error('FormularioPagoMovil submit error', err);
      alert('Error al enviar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5 glass" style={{ backdropFilter: 'blur(6px)' }}>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 text-xs text-gray-400 font-black">Banco</label>
        <select value={form.banco} onChange={handleChange('banco')} className="col-span-2 p-3 rounded-xl bg-gray-900 border border-gray-700 text-white">
          {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <label className="text-xs text-gray-400 font-black">Operadora</label>
        <select value={form.operadora} onChange={handleChange('operadora')} className="p-3 rounded-xl bg-gray-900 border border-gray-700 text-white">
          {OPERADORAS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        <label className="text-xs text-gray-400 font-black">Teléfono</label>
        <input value={form.telefono} onChange={handleChange('telefono')} className="p-3 rounded-xl bg-gray-900 border border-gray-700 text-white" />

        <label className="text-xs text-gray-400 font-black">Tipo Doc</label>
        <select value={form.tipoDoc} onChange={handleChange('tipoDoc')} className="p-3 rounded-xl bg-gray-900 border border-gray-700 text-white">
          <option value="V">V</option>
          <option value="E">E</option>
          <option value="J">J</option>
          <option value="P">P</option>
        </select>

        <label className="text-xs text-gray-400 font-black">Cédula</label>
        <input value={form.documento} onChange={handleChange('documento')} className="p-3 rounded-xl bg-gray-900 border border-gray-700 text-white" />

        <label className="text-xs text-gray-400 font-black">Chofer ID</label>
        <input value={form.choferId} onChange={handleChange('choferId')} className="p-3 rounded-xl bg-gray-900 border border-gray-700 text-white" placeholder="uid del chofer" />

        <label className="text-xs text-gray-400 font-black">Monto</label>
        <input value={form.monto} onChange={handleChange('monto')} className="p-3 rounded-xl bg-gray-900 border border-gray-700 text-white" placeholder="0.00" type="number" step="0.01" />
      </div>

      <div>
        <label className="text-xs text-gray-400 font-black mb-2 block">Comprobante (opcional)</label>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={handleFile} />
          {file && <span className="text-sm text-gray-300">{file.name}</span>}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="bg-[#118C4F] px-6 py-3 rounded-xl font-black text-white disabled:opacity-50">
          {submitting ? 'Enviando...' : 'Subir y Registrar'}
        </button>
      </div>
    </form>
  );
}
