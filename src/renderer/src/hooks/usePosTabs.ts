// src/hooks/usePosTabs.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // 2.1 Separador de almacenamiento local entre usuarios
import { SaleTab, CartItem, PaymentMethod } from '../types/pos';
import { inventoryHubService } from '../services/inventoryHubService';

const STORAGE_KEY = 'tlapaleria_leo_pos_tabs';
const ACTIVE_TAB_KEY = 'tlapaleria_leo_active_tab';

// 1. DEFINIMOS EL LÍMITE MÁXIMO DE CUENTAS SIMULTÁNEAS
export const MAX_TABS = 10;

export const usePosTabs = (onStockConflict?: (message: string) => void) => {

  const { user } = useAuth(); // 2.2. OBTENEMOS EL USUARIO ACTIVO
  const syncedQuantitiesRef = useRef<Map<number, number>>(new Map());
  const onStockConflictRef = useRef(onStockConflict);
  onStockConflictRef.current = onStockConflict;

  // 2.3. LLAVE DINÁMICA: Si el usuario tiene ID 1, la llave será 'pos_tabs_user_1'
  const storageKey = `pos_tabs_user_${user?.id || 'guest'}`;

  // Función auxiliar para crear un Ticket #1 en limpio
  const createDefaultTab = (): SaleTab => ({
    id: `tab-init-${Date.now()}`,
    title: 'Ticket #1',
    type: 'SALE',
    tabNumber: 1,
    isRemovable: false,
    clientName: 'Público en General',
    paymentMethod: 'CASH',
    items: [],
    discount: 0,
    createdAt: Date.now()
  });

  // 4. INICIALIZAMOS LEYENDO LA CAJA FUERTE DEL USUARIO ACTIVO
  const [tabs, setTabs] = useState<SaleTab[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [createDefaultTab()];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed[0]?.id || '';
    }
    return '';
  });

  // ============================================================================
  // EFECTO 1: CAMBIO DE USUARIO (LOGIN / LOGOUT)
  // Cuando entra un usuario diferente, cargamos SU propio carrito de localStorage
  // ============================================================================
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsedTabs: SaleTab[] = JSON.parse(saved);
      setTabs(parsedTabs);
      setActiveTabId(parsedTabs[0]?.id || '');
    } else {
      // Si este usuario nunca había vendido en esta máquina, le creamos su Ticket #1
      const newDefault = [createDefaultTab()];
      setTabs(newDefault);
      setActiveTabId(newDefault[0].id);
    }
  }, [storageKey]); // Se ejecuta cada vez que cambia storageKey (es decir, cuando cambia user.id)

  // ============================================================================
  // EFECTO 2: GUARDADO AUTOMÁTICO EN TIEMPO REAL
  // Cada vez que el vendedor agrega un producto o cambia de pestaña, se guarda en SU llave
  // ============================================================================
  useEffect(() => {
    if (tabs.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(tabs));
    }
  }, [tabs, storageKey]);


  // Sincronización automática con localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
  }, [activeTabId]);

  // Sincroniza todas las presentaciones activas en pestañas de venta ('SALE') con SignalR
  const syncReservationsWithHub = useCallback(async (currentTabs: SaleTab[], forceAll: boolean = false) => {
    const desired = new Map<number, { quantity: number; stockFactor: number; allowFractions: boolean }>();

    for (const tab of currentTabs) {
      if (tab.type !== 'SALE') continue;
      for (const item of tab.items) {
        if (item.isInventoryTracked === false) continue;
        const prev = desired.get(item.presentationId);
        desired.set(item.presentationId, {
          quantity: parseFloat(((prev?.quantity || 0) + item.quantity).toFixed(4)),
          stockFactor: item.stockFactor,
          allowFractions: item.allowFractions === true
        });
      }
    }

    if (forceAll) {
      syncedQuantitiesRef.current.clear();
    }

    // 1. Liberar las presentaciones que ya no están en ninguna pestaña de venta
    for (const [presId] of Array.from(syncedQuantitiesRef.current.entries())) {
      if (!desired.has(presId)) {
        const removed = await inventoryHubService.removeItem(presId);
        if (removed) {
          syncedQuantitiesRef.current.delete(presId);
        }
      }
    }

    // 2. Actualizar las presentaciones cuya cantidad cambió
    for (const [presId, info] of Array.from(desired.entries())) {
      const lastQty = syncedQuantitiesRef.current.get(presId);
      if (lastQty !== info.quantity) {
        const res = await inventoryHubService.setItemQuantity(presId, info.quantity);
        if (!res) continue;

        syncedQuantitiesRef.current.set(presId, info.quantity);

        if (!res.success && res.data) {
          onStockConflictRef.current?.(`⚠️ ${res.message}`);
          const maxUnitsAvailable = info.allowFractions
            ? parseFloat((res.data.availableStock / info.stockFactor).toFixed(2))
            : Math.floor(res.data.availableStock / info.stockFactor);

          const safeAllowed = Math.max(0, maxUnitsAvailable);
          syncedQuantitiesRef.current.set(presId, safeAllowed);

          setTabs((prev) =>
            prev.map((tab) => {
              if (tab.type !== 'SALE') return tab;
              return {
                ...tab,
                items: tab.items
                  .map((i) => (i.presentationId === presId ? { ...i, quantity: safeAllowed } : i))
                  .filter((i) => i.quantity > 0)
              };
            })
          );
        }
      }
    }
  }, []);

  // Conectar al Hub de inventario y escuchar cambios de stock en tiempo real
  useEffect(() => {
    if (!user?.token) return;

    let isMounted = true;

    inventoryHubService.connect(user.token).then(() => {
      if (isMounted) {
        syncReservationsWithHub(tabs, true);
      }
    });

    const unsubStock = inventoryHubService.onStockUpdated((update) => {
      setTabs((prevTabs) => {
        const myTotalBase = prevTabs
          .filter((t) => t.type === 'SALE')
          .flatMap((t) => t.items)
          .filter((i) => i.productId === update.productId)
          .reduce((sum, i) => sum + i.quantity * i.stockFactor, 0);

        const reservedByOthers = Math.max(0, update.reservedStock - myTotalBase);

        return prevTabs.map((tab) => {
          const hasProduct = tab.items.some((i) => i.productId === update.productId);
          if (!hasProduct) return tab;

          return {
            ...tab,
            items: tab.items.map((item) => {
              if (item.productId !== update.productId || item.isInventoryTracked === false) {
                return item;
              }
              const otherItemsInMySaleTabsBase =
                myTotalBase - (tab.type === 'SALE' ? item.quantity * item.stockFactor : 0);
              const newMaxStock = Math.max(
                0,
                parseFloat((update.currentStock - reservedByOthers - otherItemsInMySaleTabsBase).toFixed(4))
              );
              return {
                ...item,
                maxStock: newMaxStock
              };
            })
          };
        });
      });
    });

    const unsubReconnect = inventoryHubService.onReconnected(() => {
      setTabs((currentTabs) => {
        syncReservationsWithHub(currentTabs, true);
        return currentTabs;
      });
    });

    return () => {
      isMounted = false;
      unsubStock();
      unsubReconnect();
    };
  }, [user?.token, syncReservationsWithHub]);

  useEffect(() => {
    if (!user?.token) return;
    syncReservationsWithHub(tabs);
  }, [tabs, user?.token, syncReservationsWithHub]);

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
  // FUNCIÓN PARA CREAR NUEVA PESTAÑA CON LÍMITE DE SEGURIDAD
  // ============================================================================
  const createNewTab = (type: 'SALE' | 'QUOTE'): boolean => {
    // 2. BLINDAJE: Si ya alcanzamos el máximo, bloqueamos y avisamos al usuario
    if (tabs.length >= MAX_TABS) {
      return false; 
    }

    const nextNumber = tabs.length > 0 ? Math.max(...tabs.map(t => t.tabNumber)) + 1 : 1;
    const newTab: SaleTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: type === 'QUOTE' ? `Presupuesto #${nextNumber}` : `Ticket #${nextNumber}`,
      type,
      tabNumber: nextNumber,
      isRemovable: true,
      clientName: 'Público en General',
      paymentMethod: 'CASH',
      items: [],
      discount: 0,
      createdAt: Date.now()
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    return true;
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
        const currentItem = updatedItems[existingIndex];
        updatedItems[existingIndex] = {
          ...currentItem,
          quantity: parseFloat((currentItem.quantity + qtyToAdd).toFixed(4))
        };
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
      updated[index] = { ...updated[index], quantity: newQty };
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