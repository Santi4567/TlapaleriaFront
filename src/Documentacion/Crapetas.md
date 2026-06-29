# Estructura de carpetas y sus funciones 

pages/ Las pantallas principales de tu aplicación. Aquí organizarías el sistema en módulos mayores: PuntoDeVenta/, Inventario/, Reportes/.

components/: Exclusivo para componentes visuales reutilizables que no manejan lógica de negocio compleja (ej. BotonCobrar, TablaProductos, ModalConfirmacion).

services/ : Archivos dedicados a las peticiones HTTP hacia tu backend (fetch de catálogos, registro de tickets, actualización de stock).

context/: Para el manejo del estado global. Indispensable para mantener los datos de la sesión activa y los artículos del carrito de compras en memoria.

types/: Al usar TypeScript, aquí centralizas todas tus interfaces (ej. Producto, Venta, DetalleTicket).

hooks/: Custom hooks de React. Podrías tener cosas como useLectorBarras para manejar los inputs del escáner, o useCálculoTotal.

utils/: Funciones auxiliares puras. Por ejemplo, una función para formatear números a moneda ($ 1,500.00) o calcular impuestos.