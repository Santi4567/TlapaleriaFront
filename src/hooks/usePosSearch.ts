// src/hooks/usePosSearch.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { Product } from '../types/product';

export const usePosSearch = (
  onSelectProduct: (product: Product) => void
) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.token || !searchTerm.trim()) {
      setResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setIsLoading(true);
      // Asumiendo que productService tiene el buscador. Si está vacío trae el catálogo rápido
      const res = await productService.searchProducts(user.token, searchTerm, true);
      if (res && res.success) {
        setResults(res.data);
      } else {
        setResults([]);
      }
      setIsLoading(false);
    }, 300); // Debounce ligero

    return () => clearTimeout(delaySearch);
  }, [searchTerm, user?.token]);

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setSearchTerm('');
    setResults([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    isLoading,
    handleSelect
  };
};