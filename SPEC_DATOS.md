# SPEC_DATOS - Modelo de Datos
## Sistema POS para Minimarket

> **Versión:** 1.0  
> **Fecha:** 23 de Marzo de 2026  
> **Proyecto:** MiniPOS  

---

## 1. Diagrama ER (Entidad-Relación)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    CATEGORIA     │       │    PROVEEDOR    │       │      USUARIO    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id_categoria │──┐    │ PK id_proveedor │──┐    │ PK id_usuario   │
│    nombre       │  │    │    nombre       │  │    │    username     │
│    descripcion  │  │    │    ruc          │  │    │    password     │
│    estado       │  │    │    telefono     │  │    │    nombre       │
└─────────────────┘  │    │    direccion    │  │    │    rol          │
       │            │    │    email        │  │    │    estado       │
       │            │    │    estado       │  │    │    created_at   │
       │            │    └─────────────────┘  │    └─────────────────┘
       │            │           │                    │
       │            │           │                    │
       ▼            │           ▼                    │
┌─────────────────────────────────────────────────────────┐
│                      PRODUCTO                           │
├─────────────────────────────────────────────────────────┤
│ PK id_producto                                          │
│    codigo_barras                                        │
│    nombre                                               │
│    descripcion                                          │
│ FK id_categoria ──────────────┘                         │
│    precio_compra                                        │
│    precio_venta                                          │
│    stock_actual                                         │
│    stock_minimo                                         │
│ FK id_proveedor ──────────────┘                         │
│    imagen                                               │
│    estado                                               │
│    created_at                                           │
│    updated_at                                           │
└─────────────────────────────────────────────────────────┘
       │
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                   DETALLE_VENTA                         │
├─────────────────────────────────────────────────────────┤
│ PK id_detalle_venta                                     │
│ FK id_venta ─────────────────────────────────────┐     │
│ FK id_producto ───────────────────────────────────┘     │
│    cantidad                                             │
│    precio_unitario                                      │
│    descuento                                            │
│    subtotal                                             │
└─────────────────────────────────────────────────────────┘
       │
       ▲
       │
┌─────────────────────────────────────────────────────────┐
│                       VENTA                             │
├─────────────────────────────────────────────────────────┤
│ PK id_venta                                             │
│ FK id_usuario ─────────────────────────────────────┐   │
│    numero_boleta                                        │
│    subtotal                                            │
│    descuento                                           │
│    igv                                                 │
│    total                                               │
│    forma_pago                                           │
│    estado (completada/anulada)                          │
│    motivo_anulacion                                     │
│    fecha_anulacion                                     │
│    created_at                                          │
└─────────────────────────────────────────────────────────┘
       │
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                      INGRESO                            │
├─────────────────────────────────────────────────────────┤
│ PK id_ingreso                                           │
│    fecha                                               │
│    concepto                                            │
│    monto                                               │
│    forma_pago                                           │
│    referencia                                           │
│ FK id_usuario ─────────────────────────────────────┐   │
│ FK id_venta (nullable) ───────────────────────────┘     │
│    created_at                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      EGRESO                             │
├─────────────────────────────────────────────────────────┤
│ PK id_egreso                                            │
│    fecha                                               │
│    tipo (compra/servicio/sueldo/mantenimiento/otro)     │
│    concepto                                            │
│    monto                                               │
│    comprobante                                         │
│    beneficiario                                        │
│ FK id_usuario ─────────────────────────────────────┐   │
│ FK id_proveedor (nullable)                            │   │
│    created_at                                          │
└─────────────────────────────────────────────────────────┘
       ▲
       │
┌─────────────────────────────────────────────────────────┐
│                  ENTRADA_INVENTARIO                     │
├─────────────────────────────────────────────────────────┤
│ PK id_entrada                                           │
│ FK id_proveedor                                        │
│    fecha_compra                                        │
│    numero_comprobante                                   │
│    total                                               │
│    estado                                              │
│ FK id_usuario                                          │
│    created_at                                          │
└─────────────────────────────────────────────────────────┘
       │
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                  DETALLE_ENTRADA                        │
├─────────────────────────────────────────────────────────┤
│ PK id_detalle_entrada                                   │
│ FK id_entrada                                          │
│ FK id_producto                                         │
│    cantidad                                            │
│    precio_compra                                       │
│    subtotal                                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 MOVIMIENTO_STOCK                        │
├─────────────────────────────────────────────────────────┤
│ PK id_movimiento                                        │
│ FK id_producto                                         │
│    tipo (entrada/salida/ajuste)                         │
│    cantidad                                            │
│    stock_anterior                                      │
│    stock_nuevo                                         │
│    motivo                                              │
│ FK id_usuario                                          │
│    referencia                                          │
│    created_at                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     AUDITORIA                           │
├─────────────────────────────────────────────────────────┤
│ PK id_auditoria                                         │
│ FK id_usuario                                          │
│    accion (crear/actualizar/eliminar)                   │
│    tabla                                               │
│    registro_id                                         │
│    datos_anteriores                                    │
│    datos_nuevos                                        │
│    ip_address                                          │
│    created_at                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    CONFIGURACION                        │
├─────────────────────────────────────────────────────────┤
│ PK clave                                               │
│    valor                                               │
│    descripcion                                         │
│    updated_at                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Definición de Tablas

