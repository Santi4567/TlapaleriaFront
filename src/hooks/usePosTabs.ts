// src/hooks/usePosTabs.ts
import { useState, useEffect } from 'react';
import { SaleTab, CartItem } from '../types/pos';

const STORAGE_KEY = 'tlapaleria_leo_pos_tabs';
const ACTIVE_TAB_KEY = 'tlapaleria_leo_active_tab';

export const usePosTabs = () => {
  // 1. Inicializar pestañas garantizando siempre al menos el Ticket #1 inamovible
  const [tabs, setTabs] = useState<SaleTab[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    
    // Pestaña base por defecto (Permanente)
    return [{
      id: 'tab-principal-1',
      title: 'Ticket #1',
      type: 'SALE',
      tabNumber: 1,
      isRemovable: false, // BLINDADA: No se puede borrar
      clientName: 'Público en General',
      items: [],
      discount: 0,
      createdAt: Date.now()
    }];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_TAB_KEY) || (tabs[0]?.id ?? '');
  });

  // Sincronización automática con localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
  }, [activeTabId]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // ============================================================================
  // ALGORITMO: Buscar el número entero más pequeño que NO esté en uso
  // ============================================================================
  const getLowestAvailableNumber = (type: 'SALE' | 'QUOTE', currentTabs: SaleTab[]): number => {
    // Creamos un set con los números actualmente abiertos para ese tipo (Ej. {1, 3})
    const activeNumbers = new Set(
      currentTabs
        .filter(t => t.type === type)
        .map(t => t.tabNumber)
    );

    let candidate = 1;
    // Mientras el número exista en la pantalla, probamos con el siguiente
    while (activeNumbers.has(candidate)) {
      candidate++;
    }
    // Retorna el primer hueco disponible (Ej. si existen 1 y 3, retornará 2)
    return candidate;
  };

  // ==========================================
  // ACCIONES DE GESTIÓN DE VENTANAS / TABS
  // ==========================================

  const createNewTab = (type: 'SALE' | 'QUOTE' = 'SALE', customTitle?: string) => {
    // Calculamos el número exacto llenando huecos disponibles
    const nextNum = getLowestAvailableNumber(type, tabs);
    const newId = `tab-${type.toLowerCase()}-${nextNum}-${Date.now()}`;

    const newTab: SaleTab = {
      id: newId,
      title: customTitle || (type === 'QUOTE' ? `Presupuesto #${nextNum}` : `Ticket #${nextNum}`),
      type,
      tabNumber: nextNum,
      isRemovable: true, // Todas las nuevas creadas sí se pueden cerrar
      clientName: type === 'QUOTE' ? 'Cliente Presupuesto' : 'Público en General',
      items: [],
      discount: 0,
      createdAt: Date.now()
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (idToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const tabToClose = tabs.find(t => t.id === idToRemove);
    
    // REGLA DE NEGOCIO: Si la pestaña está marcada como no borrable o es la última, se bloquea
    if (!tabToClose || tabToClose.isRemovable === false || tabs.length === 1) {
      console.warn("Intento de eliminar una pestaña protegida o única.");
      return;
    }

    const filtered = tabs.filter(t => t.id !== idToRemove);
    setTabs(filtered);

    // Si cerramos la pestaña que estábamos viendo, saltamos a la última disponible
    if (activeTabId === idToRemove) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  // ==========================================
  // ACCIONES DEL CARRITO (PESTAÑA ACTIVA)
  // ==========================================

  const updateActiveTab = (updater: (currentTab: SaleTab) => SaleTab) => {
    setTabs(prev => prev.map(tab => tab.id === activeTabId ? updater(tab) : tab));
  };

  const addItemToCart = (newItem: Omit<CartItem, 'quantity'>, qtyToAdd: number = 1) => {
    updateActiveTab(tab => {
      const existingIndex = tab.items.findIndex(
        i => i.productId === newItem.productId && i.presentationId === newItem.presentationId
      );

      let updatedItems = [...tab.items];
      if (existingIndex > -1) {
        updatedItems[existingIndex].quantity += qtyToAdd;
      } else {
        updatedItems.push({ ...newItem, quantity: qtyToAdd });
      }
      return { ...tab, items: updatedItems };
    });
  };

  const updateItemQuantity = (index: number, newQty: number) => {
    updateActiveTab(tab => {
      if (newQty <= 0) {
        return { ...tab, items: tab.items.filter((_, i) => i !== index) };
      }
      const updated = [...tab.items];
      updated[index].quantity = newQty;
      return { ...tab, items: updated };
    });
  };

  const removeItem = (index: number) => {
    updateActiveTab(tab => ({
      ...tab,
      items: tab.items.filter((_, i) => i !== index)
    }));
  };

  const setClientName = (name: string) => {
    updateActiveTab(tab => ({ ...tab, clientName: name }));
  };

  // ============================================================================
  // NUEVO: Reordenar pestañas estilo navegador (Drag and Drop)
  // ============================================================================
  const reorderTabs = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setTabs(prev => {
      const draggedIndex = prev.findIndex(t => t.id === draggedId);
      const targetIndex = prev.findIndex(t => t.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newTabs = [...prev];
      // 1. Extraemos la pestaña arrastrada de su posición original
      const [removed] = newTabs.splice(draggedIndex, 1);
      // 2. La insertamos exactamente en la nueva posición de destino
      newTabs.splice(targetIndex, 0, removed);
      
      return newTabs;
    });
  };

  // Asegúrate de retornar reorderTabs en el return del hook:
  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createNewTab,
    closeTab,
    reorderTabs, // <-- AGREGADO AQUÍ
    addItemToCart,
    updateItemQuantity,
    removeItem,
    setClientName
  };
};