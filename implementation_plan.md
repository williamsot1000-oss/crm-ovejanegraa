# CRM Cafetería "Oveja Negra" — Plan de Implementación

Aplicación web CRM completa para la gestión integral de la cafetería "Oveja Negra". Incluye gestión de clientes, productos, ventas, reservaciones, promociones, proveedores e inventario, con un dashboard analítico y diseño profesional temático de cafetería.

## Arquitectura Propuesta

**Stack tecnológico:**
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla (sin frameworks pesados)
- **Base de datos**: **Supabase** (PostgreSQL gestionado + API REST automática)
- **Hosting**: **Vercel** (deploy estático con configuración optimizada)
- **Gráficos**: Chart.js (CDN) para estadísticas y visualizaciones
- **Calendario**: FullCalendar (CDN) para la agenda de reservaciones
- **Iconos**: Lucide Icons (CDN) para iconografía minimalista
- **Fuentes**: Google Fonts (Inter + Playfair Display)

> [!IMPORTANT]
> **Supabase** proporciona una base de datos PostgreSQL en la nube con API REST auto-generada, autenticación y Row Level Security. Los datos se persisten en la nube y son accesibles desde cualquier dispositivo.

> [!NOTE]
> **Vercel** se usará para alojar los archivos estáticos (HTML/CSS/JS). La comunicación con Supabase se hace directamente desde el frontend usando el SDK `@supabase/supabase-js`.

## Paleta de Colores y Diseño

| Elemento | Color | Uso |
|----------|-------|-----|
| Primary | `#2C1810` | Marrón oscuro café — headers, sidebar |
| Secondary | `#8B5E3C` | Marrón medio — acentos, botones |
| Accent | `#D4A574` | Beige dorado — highlights, hover |
| Background | `#FBF7F4` | Crema suave — fondo principal |
| Surface | `#FFFFFF` | Blanco — tarjetas y paneles |
| Success | `#4CAF50` | Verde — estados positivos |
| Warning | `#FF9800` | Naranja — alertas stock |
| Danger | `#E53935` | Rojo — eliminaciones, errores |

- Tipografía: Inter (sans-serif) para UI, Playfair Display (serif) para títulos decorativos
- Bordes redondeados, sombras suaves, transiciones animadas
- Logo/branding con ícono de oveja + café

## Proposed Changes

### Estructura de Archivos

```
C:\Users\ASUS\.gemini\antigravity\scratch\oveja-negra-crm\
├── index.html              # Aplicación principal (SPA)
├── vercel.json             # Configuración de deploy en Vercel
├── css/
│   └── styles.css          # Estilos completos
├── js/
│   ├── app.js              # Controlador principal, router SPA
│   ├── supabase.js         # Cliente Supabase + operaciones CRUD
│   ├── dashboard.js        # Módulo Dashboard
│   ├── clientes.js         # Módulo Clientes
│   ├── productos.js        # Módulo Productos
│   ├── ventas.js           # Módulo Ventas
│   ├── reservaciones.js    # Módulo Reservaciones
│   ├── promociones.js      # Módulo Promociones
│   ├── proveedores.js      # Módulo Proveedores
│   └── inventario.js       # Módulo Inventario
├── sql/
│   ├── schema.sql          # Esquema completo de la base de datos
│   └── seed.sql            # Datos semilla para demo
└── assets/
    └── logo.svg            # Logo de Oveja Negra
```

---

### Módulo 0: Base de Datos Supabase (`sql/`)

#### [NEW] `sql/schema.sql`
Esquema PostgreSQL completo con las siguientes tablas:

```sql
-- Tablas principales
clientes          -- 20 campos: id, nombres, fecha_nacimiento, genero, cedula, email, celular, red_social, ciudad, direccion, ocupacion, tipo_cliente, producto_favorito, gasto_acumulado, frecuencia_compra, num_compras, preferencia_horario, nivel_fidelizacion, observaciones, preferencia_consumo
productos         -- 8 campos: id, tipo_producto, nombre, codigo, precio, disponible, imagen_url, stock_actual, mas_vendido
ventas            -- 15 campos: id, codigo_pedido, cliente_id (FK), fecha_pedido, producto_id (FK), promocion_id (FK), estado, reservacion_id (FK), metodo_pago, subtotal, descuento, total, cantidad, banco, impuesto, cantidad_facturar
reservaciones     -- 12 campos: id, cliente_id (FK), nombre_cliente, fecha, hora, num_personas, mesa, motivo, estado, observaciones, created_at, canal
promociones       -- 7 campos: id, nombre, descripcion, tipo_promocion, descuento, producto_id (FK), activa
proveedores       -- 12 campos: id, nombre, ruc, email, contacto, ciudad, direccion, descuentos, estado, cantidad_producto, fecha, total_pagar, metodo_pago
inventario        -- 9 campos: id, nombre, categoria, stock_actual, stock_minimo, stock_maximo, costo_unitario, total, estado
```

