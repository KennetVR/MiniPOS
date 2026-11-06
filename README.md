# MiniPOS - Sistema de Punto de Venta para Minimarket

Sistema integral de gestión comercial para minimarket con soporte para código de barras, punto de venta, inventario, contabilidad y dashboard de KPIs.

## Características

- **Gestión de Productos** - Registro con código de barras, categorías y stock
- **Punto de Venta (POS)** - Venta rápida con escaneo y boletas
- **Control de Inventario** - Stock en tiempo real y alertas
- **Contabilidad** - Ingresos, egresos y reportes financieros
- **Dashboard** - KPIs y métricas visuales en tiempo real
- **Generación de Boletas** - Formato estándar con número secuencial

## Requisitos del Sistema

- Windows 10/11 (64-bit)
- 4 GB RAM mínimo
- 500 MB espacio en disco

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [SPEC.md](./SPEC.md) | Especificación de requerimientos funcionales |
| [SPEC_DATOS.md](./SPEC_DATOS.md) | Modelo de datos y estructura de BD |
| [SPEC_ARQUITECTURA.md](./SPEC_ARQUITECTURA.md) | Arquitectura técnica y decisiones |
| [SPEC_WIREFRAMES.md](./SPEC_WIREFRAMES.md) | Wireframes y prototipos de UI |

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | React + TypeScript |
| Backend | Electron (Node.js) |
| Base de Datos | SQLite |
| Estilos | TailwindCSS |
| Estado | Zustand |
| Gráficos | Recharts |

## Instalación (Desarrollo)

```bash
# Clonar repositorio
git clone <repo-url>
cd MiniPOS

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

## Construcción

```bash
# Build para Windows
npm run build
```

Genera: `dist/MiniPOS-Setup-1.0.0.exe`

## Credenciales por Defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| vendedor | vendedor123 | Vendedor |

## Atajos de Teclado (POS)

| Atajo | Acción |
|-------|--------|
| F1 | Abrir POS |
| F2 | Productos |
| F3 | Inventario |
| F5 | Cobrar venta |
| ESC | Cancelar |
| Enter | Confirmar cantidad |
| Delete | Eliminar producto |

## Estructura del Proyecto

```
MiniPOS/
├── src/
│   ├── main/           # Proceso principal Electron
│   ├── renderer/        # Interfaz React
│   └── preload/         # Bridge IPC
├── docs/                # Documentación
├── SPEC*.md             # Especificaciones
└── resources/           # Recursos estáticos
```

## Licencia

MIT
