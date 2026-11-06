# SPEC - Sistema POS para Minimarket

> **Versión:** 1.0  
> **Fecha:** 23 de Marzo de 2026  
> **Autor:** Kenne  
> **Estado:** Borrador  

---

## 1. Descripción del Proyecto

### 1.1 Nombre del Proyecto
**MiniPOS** - Sistema de Punto de Venta para Minimarket

### 1.2 Tipo de Proyecto
Aplicación de escritorio para Windows con base de datos local.

### 1.3 Resumen Ejecutivo
Sistema integral de gestión comercial para minimarket que permite el registro de productos mediante código de barras, procesamiento de ventas con generación de boletas, control de inventario, seguimiento contable (ingresos/egresos) y visualización de KPIs en tiempo real.

### 1.4 Objetivos del Proyecto

| Objetivo | Descripción | Prioridad |
|----------|-------------|-----------|
| O-01 | Registrar productos con código de barras y datos completos | Alta |
| O-02 | Procesar ventas de forma rápida con escaneo | Alta |
| O-03 | Generar boletas personalizadas para clientes | Alta |
| O-04 | Controlar inventario en tiempo real | Alta |
| O-05 | Registrar ingresos y egresos contables | Alta |
| O-06 | Visualizar KPIs y métricas del negocio | Media |
| O-07 | Reportes de ventas y financieros | Media |

### 1.5 Alcance del Proyecto

#### Incluido en el alcance
- Módulo de gestión de productos (CRUD)
- Módulo de punto de venta (POS)
- Módulo de inventario
- Módulo contable (ingresos/egresos)
- Módulo de dashboard y KPIs
- Generación de boletas
- Base de datos local

#### Excluido del alcance
- Integración con sistemas fiscales (sunat/sii)
- Ventas online/e-commerce
- Aplicación móvil
- Sistema multi-sucursal
- Integración con balanzas

---

## 2. Requerimientos Funcionales

### 2.1 Módulo de Gestión de Productos

#### RF-01: Registrar Producto
**Descripción:** El sistema debe permitir registrar nuevos productos en la base de datos.

**Datos del producto:**
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| Código de barras | VARCHAR(50) | Sí | Único en la BD |
| Nombre | VARCHAR(100) | Sí | Máximo 100 caracteres |
| Descripción | TEXT | No | - |
| Categoría | FK | Sí | Referencia a tabla categorías |
| Precio compra | DECIMAL(10,2) | Sí | Mayor a 0 |
| Precio venta | DECIMAL(10,2) | Sí | Mayor a precio compra |
| Stock inicial | INTEGER | Sí | Mayor o igual a 0 |
| Stock mínimo | INTEGER | Sí | Mayor o igual a 0 |
| Proveedor | FK | No | Referencia a tabla proveedores |
| Estado | BOOLEAN | Sí | Activo/Inactivo |
| Imagen | BLOB | No | Formatos: jpg, png |

**Criterios de aceptación:**
- [ ] El código de barras no puede repetirse
- [ ] El precio de venta debe ser mayor al precio de compra
- [ ] Se debe mostrar mensaje de error si la validación falla
- [ ] Al guardar exitosamente, mostrar confirmación y limpiar formulario

#### RF-02: Editar Producto
**Descripción:** Modificar datos de un producto existente.

**Criterios de aceptación:**
- [ ] Solo productos activos pueden editarse
- [ ] Historial de cambios guardado
- [ ] Validaciones iguales a RF-01

#### RF-03: Eliminar Producto
**Descripción:** Eliminar lógicamente un producto (cambio de estado).

**Criterios de aceptación:**
- [ ] El producto pasa a estado "Inactivo"
- [ ] No se elimina físicamente de la BD
- [ ] Producto inactivo no aparece en POS

#### RF-04: Buscar Producto
**Descripción:** Buscar productos por código de barras o nombre.

**Criterios de aceptación:**
- [ ] Búsqueda por código de barras (principal en POS)
- [ ] Búsqueda por nombre con autocompletado
- [ ] Búsqueda por categoría
- [ ] Resultados en menos de 500ms