- Foreign keys entre `ventas` ↔ `clientes`, `ventas` ↔ `productos`, `ventas` ↔ `promociones`, `reservaciones` ↔ `clientes`, `promociones` ↔ `productos`
- Triggers automáticos para `updated_at`
- Índices en campos de búsqueda frecuente
- Row Level Security (RLS) habilitado con políticas públicas para el CRM (sin autenticación de usuario requerida inicialmente)

#### [NEW] `sql/seed.sql`
- ~15 clientes de ejemplo con datos realistas
- ~20 productos de cafetería (cafés, bebidas frías, postres, snacks, desayunos)
- ~30 ventas con diferentes estados y fechas recientes
- ~10 reservaciones próximas
- ~5 promociones activas
- ~8 proveedores
- ~15 insumos de inventario con variados niveles de stock

---

### Módulo 1: Configuración Supabase + Vercel

#### [NEW] `js/supabase.js`
- Inicialización del cliente Supabase con `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- Variables configurables al inicio del archivo (el usuario ingresa sus credenciales)
- Clase `DB` con métodos CRUD genéricos:
  - `getAll(tabla, filtros)` → `supabase.from(tabla).select('*')`
  - `getById(tabla, id)` → `.select().eq('id', id).single()`
  - `create(tabla, datos)` → `.insert(datos)`
  - `update(tabla, id, datos)` → `.update(datos).eq('id', id)`
  - `delete(tabla, id)` → `.delete().eq('id', id)`
  - `search(tabla, campo, valor)` → `.ilike(campo, '%valor%')`
  - `query(tabla, queryFn)` → consultas personalizadas con joins
- Manejo de errores centralizado con notificaciones toast

#### [NEW] `vercel.json`
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=3600" }
      ]
    }
  ]
}
```

---

### Módulo 2: Estructura Base (`index.html` + `styles.css` + `app.js`)

#### [NEW] `index.html`
- Layout SPA con sidebar de navegación colapsable
- Área de contenido principal dinámica
- Header con búsqueda global y notificaciones de stock bajo
- Sidebar con logo, menú de navegación con iconos y sección activa resaltada
- Responsive: sidebar se convierte en menú hamburguesa en móvil
- CDN imports: Chart.js, FullCalendar, Lucide Icons, Google Fonts, **Supabase JS**

#### [NEW] `css/styles.css`
- Sistema de diseño con CSS Custom Properties
- Grid layout responsive (sidebar + contenido)
- Componentes reutilizables: tarjetas KPI, tablas, formularios, modales, badges, alertas
- Animaciones y transiciones suaves
- Media queries para tablet y móvil
- Tema visual cafetería con colores cálidos

#### [NEW] `js/app.js`
- Router SPA basado en hash (`#dashboard`, `#clientes`, etc.)
- Controlador de navegación y estado activo del sidebar
- Sistema de modales y notificaciones toast
- Funciones de utilidad compartidas (formateo de moneda, fechas, etc.)
- Carga inicial: verificar conexión con Supabase y mostrar estado

---

### Módulo 3: Dashboard (`dashboard.js`)

#### [NEW] `js/dashboard.js`
- **6 tarjetas KPI** con iconos: Total clientes, Total productos, Ventas realizadas, Reservaciones, Pedidos pendientes, Tareas pendientes
- **Gráfico de barras**: Ventas del día, semana y mes
- **Gráfico de dona**: Productos más vendidos (top 5)
- **Gráfico de línea**: Tendencia de ventas últimos 7 días
- **Tabla**: Clientes frecuentes (top 5 por número de compras)
- **Lista**: Productos con stock bajo (alerta visual)
- **Lista**: Próximas reservaciones (próximas 5)
- Todos los datos consultados dinámicamente desde Supabase

---

### Módulo 4: Clientes (`clientes.js`)

#### [NEW] `js/clientes.js`
- **Vista de tabla** con todos los 20 campos especificados
- **CRUD completo**: Crear (modal con formulario), Editar, Eliminar (con confirmación)
- **Búsqueda** por nombre, cédula, email, celular
- **Filtros** por tipo de cliente, nivel de fidelización, ciudad
- **Detalle de cliente** con vista de perfil expandida
- Badges de colores para niveles de fidelización (Normal→gris, Frecuente→azul, Fidelizado→dorado, VIP→morado)
- Cálculo automático de gasto acumulado y frecuencia de compra

