# SPEC_ARQUITECTURA - Arquitectura y Decisiones Técnicas
## Sistema POS para Minimarket

> **Versión:** 1.0  
> **Fecha:** 23 de Marzo de 2026  
> **Proyecto:** MiniPOS  

---

## 1. Decisión de Tecnología

### 1.1 Stack Recomendado

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | Electron + React + TailwindCSS | Experiencia moderna, componentización |
| **Backend** | Electron (Node.js integrado) | Lógica de negocio centralizada |
| **Base de Datos** | SQLite (better-sqlite3) | Ligero, portable, sin servidor |
| **UI Components** | shadcn/ui | Componentes modernos y accesibles |
| **Charts** | Recharts | Gráficos ligeros para dashboard |
| **Print** | electron-print / node-thermal-printer | Impresión de boletas |

### 1.2 Alternativas Consideradas

| Opción | Pros | Contras |
|--------|------|---------|
| **Tauri + React** | Más rápido, binario más pequeño | Curva de aprendizaje Rust |
| **.NET WPF** | Nativo Windows, robusto | Solo Windows, curva aprendizaje C# |
| **Python + PyQt** | Rápido desarrollo | Menor rendimiento, UI menos moderna |

### 1.3 Selección Final

**Electron + React + SQLite** fue seleccionado porque:
- Desarrollo rápido con React
- Excelente soporte para impresoras térmicas
- Distribución sencilla para Windows
- Comunidad grande y documentación abundante
- SQLite ideal para single-store

---

## 2. Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Login   │ │   POS    │ │Dashboard │ │  Forms   │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       └────────────┴────────────┴────────────┘             │
│                           │                                  │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    BUSINESS LAYER                           │
│                           │                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Services   │ │ Validators  │ │  Reports    │           │
│  │             │ │             │ │  Generator  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      DATA LAYER                             │
│                           │                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Queries    │ │ Transactions│ │   Migrations│           │
│  └──────┬──────┘ └─────────────┘ └─────────────┘           │
│         │                                                  │
└─────────┼──────────────────────────────────────────────────┘
          │
┌─────────┼──────────────────────────────────────────────────┐
│         │            DATABASE (SQLite)                     │
│         ▼                                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │  producto │ venta │ usuario │ configuracion    │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura de Proyecto

```
MiniPOS/
├── src/
│   ├── main/                    # Proceso principal Electron
│   │   ├── index.ts            # Entry point
│   │   ├── ipc/                 # handlers IPC
│   │   │   ├── producto.ts
│   │   │   ├── venta.ts
│   │   │   ├── usuario.ts
│   │   │   └── reporte.ts
│   │   ├── database/
│   │   │   ├── connection.ts   # SQLite connection
│   │   │   ├── migrations/     # Migraciones
│   │   │   └── seeders/        # Datos iniciales
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── backup.ts
│   │
│   ├── renderer/                # Proceso de renderizado
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Componentes base (shadcn)
│   │   │   ├── layout/         # Header, Sidebar, etc
│   │   │   └── forms/          # Formularios
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── POS.tsx
│   │   │   ├── Productos/
│   │   │   │   ├── Lista.tsx
│   │   │   │   └── Form.tsx
│   │   │   ├── Inventario/
│   │   │   ├── Contabilidad/
│   │   │   └── Configuracion/
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/
│   │   │   ├── api.ts          # Llamadas IPC
│   │   │   ├── utils.ts
│   │   │   └── formatters.ts
│   │   ├── stores/             # Estado global (Zustand)
│   │   │   ├── authStore.ts
│   │   │   ├── cartStore.ts
│   │   │   └── configStore.ts
│   │   └── styles/
│   │       └── globals.css
│   │
│   └── preload/
│       └── index.ts            # bridge IPC
│
├── resources/                   # Recursos estáticos
│   ├── icons/
│   └── printer-templates/
│
├── electron-builder.yml         # Config build
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 4. Flujo de Datos

### 4.1 Flujo de Venta
```
[Escáner/Teclado]
       │
       ▼
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │ POS.tsx │────►│cartStore│────►│Venta IPC│
  └─────────┘     └─────────┘     └────┬────┘
       │                               │
       │                               ▼
       │                        ┌─────────────┐
       │                        │venta.service│
       │                        └──────┬──────┘
       │                               │
       ▼                               ▼
  ┌─────────────────┐         ┌─────────────┐
  │  Actualizar UI  │◄────────│  SQLite DB  │
  └─────────────────┘         └─────────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │ Generar PDF │
                               │  (Boleta)   │
                               └─────────────┘