#### RF-05: Gestión de Categorías
**Descripción:** CRUD de categorías de productos.

**Categorías predefinidas:**
- Bebidas
- Abarrotes
- Golosinas
- Limpieza
- Frutas/Verduras
- Lacteos
- Panadería
- Otros

**Criterios de aceptación:**
- [ ] Agregar nuevas categorías
- [ ] Editar nombre de categoría
- [ ] Eliminar solo si no tiene productos asociados

### 2.2 Módulo de Punto de Venta (POS)

#### RF-06: Registro de Venta
**Descripción:** Proceso de venta con escaneo de productos.

**Flujo del proceso:**
1. Escanear código de barras
2. Producto aparece en lista de venta
3. Ajustar cantidad si es necesario
4. Agregar más productos (repetir 1-3)
5. Ver total y descuento (si aplica)
6. Confirmar venta
7. Generar boleta
8. Actualizar stock

**Criterios de aceptación:**
- [ ] Escaneo rápido (< 200ms respuesta)
- [ ] Si producto no existe, permitir búsqueda manual
- [ ] Cantidad modificable antes de confirmar
- [ ] Tecla Enter para confirmar cantidad
- [ ] Tecla Escape para cancelar venta
- [ ] Productos ordenados por orden de agregado

#### RF-07: Descuentos
**Descripción:** Aplicar descuentos a ventas.

**Tipos de descuento:**
| Tipo | Descripción |
|------|-------------|
| Por producto | Descuento unitario en producto específico |
| Por venta | Descuento porcentual al total (max 50%) |
| Descuento manual | Monto fijo o porcentaje |

**Criterios de aceptación:**
- [ ] Aplicar descuento por producto
- [ ] Aplicar descuento al total
- [ ] Registro de motivo de descuento
- [ ] Límite de descuento configurable

#### RF-08: Formas de Pago
**Descripción:** Registrar forma de pago de la venta.

**Formas de pago:**
- Efectivo
- Tarjeta débito
- Tarjeta crédito
- Yape/Plin
- Transferencia

**Criterios de aceptación:**
- [ ] Registrar una o múltiples formas de pago
- [ ] Calcular vuelto automáticamente (efectivo)
- [ ] Ventas separadas por forma de pago en reportes

#### RF-09: Anulación de Venta
**Descripción:** Anular una venta realizada.

**Criterios de aceptación:**
- [ ] Solo ventas del día pueden anularse
- [ ] Requiere理由 de anulación
- [ ] Stock revertido automáticamente
- [ ] Registro de quién anuló y cuándo

### 2.3 Módulo de Inventario

#### RF-10: Control de Stock
**Descripción:** Seguimiento de inventario en tiempo real.

**Criterios de aceptación:**
- [ ] Stock actualizado en cada venta
- [ ] Alerta visual cuando stock <= stock mínimo
- [ ] Lista de productos bajo stock
- [ ] Movimiento de stock registrado (entrada/salida)

#### RF-11: Entrada de Inventario
**Descripción:** Registrar ingreso de productos (compra a proveedor).

**Datos:**
- Proveedor
- Fecha de compra
- Productos (código, cantidad, precio compra)
- Total de compra
- Comprobante de compra (número)

**Criterios de aceptación:**
- [ ] Actualizar stock de productos
- [ ] Registrar como egreso contable
- [ ] Historial de entradas

#### RF-12: Ajuste de Inventario
**Descripción:** Corregir diferencias de stock.

**Datos:**
- Producto
- Stock actual del sistema
- Stock real
- Diferencia
- Motivo

**Criterios de aceptación:**
- [ ] Solo usuarios autorizados
- [ ] Motivo obligatorio
- [ ] Registro en historial

### 2.4 Módulo Contable

#### RF-13: Registro de Ingresos
**Descripción:** Registrar entradas de dinero.

**Orígenes de ingreso:**
- Venta de productos
- Otros ingresos (especificar concepto)

**Datos por ingreso:**
- Fecha
- Concepto
- Monto
- Forma de pago
- Referencia (número de boleta si aplica)

**Criterios de aceptación:**
- [ ] Ingresos por venta se registran automáticamente
- [ ] Ingresos manuales con validación
- [ ] Listado filtrable por fecha y concepto

