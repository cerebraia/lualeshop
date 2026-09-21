# Guía del dashboard administrativo

## Acceso

URL: `lualekids.shop/admin`

En producción requiere inicio de sesión con usuario registrado en Supabase.
En modo demo (local), el acceso no requiere contraseña.

## Módulos

### Resumen (`/admin`)

Vista general del negocio:
- Métricas financieras del período actual
- Pedidos recientes
- Alertas de stock bajo
- Acciones rápidas

Los datos financieros solo reflejan operaciones reales cuando el modo es `supabase`.

---

### Productos (`/admin/productos`)

Gestión del catálogo:
- Ver, crear, editar y archivar productos
- Subir imágenes
- Configurar tallas, opciones de compra y precios
- Filtrar por estado, categoría y búsqueda

**Importante**: No activar un producto sin imagen ni precio.

---

### Categorías (`/admin/categorias`)

Gestión de las 3 categorías del catálogo:
- Bebés, Niñas, Niños
- No crear categorías sin antes verificar que el catálogo las necesita

---

### Inventario (`/admin/inventario`)

Stock actual por producto y variante:
- Ver stock de cada variante
- Registrar ajustes manuales (entrada, salida, corrección)
- Ver historial de movimientos

**Carga inicial**: usar `/admin/inventario/inicial` antes de cualquier ajuste.

---

### Mercancía (`/admin/mercancia`)

Entradas de mercancía de proveedores:
- Registrar compras de productos
- Confirmar entradas para actualizar el stock
- Ver historial de entradas

**La entrada confirmada actualiza el inventario automáticamente.**

---

### Pedidos (`/admin/pedidos`)

Gestión completa de pedidos:
- Crear nuevo pedido (seleccionar cliente y productos)
- Confirmar pedido (descuenta stock)
- Registrar preparación, envío y entrega
- Registrar pagos (parciales o completos)
- Cancelar (restaura stock)

**Flujo de estados**: Nuevo → Confirmado → Preparado → Enviado → Entregado

---

### Clientes (`/admin/clientes`)

Base de datos de clientes:
- Crear y editar clientes
- Ver historial de pedidos por cliente
- Buscar por nombre, teléfono o ciudad

---

### Gastos (`/admin/gastos`)

Registro de gastos del negocio:
- Categorías: mercancía, publicidad, delivery, empaques, otros
- Cargar comprobante (imagen o PDF)
- Filtrar por período y categoría

---

### Finanzas (`/admin/finanzas`)

Resumen financiero:
- Ingresos cobrados
- Gastos del período
- Utilidad bruta y estimada
- Valor del inventario

**Nota**: Si hay productos sin costo, la utilidad se muestra como "incompleta".

---

### Configuración (`/admin/configuracion`)

Datos del negocio:
- Nombre, WhatsApp, Instagram, ubicación
- Información de delivery y envíos
- Mensajes de la tienda

---

### Puesta en marcha (`/admin/puesta-en-marcha`)

Panel de preparación para el lanzamiento:
- Estado real por categoría (Listo / Pendiente / Bloqueado)
- Reporte de datos de demostración
- Métricas del catálogo
- Lista de datos que debe suministrar el propietario
- GO / NO-GO para lanzamiento

---

## Notas de seguridad

- No compartir contraseñas del dashboard
- No usar el service role key fuera del servidor
- Cerrar sesión al terminar en dispositivos compartidos
- Los datos de clientes son confidenciales — no compartir capturas de pantalla

## Soporte técnico

Para problemas técnicos, revisar primero:
1. `docs/recovery-runbook.md` — problemas comunes y soluciones
2. Logs de Railway (errores del servidor)
3. Consola del navegador (errores del cliente)
