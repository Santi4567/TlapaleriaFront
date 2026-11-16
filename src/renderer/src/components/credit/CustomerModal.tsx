// src/components/credit/CustomerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  CreateCustomerRequest,
  CustomerSummary,
  UpdateCustomerRequest,
} from '../../types/credit';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCustomerRequest | UpdateCustomerRequest) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  customerToEdit?: CustomerSummary | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  error,
  customerToEdit,
}) => {
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimitStr, setCreditLimitStr] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setAlias(customerToEdit.alias || '');
      setPhone(customerToEdit.phone || '');
      setSecondaryPhone(customerToEdit.secondaryPhone || '');
      setEmail(customerToEdit.email || '');
      setAddress(customerToEdit.address || '');
      setNotes(customerToEdit.notes || '');
      setCreditLimitStr(
        customerToEdit.creditLimit != null && customerToEdit.creditLimit > 0
          ? String(customerToEdit.creditLimit)
          : ''
      );
      setIsActive(customerToEdit.isActive);
    } else {
      setName('');
      setAlias('');
      setPhone('');
      setSecondaryPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setCreditLimitStr('');
      setIsActive(true);
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(creditLimitStr);

    const payload: UpdateCustomerRequest = {
      name: name.trim(),
      alias: alias.trim() || null,
      phone: phone.trim() || null,
      secondaryPhone: secondaryPhone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      creditLimit: !isNaN(limitNum) && limitNum > 0 ? limitNum : null,
      isActive,
    };

    await onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-2xl w-full bg-[#121212] rounded-3xl border border-gray-800 p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">
              Directorio de Clientes de Confianza
            </span>
            <h3 className="text-2xl font-black text-white mt-0.5">
              {customerToEdit ? 'Editar Información del Cliente' : 'Registrar Nuevo Cliente'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                <User className="w-3.5 h-3.5 text-brand-orange" /> Nombre Completo *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Maestro Roberto Sánchez"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Apodo / Oficio / Referencia
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Ej. Don Beto el Plomero / Obra Centro"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-brand-orange" /> Límite de Crédito Opcional ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={creditLimitStr}
                onChange={(e) => setCreditLimitStr(e.target.value)}
                placeholder="Vacío = Sin límite tope"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-orange" /> Teléfono Principal / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 222 123 4567"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-500" /> Teléfono Secundario / Recados
              </label>
              <input
                type="text"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                placeholder="Ej. Casa o familiar"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-orange" /> Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@correo.com"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-orange" /> Dirección / Domicilio u Obra
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Av. Independencia #104, Col. Centro"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-orange" /> Notas de Confianza / Referencias
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Cliente de hace 5 años, suele liquidar los sábados al terminar raya..."
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange resize-none"
              />
            </div>

            {customerToEdit && (
              <div className="sm:col-span-2 flex items-center justify-between bg-black/40 border border-gray-800 rounded-xl px-4 py-3">
                <div>
                  <span className="text-sm font-bold text-white block">Estado del Cliente</span>
                  <span className="text-xs text-gray-400">
                    Solo se puede desactivar si no tiene deuda pendiente.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-4 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {isActive ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(255,90,0,0.3)] cursor-pointer"
            >
              {isSubmitting
                ? 'Guardando...'
                : customerToEdit
                ? 'Guardar Cambios'
                : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