#### RF-14: Registro de Egresos
**Descripción:** Registrar salidas de dinero.

**Tipos de egreso:**
- Compra de productos
- Pago de servicios (luz, agua, internet, alquiler)
- Sueldos
- Mantenimiento
- Otros gastos

**Datos por egreso:**
- Fecha
- Tipo de gasto
- Concepto
- Monto
- Comprobante (número)
- Proveedor/beneficiario

**Criterios de aceptación:**
- [ ] Egresos分类ados por tipo
- [ ] Comprobante opcional
- [ ] Filtro por rango de fechas

#### RF-15: Reporte Financiero
**Descripción:** Generar reportes contables.

**Reportes disponibles:**
| Reporte | Descripción |
|---------|-------------|
| Estado de Resultados | Ingresos vs Egresos por período |
| Flujo de Caja | Movimiento de dinero |
| Resumen Diario | Resumen del día de ventas |
| Resumen Mensual | Totales del mes |

**Criterios de aceptación:**
- [ ] Exportar a PDF
- [ ] Exportar a Excel
- [ ] Filtrar por fecha
- [ ] Totales precisos

### 2.5 Módulo de Dashboard y KPIs

#### RF-16: Dashboard Principal
**Descripción:** Panel con métricas clave del negocio.

**KPIs a mostrar:**
| KPI | Descripción | Frecuencia |
|-----|-------------|------------|
| Ventas del día | Total ventas hoy | Tiempo real |
| Ventas del mes | Total ventas mes actual | Tiempo real |
| Ganancias del día | Ingresos - Costos hoy | Tiempo real |
| Margen de ganancia | (Ganancia / Ventas) * 100 | Tiempo real |
| Productos más vendidos | Top 10 productos | Diario |
| Productos bajo stock | Cantidad de items | Tiempo real |
| Ticket promedio | Venta promedio | Tiempo real |

**Criterios de aceptación:**
- [ ] Gráficos visuales (barras, líneas)
- [ ] Datos de hoy y comparación con ayer
- [ ] Actualización en tiempo real

#### RF-17: Gráficos de Ventas
**Descripción:** Visualización gráfica de ventas.

**Gráficos:**
- Ventas por hora (día actual)
- Ventas por día (últimos 7 días)
- Ventas por categoría
- Ventas por forma de pago

**Criterios de aceptación:**
- [ ] Interactivo (hover para detalles)
- [ ] Exportable a imagen

### 2.6 Módulo de Boletas

#### RF-18: Generación de Boleta
**Descripción:** Crear boleta para cada venta.

**Estructura de boleta:**
```
=================================
        MINIMARKET [NOMBRE]
         RUC: XXXXXXXXXX
    Dirección: XXXXXXXXXXXXX
        Tel: XXXXXXXXXXX
=================================
BOLETA N°: 001-000001
Fecha: dd/mm/yyyy hh:mm:ss
---------------------------------
Cant.  Producto      P.Unit  Total
---------------------------------
  2    Gaseosa 2L    S/ 5.50 S/ 11.00
  1    Pan Integral  S/ 3.00 S/  3.00
---------------------------------
              Subtotal: S/ 14.00
            Descuento: S/  0.00
                   IGV: S/  2.52
                 TOTAL: S/ 16.52
---------------------------------
Forma de pago: EFECTIVO
=================================
      ¡Gracias por su compra!
=================================
```

**Criterios de aceptación:**
- [ ] Numeración secuencial automática
- [ ] Formato estándar de boleta
- [ ] Opción de reimpresión
- [ ] Almacenamiento digital de boletas

#### RF-19: Diseño de Boleta
**Descripción:** Personalización del formato de boleta.

**Datos configurables:**
- Nombre del negocio
- RUC
- Dirección
- Teléfono
- Mensaje de agradecimiento

---

## 3. Requerimientos No Funcionales

### 3.1 Rendimiento
| Requisito | Valor |
|-----------|-------|
| Tiempo de respuesta (consultas) | < 500ms |
| Tiempo de respuesta (POS) | < 200ms |
| Arranque de aplicación | < 3 segundos |
| Memoria RAM mínima | 4 GB |

### 3.2 Seguridad
| Requisito | Descripción |
|-----------|-------------|
| RNF-01 | Contraseña para acceso al sistema |
| RNF-02 | Roles de usuario (Administrador, Vendedor) |
| RNF-03 | Registro de auditoría de acciones |
| RNF-04 | Respaldo automático de BD diaria |

### 3.3 Usabilidad
| Requerito | Descripción |
|-----------|-------------|
| RNF-05 | Interfaz intuitiva y fácil de usar |
| RNF-06 | Teclado como método principal en POS |
| RNF-07 | Soporte para lectores de barcode USB |
| RNF-08 | Diseño responsive para diferentes pantallas |

### 3.4 Compatibilidad
| Requisito | Descripción |
|-----------|-------------|
| RNF-09 | Windows 10/11 |
| RNF-10 | Resolución mínima: 1366x768 |
| RNF-11 | Impresoras térmicas estándar (Epson TM-T20) |

### 3.5 Base de Datos
| Requisito | Descripción |
|-----------|-------------|
| RNF-12 | SQLite como motor de BD |
| RNF-13 | Respaldo a archivo .db externo |
| RNF-14 | Capacidad mínima: 100,000 productos |

---

## 4. Estructura de Menú

```
📋 Archivo
   ├── Nueva Venta (Ctrl+N)
   ├── Respaldo de Datos
   ├── Restaurar Datos
   ├── Configuración
   └── Salir (Alt+F4)

📦 Productos
   ├── Registrar Producto (Ctrl+P)
   ├── Lista de Productos
   ├── Categorías
   ├── Proveedores
   └── Importar Productos

💰 Ventas
   ├── Punto de Venta (F1)
   ├── Lista de Ventas
   ├── Anular Venta
   └── Reimprimir Boleta

📊 Inventario
   ├── Stock Actual
   ├── Entrada de Mercadería
   ├── Ajuste de Stock
   └── Productos Bajo Stock

📈 Contabilidad
   ├── Ingresos
   ├── Egresos
   ├── Estado de Resultados
   └── Flujo de Caja

📉 Dashboard
   ├── Panel Principal
   ├── Reporte Diario
   └── Reporte Mensual

⚙️ Sistema
   ├── Usuarios
   ├── Auditoría
   └── Acerca de
```

---

## 5. User Stories

### US-01: Registrar Producto
**Como** Administrador  
**Quiero** registrar un nuevo producto con su código de barras  
**Para** tener el inventario actualizado  

**Criterios de aceptación:**
- Dado que estoy en el formulario de registro de producto
- Cuando ingreso un código de barras ya existente
- Entonces debo ver un mensaje de error "Código de barras ya registrado"

### US-02: Realizar Venta
**Como** Vendedor  
**Quiero** escanear productos para venderlos  
**Para** hacer el proceso de venta rápido  

**Criterios de aceptación:**
- Dado que estoy en el POS
- Cuando escaneo un producto existente
- Entonces debe aparecer en la lista de venta
- Y cuando presiono Enter en la cantidad
- Entonces se agrega a la venta

### US-03: Ver Dashboard
**Como** Administrador  
**Quiero** ver las métricas del negocio  
**Para** tomar decisiones informadas  

**Criterios de aceptación:**
- Dado que estoy en el Dashboard
- Entonces debo ver las ventas del día
- Y las ventas del mes
- Y los productos más vendidos
- Y alertas de stock bajo

### US-04: Registrar Egreso
**Como** Administrador  
**Quiero** registrar un gasto  
**Para** llevar control de mis egresos  

**Criterios de aceptación:**
- Dado que estoy en el módulo de egresos
- Cuando registro un nuevo gasto con tipo, concepto y monto
- Entonces debe guardarse en la base de datos
- Y aparecer en el listado de egresos

---

## 6. Diagrama de Casos de Uso