### 2.1 Tabla: categoria

```sql
CREATE TABLE categoria (
    id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categoria (nombre, descripcion) VALUES
    ('Bebidas', 'Bebidas en general'),
    ('Abarrotes', 'Productos de despensa'),
    ('Golosinas', 'Dulces y snacks'),
    ('Limpieza', 'Productos de limpieza'),
    ('Frutas/Verduras', 'Productos frescos'),
    ('Lacteos', 'Productos lácteos'),
    ('Panadería', 'Pan y derivados'),
    ('Otros', 'Productos misceláneos');
```

### 2.2 Tabla: proveedor

```sql
CREATE TABLE proveedor (
    id_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    ruc VARCHAR(11),
    telefono VARCHAR(20),
    direccion TEXT,
    email VARCHAR(100),
    estado BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 Tabla: usuario

```sql
CREATE TABLE usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'vendedor',
    estado BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rol CHECK (rol IN ('administrador', 'vendedor'))
);

INSERT INTO usuario (username, password, nombre, rol) VALUES
    ('admin', 'admin123', 'Administrador', 'administrador'),
    ('vendedor', 'vendedor123', 'Vendedor', 'vendedor');
```

### 2.4 Tabla: producto

```sql
CREATE TABLE producto (
    id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_categoria INTEGER NOT NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    id_proveedor INTEGER,
    imagen BLOB,
    estado BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    CONSTRAINT chk_precio CHECK (precio_venta >= precio_compra)
);
```

### 2.5 Tabla: venta

```sql
CREATE TABLE venta (
    id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_boleta VARCHAR(20) NOT NULL UNIQUE,
    id_usuario INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    forma_pago VARCHAR(30) NOT NULL,
    estado VARCHAR(20) DEFAULT 'completada',
    motivo_anulacion TEXT,
    fecha_anulacion DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT chk_estado CHECK (estado IN ('completada', 'anulada'))
);

CREATE INDEX idx_venta_fecha ON venta(created_at);
CREATE INDEX idx_venta_numero ON venta(numero_boleta);
```

### 2.6 Tabla: detalle_venta

```sql
CREATE TABLE detalle_venta (
    id_detalle_venta INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);
```

### 2.7 Tabla: ingreso

```sql
CREATE TABLE ingreso (
    id_ingreso INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    forma_pago VARCHAR(30),
    referencia VARCHAR(100),
    id_venta INTEGER,
    id_usuario INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE INDEX idx_ingreso_fecha ON ingreso(fecha);
```

### 2.8 Tabla: egreso

```sql
CREATE TABLE egreso (
    id_egreso INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    comprobante VARCHAR(50),
    beneficiario VARCHAR(100),
    id_proveedor INTEGER,
    id_usuario INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT chk_tipo CHECK (tipo IN ('compra', 'servicio', 'sueldo', 'mantenimiento', 'otro'))
);

CREATE INDEX idx_egreso_fecha ON egreso(fecha);
CREATE INDEX idx_egreso_tipo ON egreso(tipo);
```

### 2.9 Tabla: entrada_inventario

```sql
CREATE TABLE entrada_inventario (
    id_entrada INTEGER PRIMARY KEY AUTOINCREMENT,
    id_proveedor INTEGER NOT NULL,
    fecha_compra DATE NOT NULL,
    numero_comprobante VARCHAR(50),
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'completada',
    id_usuario INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);
```

### 2.10 Tabla: detalle_entrada

```sql
CREATE TABLE detalle_entrada (
    id_detalle_entrada INTEGER PRIMARY KEY AUTOINCREMENT,
    id_entrada INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_entrada) REFERENCES entrada_inventario(id_entrada) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);
```

### 2.11 Tabla: movimiento_stock

```sql
CREATE TABLE movimiento_stock (
    id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    motivo VARCHAR(200),
    referencia VARCHAR(100),
    id_usuario INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT chk_tipo_mov CHECK (tipo IN ('entrada', 'salida', 'ajuste'))
);