---

### Módulo 5: Productos (`productos.js`)

#### [NEW] `js/productos.js`
- **Vista de tarjetas** (grid) con imagen, nombre, precio, stock y categoría
- **Vista de tabla** alternativa
- **CRUD completo** con formulario modal
- **Categorías**: Cafés, Bebidas frías, Postres, Snacks, Desayunos, etc.
- Indicadores visuales de stock (verde/amarillo/rojo)
- Badge de "Más vendido" automático
- **Búsqueda** por nombre, código, categoría

---

### Módulo 6: Ventas (`ventas.js`)

#### [NEW] `js/ventas.js`
- **Registro de venta** con formulario completo (16 campos)
- Selección de cliente y producto desde Supabase (select con búsqueda)
- Cálculo automático de subtotal, impuestos, descuentos y total
- **Estados** con badges de colores: Pendiente (amarillo), Confirmado (azul), Preparado (naranja), Entregado (verde), Cancelado (rojo)
- **Vista de tabla** con filtros por estado, fecha, cliente
- **Resumen** de ventas por período

---

### Módulo 7: Reservaciones (`reservaciones.js`)

#### [NEW] `js/reservaciones.js`
- **Vista de calendario** (FullCalendar) con reservaciones como eventos coloreados por estado
- **Vista de lista/tabla** alternativa
- **CRUD completo** con formulario modal
- **Estados** con colores: Solicitada, Confirmada, En espera, Atendida, Cancelada, No asistió
- Selección de mesa con disponibilidad visual
- **Canal de reservación**: Teléfono, WhatsApp, Instagram, Presencial, Web
- Integración con datos de clientes existentes en Supabase

---

### Módulo 8: Promociones (`promociones.js`)

#### [NEW] `js/promociones.js`
- **Vista de tarjetas** con diseño promocional atractivo
- **CRUD completo** con formulario modal
- **Tipos**: Descuento porcentual, 2x1, Combo, Happy Hour, Temporada
- Vinculación con productos aplicables
- Estado activo/inactivo
- Indicador visual del descuento

---

### Módulo 9: Proveedores (`proveedores.js`)

#### [NEW] `js/proveedores.js`
- **Vista de tabla** con 12 campos
- **CRUD completo** con formulario modal
- **Estados** de pedido: Pendiente, Confirmado, Entregado, Cancelado
- Registro de pagos y montos pendientes
- **Búsqueda** por nombre, RUC, ciudad

---

### Módulo 10: Inventario (`inventario.js`)

#### [NEW] `js/inventario.js`
- **Vista de tabla** con indicadores visuales de stock
- **CRUD completo** con formulario modal
- **Sistema de alertas**: Notificación visual cuando stock actual ≤ stock mínimo
- Barra de progreso visual del nivel de stock (actual vs máximo)
- **Estados**: Disponible (verde), Stock bajo (amarillo), Agotado (rojo)
- Categorías de insumos: Café, Lácteos, Azúcares, Empaques, etc.

---

### Módulo 11: Logo y Assets

#### [NEW] `assets/logo.svg`
- Logo SVG inline de "Oveja Negra" — ícono estilizado de oveja con grano de café

---

## User Review Required

> [!IMPORTANT]
> **Configuración de Supabase**: Antes del deploy necesitarás:
> 1. Crear un proyecto en [supabase.com](https://supabase.com)
> 2. Ejecutar `schema.sql` y `seed.sql` en el SQL Editor de Supabase
> 3. Copiar tu `SUPABASE_URL` y `SUPABASE_ANON_KEY` al archivo `js/supabase.js`

> [!IMPORTANT]
> **Deploy en Vercel**: Para desplegar:
> 1. Subir el proyecto a un repositorio de GitHub
> 2. Conectar el repositorio a [vercel.com](https://vercel.com)
> 3. Vercel detectará automáticamente el proyecto estático y lo desplegará

## Verification Plan

### Manual Verification
1. Ejecutar `schema.sql` y `seed.sql` en Supabase SQL Editor
2. Abrir `index.html` localmente y verificar conexión con Supabase
3. Verificar que los datos semilla aparecen en el dashboard
4. Navegar por todos los módulos y verificar CRUD completo
5. Probar responsividad en diferentes tamaños de pantalla
6. Verificar gráficos y calendario interactivos
7. Verificar alertas de stock bajo en inventario
8. Probar búsqueda y filtros en cada módulo
9. Deploy en Vercel y verificar funcionamiento en producción
