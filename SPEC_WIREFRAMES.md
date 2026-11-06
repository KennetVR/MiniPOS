# SPEC_WIREFRAMES - Wireframes y Prototipos
## Sistema POS para Minimarket

> **Versión:** 1.0  
> **Fecha:** 23 de Marzo de 2026  
> **Proyecto:** MiniPOS  

---

## 1. Pantalla de Login

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                                                        │
│                     ┌──────────────┐                   │
│                     │    LOGO      │                   │
│                     │   MINIPOS    │                   │
│                     └──────────────┘                   │
│                                                        │
│                   ─────────────────                    │
│                                                        │
│                   ┌──────────────────┐                 │
│                   │   Username       │                 │
│                   └──────────────────┘                 │
│                                                        │
│                   ┌──────────────────┐                 │
│                   │   Password       │                 │
│                   └──────────────────┘                 │
│                                                        │
│                   ┌──────────────────┐                 │
│                   │      LOGIN      │                 │
│                   └──────────────────┘                 │
│                                                        │
│                                                        │
│                         v1.0.0                         │
└────────────────────────────────────────────────────────┘
```

**Componentes:**
- Logo centrado
- Campo username (text input)
- Campo password (type: password, con toggle ver/ocultar)
- Botón login (primario, full width)
- Versión en footer

**Comportamiento:**
- Enter en cualquier campo ejecuta login
- Focus automático en username al cargar
- Indicador de loading en botón durante validación

---

## 2. Dashboard Principal

```
┌────────────────────────────────────────────────────────────────────┐
│  ☰  MiniPOS            Dashboard      🔔  Admin ▼  │ Cerrar Sesión │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Ventas  │ │ Ganancias│ │ Ticket   │ │ Productos│               │
│ │ S/ 1,250 │ │ S/   320 │ │ Promedio │ │  Stock   │               │
│ │  Hoy     │ │  Hoy     │ │ S/  25.00│ │  Alert   │               │
│ │ +15% ▲   │ │ +8%  ▲   │ │ -2%  ▼   │ │    12    │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                    │
│  ┌─────────────────────────────────┐ ┌──────────────────────────┐  │
│  │ Ventas por Hora                 │ │ Productos Más Vendidos    │  │
│  │                                 │ │                          │  │
│  │    █                            │ │ 1. Gaseosa 2L      45    │  │
│  │    █  █                         │ │ 2. Pan Integral    38    │  │
│  │  █ █  █  █                      │ │ 3. Leche Gloria    32    │  │
│  │  █ █  █  █  █                   │ │ 4. Arroz Costeño   28    │  │
│  │ ────────────────────            │ │ 5. Azúcar         25    │  │
│  │  8  9 10 11 12 13 14 15        │ │                          │  │
│  │                                 │ │                          │  │
│  └─────────────────────────────────┘ └──────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Resumen Semanal                                              │  │
│  │ ┌────────────────────────────────────────────────────────┐   │  │
│  │ │  █                                                         │   │  │
│  │ │  █  █                                                     │   │  │
│  │ │  █  █  █  █  █                                            │   │  │
│  │ │ ──────────────────────────────────────────              │   │  │
│  │ │  Lun  Mar  Mié  Jue  Vie  Sáb  Dom                       │   │  │
│  │ └────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ Productos con Stock Bajo                                  │  │
│  │ ┌────────────────────────────────────────────────────────┐   │  │
│  │ │ 🔴 Galleta Oreo      Stock: 3  │  🔴 Detergente Max   │   │  │
│  │ │ 🟡 Atún Natalie     Stock: 5  │  🟡 Shampoo Sedal   │   │  │
│  │ └────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- Header con logo, título de página, usuario y logout
- Sidebar (oculto en móvil)
- 4 Cards de métricas (Ventas, Ganancias, Ticket Promedio, Alertas Stock)
- Gráfico de barras: Ventas por hora
- Lista: Top 5 productos vendidos
- Gráfico de línea: Resumen semanal
- Tabla: Productos bajo stock mínimo

---

## 3. Punto de Venta (POS)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PUNTO DE VENTA                    [F1]          │
├─────────────────────────────────────────────┬────────────────────────────────┤
│                                             │                                │
│  ┌─────────────────────────────────────────┐ │  ┌────────────────────────────┐│
│  │ 🔍 Código de barras o nombre...    │ │ │  │       BOLETA N°            ││
│  └─────────────────────────────────────────┘ │  │       2026-000001         ││
│                                             │  ├────────────────────────────┤│
│  ┌─────────────────────────────────────────┐ │  │                            ││
│  │ ┌────┬──────────────────┬────┬──────┐ │ │  │  2x Gaseosa 2L     S/11.00 ││
│  │ │ Cant│ Producto          │ P.U │ Total│ │ │  │  1x Pan Integral   S/ 3.00││
│  │ ├────┼──────────────────┼────┼──────┤ │ │  │  3x Leche 1L       S/12.00 ││
│  │ │  2 │ Gaseosa 2L       │5.50│ 11.00│ │ │  │                      ───────││
│  │ │  1 │ Pan Integral     │3.00│  3.00│ │ │  │  Subtotal:         S/26.00││
│  │ │  3 │ Leche Gloria 1L  │4.00│ 12.00│ │ │  │  Descuento:        S/ 0.00││
│  │ │    │                  │    │      │ │ │  │  IGV (18%):        S/ 4.68││
│  │ │    │                  │    │      │ │ │  │  ═══════════════════════════││
│  │ │    │                  │    │      │ │ │  │  TOTAL:            S/30.68││
│  │ └────┴──────────────────┴────┴──────┘ │ │  │                            ││
│  │                                     │ │  │  ────────────────────────────││
│  │                                     │ │  │  Efectivo:          S/ 50.00││
│  │                                     │ │  │  Vuelto:            S/19.32││
│  └─────────────────────────────────────┘ │  └────────────────────────────┘│
│                                             │                                │
│  ┌─────────────────────────────────────────┐│  ┌────────────────────────────┐│
│  │ Descuento: [%] [S/]        S/ 0.00      ││  │   ┌──────┐    ┌──────────┐ ││
│  └─────────────────────────────────────────┘│  │   │ COBRAR│    │  CANCELAR│ ││
│                                             │  │   │  F5   │    │    ESC   │ ││
│                                             │  │   └──────┘    └──────────┘ ││
│                                             │  └────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│                                │
│  │ Efectivo recibido: S/                  ││                                │
│  └─────────────────────────────────────────┘│                                │
│                                             │                                │
├─────────────────────────────────────────────┴────────────────────────────────┤
│  F1: POS  │  F2: Productos  │  F3: Inventario  │  F4: Reportes  │  F5: Cobrar │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- Campo de búsqueda con ícono de escáner
- Tabla de productos en venta (scrollable)
- Panel de boleta en tiempo real (derecha)
- Campo de descuento (% o monto fijo)
- Campo de efectivo recibido
- Botones COBRAR y CANCELAR
- Barra de atajos de teclado

**Comportamiento:**
- Escaneo automático añade producto
- Enter en cantidad confirma
- Delete/Backspace elimina producto seleccionado
- Tab navega entre campos
- F5 ejecuta cobro
- Impresión automática tras cobro exitoso

---

## 4. Lista de Productos

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Productos                                                      [+ Nuevo] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Buscar por código o nombre...        │ Filtrar: [Todas ▼]  │ [≡] │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ Código      │ Nombre              │ Categoría  │ P. Compra │ P.Venta││
│  ├─────────────┼─────────────────────┼────────────┼───────────┼────────┤│
│  │ 775123400001 │ Gaseosa Coca Cola 2L│ Bebidas    │ S/ 3.50   │ S/5.50 ││
│  │ 775123400002 │ Pan Integral          │ Panadería  │ S/ 2.00   │ S/3.00 ││
│  │ 775123400003 │ Leche Gloria 1L       │ Lacteos    │ S/ 3.20   │ S/4.00 ││
│  │ 775123400004 │ Arroz Costeño 1kg     │ Abarrotes  │ S/ 4.00   │ S/5.50 ││
│  │ 775123400005 │ Detergente Limón 1L   │ Limpieza   │ S/ 3.80   │ S/5.00 ││
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Mostrando 1-5 de 245 productos                        [<] 1 2 3 ... 49 [>] │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- Header con título y botón "Nuevo Producto"
- Barra de búsqueda con filtros
- Selector de categoría (dropdown)
- Tabla con paginación
- Botones de acciones por fila (editar, eliminar)

---

## 5. Formulario de Producto

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Registrar Producto                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │   ┌──────────────────────────────┐                                  │  │
│  │   │                              │                                  │  │
│  │   │        📷 Imagen            │   Código de Barras:              │  │
│  │   │        (clic para           │   ┌───────────────────────────┐   │  │
│  │   │         agregar)            │   │ 775123400001             │   │  │
│  │   │                              │   └───────────────────────────┘   │  │
│  │   └──────────────────────────────┘                                  │  │
│  │                                                                     │  │
│  │   Nombre del Producto:                    Categoría:                 │  │
│  │   ┌───────────────────────────────┐      ┌───────────────────────┐  │  │
│  │   │ Gaseosa Coca Cola 2L          │      │ Bebidas           ▼  │  │  │
│  │   └───────────────────────────────┘      └───────────────────────┘  │  │
│  │                                                                     │  │
│  │   Descripción:                       Proveedor:                     │  │
│  │   ┌───────────────────────────────┐      ┌───────────────────────┐  │  │
│  │   │ Bebida gasificada 2 litros    │      │ Distribuidora ABC  ▼  │  │  │
│  │   └───────────────────────────────┘      └───────────────────────┘  │  │
│  │                                                                     │  │
│  │   ──────────────────────────────────────────────────────────────  │  │
│  │                                                                     │  │
│  │   Precio de Compra:           Precio de Venta:                      │  │
│  │   ┌─────────────────────┐     ┌─────────────────────┐              │  │
│  │   │ S/  3.50             │     │ S/  5.50            │              │  │
│  │   └─────────────────────┘     └─────────────────────┘              │  │
│  │                                                                     │  │
│  │   Stock Inicial:              Stock Mínimo (Alerta):                │  │
│  │   ┌─────────────────────┐     ┌─────────────────────┐              │  │
│  │   │ 50                   │     │ 10                   │              │  │
│  │   └─────────────────────┘     └─────────────────────┘              │  │
│  │                                                                     │  │
│  │   ☐ Producto activo (visible en ventas)                            │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│                         [Cancelar]              [Guardar Producto]         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- Selector de imagen (drag & drop)
- Campos del formulario organizados en grid
- Validaciones en tiempo real (precio venta > compra)
- Checkbox de estado activo/inactivo
- Botones cancelar y guardar

---

## 6. Módulo de Contabilidad

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Contabilidad                    [Ingresos] [Egresos] [Reportes]          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Egresos]  ┌─────────────────────────────────────────────────────────┐    │
│             │  Resumen del Mes: Marzo 2026                             │    │
│  ┌────────┐ │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │ Totales│ │  │  Ingresos    │  │   Egresos    │  │   Ganancia   │   │    │
│  └────────┘ │  │  S/ 15,320.00 │  │  S/ 10,450.00│  │  S/  4,870.00│   │    │
│             │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│             └─────────────────────────────────────────────────────────┘    │
│             │                                                              │
│             │  [+ Nuevo Egreso]                                            │
│             │                                                              │
│             │  ┌──────────────────────────────────────────────────────┐    │
│             │  │ Fecha    │ Tipo      │ Concepto        │ Monto     │    │
│             │  ├──────────┼───────────┼─────────────────┼───────────┤    │
│             │  │ 23/03/26 │ Compra    │ Compra merca... │ S/ 850.00 │    │
│             │  │ 22/03/26 │ Servicio  │ Luz - Marzo     │ S/ 250.00 │    │
│             │  │ 21/03/26 │ Sueldo    │ Pago vendedor   │ S/ 800.00 │    │
│             │  │ 20/03/26 │ Compra    │ Compra merca... │ S/ 650.00 │    │
│             │  │ 18/03/26 │ Mantenim..│ Reparación...   │ S/ 120.00 │    │
│             │  └──────────────────────────────────────────────────────┘    │
│             │                                                              │
│             │  Mostrando 1-5 de 89 registros        [<] 1 2 3 ... 18 [>]   │
│             │                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- Tabs: Ingresos, Egresos, Reportes
- Cards de resumen (total ingresos, egresos, ganancia)
- Tabla con registros
- Paginación
- Botón para nuevo registro

---

## 7. Ventana Modal - Cobro

```
┌────────────────────────────────────────────────────────┐
│                      💰 COBRO                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│                    Total a Pagar                       │
│                   ┌──────────────┐                     │
│                   │  S/ 30.68    │                     │
│                   └──────────────┘                     │
│                                                        │
│  Forma de Pago:                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │  (●) Efectivo                                  │   │
│  │  ( ) Tarjeta Débito                           │   │
│  │  ( ) Tarjeta Crédito                          │   │
│  │  ( ) Yape / Plin                              │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  Efectivo Recibido:                                    │
│  ┌────────────────────────────────────────────────┐   │
│  │ S/ 50.00                                       │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│                    Vuelto: S/ 19.32                    │
│                                                        │
│  ┌────────────────────┐  ┌────────────────────────┐    │
│  │     CANCELAR       │  │    COBRAR Y IMPRIMIR   │    │
│  │       ESC          │  │          F5           │    │
│  └────────────────────┘  └────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 8. Diseño Responsive

### Versión Desktop (≥1024px)
- Sidebar visible
- Layout de 2-3 columnas
- Tablas completas

### Versión Tablet (768px - 1023px)
- Sidebar colapsable
- Layout de 2 columnas
- Tablas simplificadas

### Versión Móvil (≤767px)
- Sidebar como drawer
- Layout de 1 columna
- Cards en lugar de tablas

---

**Última actualización: 23/03/2026**
