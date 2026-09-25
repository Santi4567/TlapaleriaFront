import React, { useState, useEffect } from 'react';
import InputField from '../InputField';
import StatusAlert from '../StatusAlert';
import CustomDatePicker from '../CustomDatePicker';
import { CreateAccountPayableDto } from '../../types/expense';
import { expenseService } from '../../services/expenseService';
// Asumiendo que tienes un servicio de proveedores basado en tu arquitectura
// import { supplierService } from '../../services/supplierService';

interface AccountPayableCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AccountPayableCreateModal: React.FC<AccountPayableCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  // Estados principales
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [concept, setConcept] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  
  // Estados para el flujo de plazos
  const [isInstallmentPlan, setIsInstallmentPlan] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [paymentFrequencyDays, setPaymentFrequencyDays] = useState('');

  // Estados auxiliares
  const [suppliers, setSuppliers] = useState<{id: number, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Simular carga de proveedores al abrir el modal (reemplazar con supplierService real)
  useEffect(() => {
    if (isOpen) {
      // Aquí harías: const res = await supplierService.getSuppliers();
      setSuppliers([
        { id: 1, name: 'Truper' },
        { id: 2, name: 'Ferre Mayorero' },
        { id: 5, name: 'Materiales del Norte' }
      ]);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    // 1. Validaciones generales
    if (!supplierId) return setAlert({ type: 'error', message: 'Selecciona un proveedor' });
    if (!concept.trim()) return setAlert({ type: 'error', message: 'El concepto es obligatorio' });
    
    const numAmount = parseFloat(totalAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return setAlert({ type: 'error', message: 'El monto total debe ser mayor a 0' });
    }

    // 2. Validaciones específicas del plan de plazos
    if (isInstallmentPlan) {
      if (!dueDate) return setAlert({ type: 'error', message: 'La fecha límite es obligatoria para un plan de plazos' });
      if (dueDate < new Date()) return setAlert({ type: 'error', message: 'La fecha límite debe ser en el futuro' });
      
      const freq = parseInt(paymentFrequencyDays);
      if (isNaN(freq) || freq < 1 || freq > 365) {
        return setAlert({ type: 'error', message: 'La frecuencia debe ser entre 1 y 365 días' });
      }
    }

    setIsLoading(true);

    try {
      // Construir el DTO dinámicamente según el flujo elegido
      const payload: CreateAccountPayableDto = {
        supplierId: Number(supplierId),
        concept: concept.trim(),
        totalAmount: numAmount,
      };

      if (isInstallmentPlan && dueDate) {
        // Enviar formato YYYY-MM-DD para la API
        payload.dueDate = dueDate.toISOString().split('T')[0];
        payload.paymentFrequencyDays = parseInt(paymentFrequencyDays);
      }

      const response = await expenseService.createAccountPayable(payload);

      if (response.success) {
        setAlert({ type: 'success', message: 'Deuda registrada correctamente' });
        setTimeout(() => {
          // Resetear formulario
          setSupplierId('');
          setConcept('');
          setTotalAmount('');
          setIsInstallmentPlan(false);
          setDueDate(null);
          setPaymentFrequencyDays('');
          onClose();
          onSuccess();
        }, 1200);
      } else {
        setAlert({ type: 'error', message: response.message || 'Error al guardar la deuda' });
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: error?.message || 'Error de conexión con el servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabecera */}
        <div className="bg-[#252525] px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Registrar Cuenta por Pagar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
          {alert && <div className="mb-4"><StatusAlert type={alert.type} message={alert.message} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Proveedor *</label>
              <select 
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full bg-[#121212] border border-gray-700 text-white rounded-md px-3 py-2.5 focus:outline-none focus:border-orange-500 appearance-none"
              >
                <option value="" disabled>Selecciona un proveedor...</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Concepto */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Concepto / Factura *</label>
                <InputField 
                  type="text"
                  placeholder="Ej. Factura #1024 - Herramienta"
                  value={concept}
                  onChange={(e: any) => setConcept(e.target.value)}
                  className="w-full bg-[#121212] border border-gray-700 text-white rounded-md focus:border-orange-500"
                />
              </div>

              {/* Monto Total */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Monto Total ($) *</label>
                <InputField 
                  type="number" step="0.01" min="0.01" placeholder="0.00"
                  value={totalAmount}
                  onChange={(e: any) => setTotalAmount(e.target.value)}
                  className="w-full bg-[#121212] border border-gray-700 text-white rounded-md focus:border-orange-500 font-mono text-lg"
                />
              </div>
            </div>

            {/* Separador Visual para la sección de plazos */}
            <div className="pt-4 mt-2 border-t border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-medium text-sm">Plan de pagos automático</h3>
                  <p className="text-xs text-gray-500">Genera cuotas y recordatorios para esta deuda.</p>
                </div>
                
                {/* Switch estilo iOS/Tailwind */}
                <button
                  type="button"
                  onClick={() => setIsInstallmentPlan(!isInstallmentPlan)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isInstallmentPlan ? 'bg-orange-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isInstallmentPlan ? 'translate-x-6' : 'translate-x-1'
                  }`}/>
                </button>
              </div>

              {/* Campos condicionales de Plazos */}
              {isInstallmentPlan && (
                <div className="grid grid-cols-2 gap-4 bg-[#252525] p-4 rounded-lg border border-gray-700 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Fecha Límite *</label>
                    <CustomDatePicker 
                      selected={dueDate} 
                      onChange={setDueDate} 
                      placeholder="Seleccionar..." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Frecuencia (Días) *</label>
                    <InputField 
                      type="number" min="1" max="365" placeholder="Ej. 7, 15, 30"
                      value={paymentFrequencyDays}
                      onChange={(e: any) => setPaymentFrequencyDays(e.target.value)}
                      className="w-full bg-[#121212] border border-gray-700 text-white rounded-md focus:border-orange-500"
                    />
                  </div>
                  <div className="col-span-2 text-xs text-orange-400/80 bg-orange-900/20 p-2 rounded border border-orange-900/30">
                    💡 El sistema dividirá el total automáticamente según los días de frecuencia hasta llegar a la fecha límite.
                  </div>
                </div>
              )}
            </div>

            {/* Footer de botones */}
            <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              >
                {isLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Guardar Deuda'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountPayableCreateModal;