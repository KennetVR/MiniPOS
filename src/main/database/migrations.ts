import type { Database } from 'better-sqlite3'

export function runMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categoria (
      id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre VARCHAR(50) NOT NULL UNIQUE,
      descripcion TEXT,
      estado BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS proveedor (
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

    CREATE TABLE IF NOT EXISTS usuario (
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

    CREATE TABLE IF NOT EXISTS producto (
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
      FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
    );

    CREATE TABLE IF NOT EXISTS venta (
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
      FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    );

    CREATE TABLE IF NOT EXISTS detalle_venta (
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

    CREATE TABLE IF NOT EXISTS ingreso (
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

    CREATE TABLE IF NOT EXISTS egreso (
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
      FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    );

    CREATE TABLE IF NOT EXISTS entrada_inventario (
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

    CREATE TABLE IF NOT EXISTS detalle_entrada (
      id_detalle_entrada INTEGER PRIMARY KEY AUTOINCREMENT,
      id_entrada INTEGER NOT NULL,
      id_producto INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_compra DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (id_entrada) REFERENCES entrada_inventario(id_entrada) ON DELETE CASCADE,
      FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    );

    CREATE TABLE IF NOT EXISTS movimiento_stock (
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
      FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    );

    CREATE TABLE IF NOT EXISTS auditoria (
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

    CREATE TABLE IF NOT EXISTS configuracion (
      clave VARCHAR(50) PRIMARY KEY,
      valor TEXT,
      descripcion VARCHAR(200),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_producto_codigo ON producto(codigo_barras);
    CREATE INDEX IF NOT EXISTS idx_producto_nombre ON producto(nombre);
    CREATE INDEX IF NOT EXISTS idx_venta_fecha ON venta(created_at);
    CREATE INDEX IF NOT EXISTS idx_venta_numero ON venta(numero_boleta);
  `)
}
