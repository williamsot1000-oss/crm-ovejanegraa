# CRM Oveja Negra — Tareas

## Core & Estructura
- [x] `index.html` — Layout SPA principal
- [x] `css/styles.css` — Sistema de diseño completo
- [x] `js/app.js` — Router, utilidades, modales, toasts
- [x] `js/db.js` — Capa de datos localStorage (preparada para Supabase)
- [x] `assets/logo.svg` — Logo Oveja Negra

## Datos Semilla
- [x] `js/seed.js` — Datos semilla realistas

## Módulos Funcionales
- [x] `js/dashboard.js` — Dashboard con KPIs y gráficos
- [x] `js/clientes.js` — CRUD de clientes (20 campos)
- [x] `js/productos.js` — CRUD de productos (vista tarjeta + tabla)
- [x] `js/ventas.js` — Gestión de ventas/pedidos (16 campos, auto-cálculo)
- [x] `js/reservaciones.js` — Calendario FullCalendar + CRUD
- [x] `js/promociones.js` — CRUD de promociones (tarjetas)
- [x] `js/proveedores.js` — CRUD de proveedores
- [x] `js/inventario.js` — CRUD de inventario + alertas stock
- [x] `js/auth.js` — Autenticación, registro, verificación por correo y control de sesión
- [x] `js/usuarios.js` — Módulo de administración de roles, aprobación de usuarios y permisos por módulo (RBAC)
- [x] Envío de correos reales (EmailJS), visualización de códigos para el Administrador y validación de respaldo sin bloqueo de usuarios
- [x] Configuración accesible de EmailJS desde cualquier pantalla (Login, Registro, Verificación, Admin) con prueba de entrega en vivo
- [x] Flujo de pruebas rápido de extremo a extremo: Registro -> Verificación (EmailJS o Mensaje Virtual) -> Aprobación Admin -> Acceso inmediato del nuevo usuario con permisos RBAC