```
                    ┌─────────────────────────────────────────┐
                    │           SISTEMA POS MINIMARKET         │
                    └─────────────────────────────────────────┘

    ┌──────────┐                    ┌──────────┐
    │ Admin │                    │ Vendedor │
    └──┬───┬───┘                    └──┬───┬───┘
       │   │                           │   │
       │   └──────────┬────────────────┘   │
       │              │                    │
       ▼              ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│                     CASOS DE USO                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐     ┌─────────────────┐            │
│  │ Gestionar       │     │ Punto de Venta   │◄────┐      │
│  │ Productos       │────►│                 │     │      │
│  └─────────────────┘     │ • Escanear      │     │      │
│         │                │ • Agregar       │─────┤      │
│         │                │ • Confirmar     │     │      │
│         │                │ • Cobrar        │     │      │
│         │                │ • Generar Boleta│◄────┤      │
│         │                └─────────────────┘     │      │
│         │                                         │      │
│         ▼                                         │      │
│  ┌─────────────────┐                              │      │
│  │ Gestionar       │                              │      │
│  │ Inventario      │     ┌─────────────────┐      │      │
│  │                 │     │ Generar Boleta  │◄─────┘      │
│  │ • Ver Stock     │     └─────────────────┘             │
│  │ • Ajustar       │                                    │
│  │ • Entrada       │                                    │
│  └─────────────────┘                                    │
│         │                                                │
│         ▼                                                │
│  ┌─────────────────┐                                    │
│  │ Contabilidad    │     ┌─────────────────┐            │
│  │                 │     │ Ver Dashboard   │            │
│  │ • Ingresos      │     │                 │            │
│  │ • Egresos       │     │ • KPIs          │            │
│  │ • Reportes      │     │ • Gráficos      │            │
│  └─────────────────┘     │ • Alertas       │            │
│         │                └─────────────────┘            │
│         ▼                                                │
│  ┌─────────────────┐                                    │
│  │ Configuración   │                                    │
│  │                 │                                    │
│  │ • Datos negocio │                                    │
│  │ • Usuarios      │                                    │
│  │ • Respaldos     │                                    │
│  └─────────────────┘                                    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 7. Matriz de Trazabilidad

| Requisito | Prioridad | Módulo | Estado |
|-----------|-----------|--------|--------|
| RF-01 | Alta | Productos | Pendiente |
| RF-02 | Alta | Productos | Pendiente |
| RF-03 | Alta | Productos | Pendiente |
| RF-04 | Alta | Productos | Pendiente |
| RF-05 | Alta | Productos | Pendiente |
| RF-06 | Alta | POS | Pendiente |
| RF-07 | Media | POS | Pendiente |
| RF-08 | Alta | POS | Pendiente |
| RF-09 | Alta | POS | Pendiente |
| RF-10 | Alta | Inventario | Pendiente |
| RF-11 | Alta | Inventario | Pendiente |
| RF-12 | Media | Inventario | Pendiente |
| RF-13 | Alta | Contabilidad | Pendiente |
| RF-14 | Alta | Contabilidad | Pendiente |
| RF-15 | Media | Contabilidad | Pendiente |
| RF-16 | Media | Dashboard | Pendiente |
| RF-17 | Media | Dashboard | Pendiente |
| RF-18 | Alta | Boletas | Pendiente |
| RF-19 | Baja | Boletas | Pendiente |

---

## 8. Glosario

| Término | Definición |
|---------|------------|
| POS | Point of Sale - Punto de Venta |
| KPI | Key Performance Indicator - Indicador Clave de Desempeño |
| CRUD | Create, Read, Update, Delete - Operaciones básicas |
| Stock | Cantidad de producto disponible |
| SKU | Stock Keeping Unit - Código interno de producto |
| Boleta | Documento comercial simplificado |
| IGV | Impuesto General a las Ventas (18% en Perú) |
| Dashboard | Panel de visualización de métricas |

---

## 9. Anexos

### Anexo A: Formato de Código de Barras
- Sistema: EAN-13 / UPC-A
- Escáner compatible: USB HID

### Anexo B: Especificaciones de Boleta
- Ancho: 80mm
- Impresora: Térmica 80mm
- Copias: 2 (Cliente + Negocio)

---

**Documento creado para: MiniPOS - Sistema POS para Minimarket**
**Última actualización: 23/03/2026**
