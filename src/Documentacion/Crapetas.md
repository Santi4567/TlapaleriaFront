# Estructura de carpetas y sus funciones 

pages/ Las pantallas principales de tu aplicación. Aquí organizarías el sistema en módulos mayores: PuntoDeVenta/, Inventario/, Reportes/.

components/: Exclusivo para componentes visuales reutilizables que no manejan lógica de negocio compleja (ej. BotonCobrar, TablaProductos, ModalConfirmacion).

services/ : Archivos dedicados a las peticiones HTTP hacia tu backend (fetch de catálogos, registro de tickets, actualización de stock).

context/: Para el manejo del estado global. Indispensable para mantener los datos de la sesión activa y los artículos del carrito de compras en memoria.

types/: Al usar TypeScript, aquí centralizas todas tus interfaces (ej. Producto, Venta, DetalleTicket).

hooks/: Custom hooks de React. Podrías tener cosas como useLectorBarras para manejar los inputs del escáner, o useCálculoTotal.

utils/: Funciones auxiliares puras. Por ejemplo, una función para formatear números a moneda ($ 1,500.00) o calcular impuestos.

src
├── App.tsx
├── assets
│   ├── Carrusel_1.jpg
│   ├── Carrusel_2.jpg
│   ├── imagen.jpg
│   └── logo.png
├── components
│   ├── CustomTitleBar.tsx
│   ├── InputField.tsx
│   ├── Inventario
│   │   ├── InventoryKardexTable.tsx
│   │   ├── InventoryMessageModal.tsx
│   │   ├── InventorySlidingPanel.tsx
│   │   ├── InventoryTable.tsx
│   │   └── MovementModal.tsx
│   ├── pendingOrders
│   │   ├── CatalogOrderModal.tsx
│   │   ├── ConfirmActionModal.tsx
│   │   ├── CustomOrderModal.tsx
│   │   ├── PendingOrdersFilters.tsx
│   │   ├── PendingOrdersTable.tsx
│   │   ├── PlaceOrderModal.tsx
│   │   ├── ReceiveMerchandiseModal.tsx
│   │   └── ReceiveSupplierModal.tsx
│   ├── pos
│   │   ├── PosCartTable.tsx
│   │   ├── PosCashModal.tsx
│   │   ├── PosCheckoutPanel.tsx
│   │   ├── PosClearConfirmModal.tsx
│   │   ├── PosCloseAllConfirmModal.tsx
│   │   ├── PosPaymentMethodModal.tsx
│   │   ├── PosPaymentModal.tsx
│   │   ├── PosPresentationModal.tsx
│   │   ├── PosProductInfoModal.tsx
│   │   ├── PosQuantityModal.tsx
│   │   ├── PosSuccessModal.tsx
│   │   ├── PosSwitchConfirmModal.tsx
│   │   ├── PosTabBar.tsx
│   │   └── PosTabLimitModal.tsx
│   ├── products
│   │   ├── ProductCreateForm.tsx
│   │   ├── ProductReactivateView.tsx
│   │   ├── ProductStepBase.tsx
│   │   ├── ProductStepPresentations.tsx
│   │   ├── ProductStepSummary.tsx
│   │   └── ProductTable.tsx
│   ├── Sidebar.tsx
│   └── suppliers
│       ├── SupplierModal.tsx
│       └── SupplierTable.tsx
├── context
│   └── AuthContext.tsx
├── Documentacion
│   ├── Crapetas.md
│   └── DependenciasLibrerias.md
├── hooks
│   ├── usePosSearch.ts
│   └── usePosTabs.ts
├── index.css
├── layouts
│   └── MainLayout.tsx
├── main.tsx
├── pages
│   ├── FinanceScreen.tsx
│   ├── HomeScreen.tsx
│   ├── InventoryScreen.tsx
│   ├── Login.tsx
│   ├── PendingOrdersScreen.tsx
│   ├── PosScreen.tsx
│   ├── ProductsScreen.tsx
│   ├── SuppliersScreen.tsx
│   └── UserScreen.tsx
├── services
│   ├── authService.ts
│   ├── inventoryService.ts
│   ├── pendingOrderService.ts
│   ├── productService.ts
│   ├── saleService.ts
│   └── supplierService.ts
├── types
│   ├── auth.ts
│   ├── inventory.ts
│   ├── pendingOrder.ts
│   ├── pos.ts
│   ├── product.ts
│   └── supplier.ts
├── utils
│   └── fetchClient.ts
└── vite-env.d.ts