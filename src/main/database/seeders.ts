import type { Database } from 'better-sqlite3'

export function runSeeders(db: Database): void {
  const categoriaCount = db.prepare('SELECT COUNT(*) as count FROM categoria').get() as { count: number }
  if (categoriaCount.count === 0) {
    const insertCategoria = db.prepare('INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)')
    const categorias = [
      ['Bebidas', 'Bebidas en general'],
      ['Abarrotes', 'Productos de despensa'],
      ['Golosinas', 'Dulces y snacks'],
      ['Limpieza', 'Productos de limpieza'],
      ['Frutas/Verduras', 'Productos frescos'],
      ['Lacteos', 'Productos lácteos'],
      ['Panadería', 'Pan y derivados'],
      ['Otros', 'Productos misceláneos']
    ]
    const insertMany = db.transaction((cats: string[][]) => {
      for (const cat of cats) {
        insertCategoria.run(cat[0], cat[1])
      }
    })
    insertMany(categorias)
    console.log('Categorías creadas')
  }

  const configCount = db.prepare('SELECT COUNT(*) as count FROM configuracion').get() as { count: number }
  if (configCount.count === 0) {
    const insertConfig = db.prepare('INSERT INTO configuracion (clave, valor, descripcion) VALUES (?, ?, ?)')
    const configs = [
      ['nombre_negocio', 'MI MINIMARKET', 'Nombre del negocio'],
      ['ruc', '12345678901', 'RUC del negocio'],
      ['direccion', 'Av. Principal 123', 'Dirección del negocio'],
      ['telefono', '999-999-999', 'Teléfono del negocio'],
      ['mensaje_boleta', '¡Gracias por su compra!', 'Mensaje en boleta'],
      ['igv_porcentaje', '18', 'Porcentaje de IGV'],
      ['moneda', 'S/', 'Símbolo de moneda'],
      ['nombre_moneda', 'SOLES', 'Nombre de la moneda'],
      ['decimales', '2', 'Cantidad de decimales'],
      ['stock_minimo_default', '5', 'Stock mínimo por defecto'],
      ['max_descuento', '50', 'Descuento máximo en porcentaje']
    ]
    const insertMany = db.transaction((configs: string[][]) => {
      for (const config of configs) {
        insertConfig.run(config[0], config[1], config[2])
      }
    })
    insertMany(configs)
    console.log('Configuraciones creadas')
  }
}
