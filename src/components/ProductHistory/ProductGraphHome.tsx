import React, { useState, useEffect } from 'react';
import { Product, ProductPresentation } from '../../types/product';
import ProductInformation from './ProductInformation';
import GraphHistory from './GraphHistory';

interface Props {
  product: Product;
}

const ProductGraphHome: React.FC<Props> = ({ product }) => {
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation | null>(null);

  useEffect(() => {
    if (product.presentations && product.presentations.length > 0) {
      setSelectedPresentation(product.presentations[0]);
    } else {
      setSelectedPresentation(null);
    }
  }, [product]);

  return (
    // Agregamos min-h-0 para evitar que Flexbox rompa el layout vertical
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
      <div className="xl:col-span-1 bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col overflow-hidden relative">
        <ProductInformation 
          product={product} 
          selectedPresentation={selectedPresentation}
          onSelectPresentation={setSelectedPresentation}
        />
      </div>

      <div className="xl:col-span-2 bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col min-h-0">
        {selectedPresentation ? (
          <GraphHistory 
            product={product} 
            presentation={selectedPresentation} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Este producto no tiene presentaciones registradas.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGraphHome;