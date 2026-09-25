# Estructura de carpetas y sus funciones 

pages/ Las pantallas principales de la aplicación. Aquí organizarías el sistema en módulos mayores: PuntoDeVenta/, Inventario/, Reportes/. Estos archivos son compositores esa es su funcion principal 

components/: Exclusivo para componentes visuales reutilizables que no manejan lógica de negocio compleja (ej. BotonCobrar, TablaProductos, ModalConfirmacion). Pero aqui tambien viven los componentes de cada seccion con su respectiva carpeta (ejemplo src/pages/FinanceScreen.tsx -> src/componets/finance)

services/ : Archivos dedicados a las peticiones HTTP hacia tu backend (fetch de catálogos, registro de tickets, actualización de stock).

context/: Para el manejo del estado global. Indispensable para mantener los datos de la sesión activa y los artículos del carrito de compras en memoria.

types/: Al usar TypeScript, aquí centralizas todas tus interfaces (ej. Producto, Venta, DetalleTicket).

hooks/: Custom hooks de React. Podrías tener cosas como useLectorBarras para manejar los inputs del escáner, o useCálculoTotal.

utils/: Funciones auxiliares puras. Por ejemplo, una función para formatear números a moneda ($ 1,500.00) o calcular impuestos.

StatusAlert.tsx Es un componete de ayuda para mostrar mensajes de error o de confirmacion al usuario 
CustomDatePicker.tsx Es el selector de fechas para los datmos date(se hace asi ya que el calendario por defecto traba la aplicacion)

Arbol de carpetas:
.
├── App.tsx
├── assets
│   ├── Carrusel_1.jpg
│   ├── Carrusel_2.jpg
│   ├── imagen_3.jpg
│   ├── imagen.jpg
│   └── logo.png
├── components
│   ├── CustomDatePicker.tsx
│   ├── CustomTitleBar.tsx
│   ├── expences
│   ├── finance
│   │   ├── FinanceChart.tsx
│   │   └── FinanceSummaryCards.tsx
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
│   ├── ProductHistory
│   │   ├── GraphHistory.tsx
│   │   ├── ProductGraphHome.tsx
│   │   ├── ProductInformation.tsx
│   │   └── SearchBarHistory.tsx
│   ├── products
│   │   ├── ProductCreateForm.tsx
│   │   ├── ProductReactivateView.tsx
│   │   ├── ProductStepBase.tsx
│   │   ├── ProductStepPresentations.tsx
│   │   ├── ProductStepSummary.tsx
│   │   └── ProductTable.tsx
│   ├── roleManagement
│   │   ├── PanelRol.tsx
│   │   ├── RoleConfirmModal.tsx
│   │   ├── RoleDeleteModal.tsx
│   │   ├── RoleListPanel.tsx
│   │   ├── RolePermissionsPanel.tsx
│   │   └── RolListUser.tsx
│   ├── Sidebar.tsx
│   ├── StatusAlert.tsx
│   ├── suppliers
│   │   ├── SupplierModal.tsx
│   │   └── SupplierTable.tsx
│   └── userManagement
│       ├── UserConfirmModal.tsx
│       ├── UserFormPanel.tsx
│       └── UserTable.tsx
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
│   ├── ExpensesScreen.tsx
│   ├── FinanceScreen.tsx
│   ├── HomeScreen.tsx
│   ├── InventoryScreen.tsx
│   ├── Login.tsx
│   ├── PendingOrdersScreen.tsx
│   ├── PosScreen.tsx
│   ├── ProductHistoryScreen.tsx
│   ├── ProductsScreen.tsx
│   ├── RoleManagementScreen.tsx
│   ├── SuppliersScreen.tsx
│   ├── UserManagementScreen.tsx
│   └── UserScreen.tsx
├── services
│   ├── authService.ts
│   ├── financeService.ts
│   ├── inventoryService.ts
│   ├── pendingOrderService.ts
│   ├── productService.ts
│   ├── reportService.ts
│   ├── roleService.ts
│   ├── saleService.ts
│   ├── supplierService.ts
│   └── userService.ts
├── types
│   ├── auth.ts
│   ├── finance.ts
│   ├── inventory.ts
│   ├── pendingOrder.ts
│   ├── pos.ts
│   ├── product.ts
│   ├── report.ts
│   ├── rol.ts
│   ├── supplier.ts
│   └── user.ts
├── utils
│   ├── authStore.ts
│   └── fetchClient.ts
└── vite-env.d.ts