CREATE INDEX idx_movimiento_fecha ON movimiento_stock(created_at);
```

### 2.12 Tabla: auditoria

```sql
CREATE TABLE auditoria (
    id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER,
    accion VARCHAR(20) NOT NULL,
    tabla VARCHAR(50) NOT NULL,
    registro_id INTEGER,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE INDEX idx_auditoria_tabla ON auditoria(tabla, registro_id);
```

### 2.13 Tabla: configuracion

```sql
CREATE TABLE configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor TEXT,
    descripcion VARCHAR(200),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO configuracion (clave, valor, descripcion) VALUES
    ('nombre_negocio', 'MI MINIMARKET', 'Nombre del negocio'),
    ('ruc', '12345678901', 'RUC del negocio'),
    ('direccion', 'Av. Principal 123', 'Dirección del negocio'),
    ('telefono', '999-999-999', 'Teléfono del negocio'),
    ('mensaje_boleta', '¡Gracias por su compra!', 'Mensaje en boleta'),
    ('igv_porcentaje', '18', 'Porcentaje de IGV'),
    ('iva_porcentaje', '0', 'Porcentaje de IVA (0 si no aplica)'),
    ('moneda', 'S/', 'Símbolo de moneda'),
    ('nombre_moneda', 'SOLES', 'Nombre de la moneda'),
    ('decimales', '2', 'Cantidad de decimales'),
    ('formato_fecha', 'dd/mm/yyyy', 'Formato de fecha'),
    ('stock_minimo_default', '5', 'Stock mínimo por defecto'),
    ('max_descuento', '50', 'Descuento máximo en porcentaje');
```

---

## 3. Triggers y Procedimientos

### 3.1 Trigger: Actualizar stock al vender

```sql
CREATE TRIGGER trg_actualizar_stock_venta
AFTER INSERT ON detalle_venta
BEGIN
    UPDATE producto 
    SET stock_actual = stock_actual - NEW.cantidad,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_producto = NEW.id_producto;
END;
```

### 3.2 Trigger: Revertir stock al anular

```sql
CREATE TRIGGER trg_revertir_stock_anulacion
AFTER UPDATE ON venta
WHEN NEW.estado = 'anulada' AND OLD.estado = 'completada'
BEGIN
    UPDATE producto 
    SET stock_actual = stock_actual + (
        SELECT COALESCE(SUM(cantidad), 0) 
        FROM detalle_venta 
        WHERE id_venta = NEW.id_venta
    )
    WHERE id_producto IN (
        SELECT id_producto FROM detalle_venta WHERE id_venta = NEW.id_venta
    );
END;
```

### 3.3 Trigger: Registrar movimiento de stock

```sql
CREATE TRIGGER trg_movimiento_stock_venta
AFTER INSERT ON detalle_venta
WHEN (SELECT estado FROM venta WHERE id_venta = NEW.id_venta) = 'completada'
BEGIN
    INSERT INTO movimiento_stock (id_producto, tipo, cantidad, stock_anterior, stock_nuevo, referencia, id_usuario)
    SELECT 
        NEW.id_producto,
        'salida',
        NEW.cantidad,
        (SELECT stock_actual FROM producto WHERE id_producto = NEW.id_producto) + NEW.cantidad,
        (SELECT stock_actual FROM producto WHERE id_producto = NEW.id_producto),
        'Venta N° ' || (SELECT numero_boleta FROM venta WHERE id_venta = NEW.id_venta),
        (SELECT id_usuario FROM venta WHERE id_venta = NEW.id_venta);
END;
```

### 3.4 Función: Generar número de boleta

```sql
CREATE FUNCTION fn_generar_numero_boleta()
RETURNS TEXT AS $$
DECLARE
    anno TEXT;
    correlativo INTEGER;
    numero TEXT;
BEGIN
    anno := strftime('%Y', 'now');
    
    SELECT COALESCE(MAX(CAST(SUBSTR(numero_boleta, 5) AS INTEGER)), 0) + 1
    INTO correlativo
    FROM venta
    WHERE SUBSTR(numero_boleta, 1, 4) = anno;
    
    RETURN anno || '-' || LPAD(correlativo::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Índices Adicionales

```sql
-- Índices para productos
CREATE INDEX idx_producto_codigo ON producto(codigo_barras);
CREATE INDEX idx_producto_nombre ON producto(nombre);
CREATE INDEX idx_producto_categoria ON producto(id_categoria);
CREATE INDEX idx_producto_stock ON producto(stock_actual);

-- Índices para ventas
CREATE INDEX idx_venta_usuario ON venta(id_usuario);
CREATE INDEX idx_venta_estado ON venta(estado);

-- Índice compuesto para reportes
CREATE INDEX idx_venta_fecha_estado ON venta(created_at, estado);
```

---

## 5. Relaciones Resumen

| Tabla Hija | Tabla Padre | Tipo de Relación |
|------------|-------------|------------------|
| producto | categoria | N:1 |
| producto | proveedor | N:1 |
| venta | usuario | N:1 |
| detalle_venta | venta | N:1 |
| detalle_venta | producto | N:1 |
| ingreso | usuario | N:1 |
| ingreso | venta | N:1 |
| egreso | usuario | N:1 |
| egreso | proveedor | N:1 |
| entrada_inventario | proveedor | N:1 |
| entrada_inventario | usuario | N:1 |
| detalle_entrada | entrada_inventario | N:1 |
| detalle_entrada | producto | N:1 |
| movimiento_stock | producto | N:1 |
| movimiento_stock | usuario | N:1 |
| auditoria | usuario | N:1 |

---

**Última actualización: 23/03/2026**
