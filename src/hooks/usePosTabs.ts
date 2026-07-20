// src/hooks/usePosTabs.ts
import { useState, useEffect } from 'react';
import { SaleTab, CartItem, PaymentMethod } from '../types/pos';

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
    
    // Pestaña base por defecto (Permanente y blindada)
    return [{
      id: 'tab-principal-1',
      title: 'Ticket #1',
      type: 'SALE',
      tabNumber: 1,
      isRemovable: false, // No se puede borrar
      clientName: 'Público en General',
      paymentMethod: 'CASH',
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
    const activeNumbers = new Set(
      currentTabs
        .filter(t => t.type === type)
        .map(t => t.tabNumber)
    );

    let candidate = 1;
    while (activeNumbers.has(candidate)) {
      candidate++;
    }
    return candidate;
  };

  // ============================================================================
  // ACCIONES DE GESTIÓN DE VENTANAS / TABS
  // ============================================================================

  const createNewTab = (type: 'SALE' | 'QUOTE' = 'SALE', customTitle?: string) => {
    const nextNum = getLowestAvailableNumber(type, tabs);
    const newId = `tab-${type.toLowerCase()}-${nextNum}-${Date.now()}`;

    const newTab: SaleTab = {
      id: newId,
      title: customTitle || (type === 'QUOTE' ? `Presupuesto #${nextNum}` : `Ticket #${nextNum}`),
      type,
      tabNumber: nextNum,
      isRemovable: true,
      clientName: type === 'QUOTE' ? 'Cliente Presupuesto' : 'Público en General',
      paymentMethod: 'CASH',
      items: [],
      discount: 0,
      createdAt: Date.now()
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  // ÚNICA DECLARACIÓN DE closeTab CON REGLA DE NEGOCIO BLINDADA
  const closeTab = (idToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const tabToClose = tabs.find(t => t.id === idToRemove);
    if (!tabToClose || tabToClose.isRemovable === false) {
      console.warn("Intento de eliminar una pestaña protegida.");
      return;
    }

    const filtered = tabs.filter(t => t.id !== idToRemove);
    const remainingSales = filtered.filter(t => t.type === 'SALE');
    
    // REGLA DE ORO: Si tras borrar nos quedamos sin pestañas o sin ninguna de tipo Venta Directa ('SALE')
    if (filtered.length === 0 || remainingSales.length === 0) {
      const nextNum = getLowestAvailableNumber('SALE', filtered);
      const emergencySaleTab: SaleTab = {
        id: `tab-sale-${nextNum}-${Date.now()}`,
        title: `Ticket #${nextNum}`,
        type: 'SALE',
        tabNumber: nextNum,
        isRemovable: filtered.length > 0, // Solo protegida si es la única en toda la pantalla
        clientName: 'Público en General',
        paymentMethod: 'CASH',
        items: [],
        discount: 0,
        createdAt: Date.now()
      };
      
      const newTabsList = [...filtered, emergencySaleTab];
      setTabs(newTabsList);
      setActiveTabId(emergencySaleTab.id);
      return;
    }

    setTabs(filtered);

    // Si cerramos la que estábamos viendo, saltamos a la última disponible
    if (activeTabId === idToRemove) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  // ============================================================================
  // REORDENAR PESTAÑAS ESTILO NAVEGADOR (DRAG & DROP)
  // ============================================================================
  const reorderTabs = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setTabs(prev => {
      const draggedIndex = prev.findIndex(t => t.id === draggedId);
      const targetIndex = prev.findIndex(t => t.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newTabs = [...prev];
      const [removed] = newTabs.splice(draggedIndex, 1);
      newTabs.splice(targetIndex, 0, removed);
      
      return newTabs;
    });
  };

  // ============================================================================
  // ACCIONES DEL CARRITO (PESTAÑA ACTIVA)
  // ==========================================

  const updateActiveTab = (updater: (currentTab: SaleTab) => SaleTab) => {
    setTabs(prev => prev.map(tab => tab.id === activeTabId ? updater(tab) : tab));
  };

  // ============================================================================
  // CONVERTIR BIDIRECCIONALMENTE ENTRE VENTA DIRECTA Y PRESUPUESTO
  // ============================================================================
  const switchTabType = (targetType: 'SALE' | 'QUOTE') => {
    if (activeTab.type === targetType) return;

    const nextNum = getLowestAvailableNumber(targetType, tabs);
    const oldPrefix = activeTab.type === 'QUOTE' ? 'Presupuesto #' : 'Ticket #';
    const newPrefix = targetType === 'QUOTE' ? 'Presupuesto #' : 'Ticket #';

    let newTitle = activeTab.title;
    let newTabNum = activeTab.tabNumber;

    if (activeTab.title.startsWith(oldPrefix)) {
      newTitle = `${newPrefix}${nextNum}`;
      newTabNum = nextNum;
    }

    updateActiveTab(tab => ({
      ...tab,
      type: targetType,
      title: newTitle,
      tabNumber: newTabNum
    }));
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

  const clearActiveTabItems = () => {
    updateActiveTab(tab => ({ ...tab, items: [], discount: 0 }));
  };

  const setClientName = (name: string) => {
    updateActiveTab(tab => ({ ...tab, clientName: name }));
  };

  const setPaymentMethod = (method: PaymentMethod) => {
    updateActiveTab(tab => ({ ...tab, paymentMethod: method }));
  };

  // ============================================================================
  // NUEVO: Cerrar todas las pestañas de golpe y reiniciar a Ticket #1
  // ============================================================================
  const closeAllTabs = () => {
    const resetTab: SaleTab = {
      id: `tab-principal-1-${Date.now()}`,
      title: 'Ticket #1',
      type: 'SALE',
      tabNumber: 1,
      isRemovable: false,
      clientName: 'Público en General',
      paymentMethod: 'CASH',
      items: [],
      discount: 0,
      createdAt: Date.now()
    };
    
    setTabs([resetTab]);
    setActiveTabId(resetTab.id);
  };

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createNewTab,
    closeTab,
    reorderTabs,
    switchTabType,
    addItemToCart,
    updateItemQuantity,
    removeItem,
    clearActiveTabItems,
    setClientName,
    setPaymentMethod,
    closeAllTabs
  };
};