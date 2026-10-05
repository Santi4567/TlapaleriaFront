import React, { useState, useEffect } from 'react';
// Ajusta las rutas según tu estructura exacta
import InputField from '../InputField'; 
import StatusAlert from '../StatusAlert';
import { CreateExpenseDto, Category } from '../../types/expense';
import { expenseService } from '../../services/expenseService';

interface ExpenseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Para recargar la tabla después de guardar
}

const ExpenseCreateModal: React.FC<ExpenseCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  // Estados para el formulario
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque'>('Efectivo');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  
  // Estado para el catálogo de categorías
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Estados de la interfaz
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Cargar categorías al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const response = await expenseService.getCategories();
          if (response.success) {
            setCategories(response.data);
          }
        } catch (error) {
          console.error("Error cargando categorías:", error);
          setAlert({ type: 'error', message: 'No se pudieron cargar las categorías' });
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    // Validaciones básicas del lado del cliente
    if (!concept.trim()) {
      setAlert({ type: 'error', message: 'El concepto es obligatorio' });
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAlert({ type: 'error', message: 'El monto debe ser mayor a 0' });
      return;
    }
    if (!categoryId) {
      setAlert({ type: 'error', message: 'Selecciona una categoría' });
      return;
    }

    setIsLoading(true);

    try {
      const payload: CreateExpenseDto = {
        concept: concept.trim(),
        amount: numAmount,
        paymentMethod: paymentMethod,
        categoryId: Number(categoryId),
        // supplierId, accountsPayableId, scheduleId se omiten aquí, 
        // ya que este formulario es para egresos directos, no para abonos a deudas.
      };

      const response = await expenseService.createExpense(payload);

      if (response.success) {
        setAlert({ type: 'success', message: 'Egreso registrado correctamente' });
        
        // Limpiar formulario y cerrar después de 1 segundo
        setTimeout(() => {
          setConcept('');
          setAmount('');
          setPaymentMethod('Efectivo');
          setCategoryId('');
          onClose();
          onSuccess();
        }, 1200);
      } else {
        setAlert({ type: 'error', message: response.message || 'Error al guardar el egreso' });
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: error?.message || 'Error de conexión con el servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Overlay oscuro con desenfoque
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      
      {/* Contenedor del Modal */}
      <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col transform scale-100 transition-transform">
        
        {/* Cabecera */}
        <div className="bg-[#252525] px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Registrar Egreso</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6">
          {alert && (
            <div className="mb-4">
               {/* Asumiendo la estructura de props de tu StatusAlert */}
              <StatusAlert type={alert.type} message={alert.message} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Concepto usando tu InputField genérico */}
            <div>
               {/* Si tu InputField requiere otras props, ajústalas */}
              <label className="block text-sm font-medium text-gray-400 mb-1">Concepto *</label>
              <InputField 
                type="text"
                placeholder="Ej. Recibo CFE, Compra material..."
                value={concept}
                onChange={(e: any) => setConcept(e.target.value)}
                maxLength={255}
                className="w-full bg-[#121212] border border-gray-700 text-white rounded-md focus:border-orange-500"
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Monto ($) *</label>
              <InputField 
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e: any) => setAmount(e.target.value)}
                className="w-full bg-[#121212] border border-gray-700 text-white rounded-md focus:border-orange-500 font-mono"
              />
            </div>

            {/* Categoría (Select HTML nativo con estilos Tailwind) */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Categoría *</label>
              <select 
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-[#121212] border border-gray-700 text-white rounded-md px-3 py-2.5 focus:outline-none focus:border-orange-500 appearance-none"
              >
                <option value="" disabled>Selecciona una categoría...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Método de Pago *</label>
              <div className="grid grid-cols-2 gap-2">
                {['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method as any)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
                      paymentMethod === method 
                        ? 'bg-orange-600 border-orange-500 text-white shadow-inner' 
                        : 'bg-[#2a2a2a] border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer de botones */}
            <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_10px_rgba(234,88,12,0.2)] disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : 'Guardar Egreso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCreateModal;