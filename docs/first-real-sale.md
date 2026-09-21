# Primera venta real — checklist guiado

Este documento es un checklist para que el propietario registre la primera operación real.
No incluye datos personales de clientes.

## Prerequisitos antes de la primera venta

- [ ] Supabase conectado (`.env.local` configurado con `DATA_PROVIDER=supabase`)
- [ ] Usuario owner activo y sesión iniciada
- [ ] Al menos un producto con inventario configurado y stock > 0
- [ ] Al menos un producto con costo registrado
- [ ] WhatsApp configurado en Configuración
- [ ] Métodos de pago configurados

## Pasos

### 1. Verificar stock del producto

1. Ir a `/admin/inventario`
2. Localizar el producto
3. Confirmar que la variante tiene stock > 0
4. Si no: ir a `/admin/inventario/inicial` o registrar una entrada de mercancía

### 2. Crear o seleccionar cliente

1. Ir a `/admin/clientes`
2. Crear cliente real (con su consentimiento para registrar sus datos)
3. Datos mínimos: nombre y teléfono

### 3. Crear el pedido

1. Ir a `/admin/pedidos` → Nuevo pedido
2. Seleccionar el cliente creado
3. Agregar producto y variante
4. Verificar que el precio es correcto (no modificar manualmente)
5. Confirmar la cantidad (no debe superar el stock disponible)
6. Guardar como "Nuevo"

### 4. Confirmar el pedido

1. En el detalle del pedido, cambiar estado a "Confirmado"
2. El sistema debe descontar el stock **una sola vez**
3. Verificar en `/admin/inventario` que el stock se redujo correctamente

### 5. Registrar el pago

1. En el pedido, agregar pago
2. Campos: fecha, método de pago, monto, referencia (si aplica)
3. Si es pago parcial: el estado pasa a "Parcial"
4. Si es pago completo: el estado pasa a "Pagado"

### 6. Preparar y entregar

1. Cambiar estado del pedido a "Preparado"
2. Cambiar estado a "Enviado" cuando salga
3. Cambiar estado a "Entregado" al confirmar recepción

### 7. Verificar en finanzas

1. Ir a `/admin/finanzas`
2. Confirmar que el ingreso aparece en el período correcto
3. Confirmar que el costo de mercancía vendida se refleja (si el producto tiene costo)

### 8. Cancelación (si aplica)

- Cancelar desde el detalle del pedido
- El sistema debe restaurar el stock automáticamente
- El historial del pedido se conserva
- Los pagos registrados NO se borran — quedan como referencia

## Qué NO hacer

- No presionar "Confirmar" dos veces en el mismo pedido
- No registrar el pago antes de crear el pedido
- No modificar el precio directamente en el formulario de pago
- No eliminar pedidos — solo cancelar
- No mezclar datos reales con datos de prueba (prefijo TEST-)

## Modo de prueba controlado

Si quieres probar el flujo sin datos reales:

1. Usa nombres con prefijo `TEST-` (ej: cliente "TEST-Prueba", pedido nota "TEST")
2. Registra todos los IDs generados
3. Al finalizar, elimina o archiva los registros TEST desde cada módulo
4. Confirma que las métricas financieras vuelven a su estado original

## Verificación final

Después de la primera venta real:

- [ ] Stock reducido correctamente en inventario
- [ ] Pago registrado con método correcto
- [ ] Ingreso visible en finanzas
- [ ] Utilidad bruta calculada (requiere costo del producto)
- [ ] Cliente en historial de clientes
- [ ] Pedido en historial con estado "Entregado"