```

### 4.2 Flujo de Autenticación
```
[Login Form]
    │
    ▼
┌──────────┐
│ Validar  │─── Error ───► Mostrar mensaje
└────┬─────┘
     │ OK
     ▼
┌──────────┐
│Verificar │
│hash Bcrypt│
└────┬─────┘
     │
     ▼
┌──────────┐
│Generar   │
│JWT Token │
└────┬─────┘
     │
     ▼
┌──────────┐     ┌──────────┐
│Guardar   │────►│Redirec.  │
│en Store  │     │Dashboard │
└──────────┘     └──────────┘
```

---

## 5. Modelo de Configuración

### 5.1 Variables de Entorno

```env
# Database
DB_PATH=./data/minipos.db

# Server
PORT=3000

# Security
JWT_SECRET=your-secret-key-here
SESSION_TIMEOUT=8h

# Print
DEFAULT_PRINTER=Ticket Printer
PAPER_WIDTH=80

# Backup
AUTO_BACKUP=true
BACKUP_INTERVAL=24h
BACKUP_PATH=./backups
```

### 5.2 Configuración de Impresora

```typescript
interface PrinterConfig {
  name: string;
  width: 80 | 58; // mm
  encoding: 'UTF-8' | 'ISO-8859-1';
  cutAfterPrint: boolean;
  cashDrawerPole: boolean;
}
```

---

## 6. Consideraciones de Seguridad

### 6.1 Autenticación
- Contraseñas hasheadas con bcrypt (12 rounds)
- JWT para sesiones
- Timeout automático de 8 horas

### 6.2 Autorización por Roles
| Acción | Administrador | Vendedor |
|--------|:-------------:|:--------:|
| Gestionar productos | ✓ | ✗ |
| Ver dashboard | ✓ | ✓ |
| Realizar ventas | ✓ | ✓ |
| Anular ventas | ✓ | ✗ |
| Gestionar usuarios | ✓ | ✗ |
| Ver reportes financieros | ✓ | ✗ |
| Configuración | ✓ | ✗ |
| Respaldar datos | ✓ | ✗ |

### 6.3 Auditoría
- Todas las operaciones CRUD registradas
- Logs de acceso con IP y timestamp
- Retención: 1 año

---

## 7. Rendimiento

### 7.1 Objetivos
| Métrica | Target |
|---------|--------|
| TTFB (Time To First Byte) | < 100ms |
| Full render POS | < 200ms |
| Búsqueda de producto | < 50ms |
| Guardar venta | < 300ms |
| Arranque frío | < 3s |

### 7.2 Estrategias
- **Indexación**: Índices en campos de búsqueda frecuente
- **Lazy loading**: Carga diferida de páginas
- **Caché**: Estado local con Zustand
- **Virtualización**: Listas grandes con react-window

---

## 8. Backup y Recuperación

### 8.1 Estrategia de Backup
| Tipo | Frecuencia | Retención |
|------|------------|-----------|
| Automático | Diario (a las 23:59) | 7 días |
| Manual | Bajo demanda | Indefinido |
| Exportación | Mensual | Indefinido |

### 8.2 Proceso de Recovery
1. Cerrar aplicación
2. Copiar archivo .db de backup
3. Renombrar a minipos.db
4. Reiniciar aplicación
5. Verificar integridad

---

## 9. Despliegue

### 9.1 Build para Windows
```bash
npm run build
# Genera: dist/MiniPOS-Setup-1.0.0.exe
```

### 9.2 Requisitos de Instalación
- Windows 10/11 (64-bit)
- 4 GB RAM mínimo
- 500 MB espacio en disco
- .NET Framework 4.7.2+ (incluido en installer)

---

**Última actualización: 23/03/2026**
