// src/components/products/ProductReactivateView.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';

interface ProductReactivateViewProps {
  product: any;
  onClose: () => void;
  onReactivatedAndEdit: (product: any) => void;
}

const ProductReactivateView: React.FC<ProductReactivateViewProps> = ({ product, onClose, onReactivatedAndEdit }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReactivate = async () => {
    if (!user?.token) return;
    setIsLoading(true);
    setError(null);

    const res = await productService.reactivateProduct(user.token, product.id);
    setIsLoading(false);

    if (res && res.success) {
      setIsSuccess(true);
    } else {
      setError(res?.message || "No se pudo reactivar el producto.");
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col justify-center items-center relative">
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white font-bold text-lg">✕ Cerrar</button>

      {!isSuccess ? (
        <div className="max-w-md w-full bg-[#121212] p-8 rounded-2xl border border-gray-800 text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black">
            🔒
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Producto Inactivo</h3>
            <p className="text-gray-400 text-sm mt-2">
              El producto <strong className="text-white">{product.name}</strong> (SKU: {product.internalCode}) se encuentra en la papelera. Los productos inactivos no se pueden editar hasta ser restaurados.
            </p>
          </div>

          {error && <p className="text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

          <div className="flex space-x-4 pt-4">
            <button onClick={onClose} className="w-1/2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all">
              Cancelar
            </button>
            <button 
              onClick={handleReactivate} disabled={isLoading}
              className="w-1/2 py-3 bg-brand-orange hover:bg-orange-600 text-black font-extrabold rounded-xl transition-all shadow-lg"
            >
              {isLoading ? 'Reactivando...' : '⚡ Reactivar Ahora'}
            </button>
          </div>
        </div>
      ) : (
        /* MENSAJE DE ÉXITO Y PREGUNTA DE EDICIÓN */
        <div className="max-w-md w-full bg-[#121212] p-8 rounded-2xl border border-green-500/40 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black">
            ✓
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">¡Producto Restaurado!</h3>
            <p className="text-gray-300 text-base mt-3 font-medium">
              ¿Desea Editar el producto reactivado?
            </p>
            <p className="text-gray-500 text-xs mt-1">Ya se encuentra disponible en mostrador y en el buscador.</p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={() => onReactivatedAndEdit(product)}
              className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-black font-black text-lg rounded-xl transition-all shadow-lg"
            >
              Sí, ir a Editar Producto →
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold rounded-xl transition-all text-sm"
            >
              No, volver a la tabla de Inactivos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReactivateView;