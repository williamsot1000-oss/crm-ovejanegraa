/* ================================================
   Usuarios Module — Gestión de Roles y Permisos (RBAC)
   CRM Cafetería "Oveja Negra"
   ================================================ */

const SYSTEM_MODULES = [
  { key: 'dashboard', name: 'Dashboard', desc: 'Métricas, KPIs y gráficos generales', icon: 'layout-dashboard' },
  { key: 'clientes', name: 'Clientes', desc: 'Gestión y fidelización de clientes', icon: 'users' },
  { key: 'productos', name: 'Productos', desc: 'Catálogo de bebidas y alimentos', icon: 'coffee' },
  { key: 'ventas', name: 'Ventas', desc: 'Registro y facturación de pedidos', icon: 'shopping-bag' },
  { key: 'reservaciones', name: 'Reservaciones', desc: 'Calendario y reserva de mesas', icon: 'calendar-check' },
  { key: 'promociones', name: 'Promociones', desc: 'Descuentos y campañas', icon: 'tag' },
  { key: 'proveedores', name: 'Proveedores', desc: 'Control de compras y suministros', icon: 'truck' },
  { key: 'inventario', name: 'Inventario', desc: 'Stock de insumos y alertas', icon: 'package' },
  { key: 'usuarios', name: 'Usuarios y Roles', desc: 'Administración de accesos y seguridad', icon: 'shield-check' }
];

async function renderUsuarios() {
  const content = document.getElementById('page-content');
  if (!content) return;

  const currentUser = Auth.getCurrentUser();
  if (!Auth.isAdmin()) {
    content.innerHTML = `
      <div class="empty-state" style="padding: var(--space-xxl); text-align: center;">
        <i data-lucide="shield-alert" width="48" height="48" style="color: var(--danger); margin-bottom: var(--space-md);"></i>
        <h2>Acceso Restringido</h2>
        <p style="color: var(--text-muted); margin-bottom: var(--space-lg);">Este módulo está reservado exclusivamente para los Administradores del sistema.</p>
        <button class="btn btn-primary" onclick="window.location.hash='dashboard'">Ir al Dashboard</button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const { data: usuarios } = await DB.getAll('usuarios');

  const totalUsuarios = usuarios.length;
  const aprobados = usuarios.filter(u => u.aprobado && u.estado === 'Aprobado').length;
  const pendientes = usuarios.filter(u => !u.aprobado || u.estado === 'Pendiente').length;
  const noVerificados = usuarios.filter(u => !u.email_verificado).length;

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Usuarios y Control de Acceso</h1>
        <p class="page-subtitle">${totalUsuarios} usuarios registrados · ${pendientes} pendientes de aprobación</p>
      </div>
      <div class="page-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn btn-outline" onclick="openEmailConfigModal()" title="Configuración y pruebas de entrega de correos">
          <i data-lucide="mail" width="16" height="16"></i> Configurar Correo (EmailJS)
        </button>
        <button class="btn btn-primary" onclick="openUsuarioForm()">
          <i data-lucide="user-plus" width="16" height="16"></i> Nuevo Usuario
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: var(--space-lg);">
      <div class="card kpi-card">
        <div class="kpi-content">
          <span class="kpi-label">Total Usuarios</span>
          <span class="kpi-value">${totalUsuarios}</span>
        </div>
        <div class="kpi-icon" style="background: rgba(44, 24, 16, 0.08); color: var(--primary);">
          <i data-lucide="users" width="22" height="22"></i>
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-content">
          <span class="kpi-label">Aprobados / Activos</span>
          <span class="kpi-value" style="color: var(--success);">${aprobados}</span>
        </div>
        <div class="kpi-icon" style="background: var(--success-bg); color: var(--success);">
          <i data-lucide="user-check" width="22" height="22"></i>
        </div>
      </div>

      <div class="card kpi-card ${pendientes > 0 ? 'kpi-card-alert' : ''}">
        <div class="kpi-content">
          <span class="kpi-label">Pendientes de Aprobación</span>
          <span class="kpi-value" style="color: var(--warning);">${pendientes}</span>
        </div>
        <div class="kpi-icon" style="background: var(--warning-bg); color: var(--warning);">
          <i data-lucide="clock" width="22" height="22"></i>
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-content">
          <span class="kpi-label">Sin Verificar Correo</span>
          <span class="kpi-value" style="color: var(--danger);">${noVerificados}</span>
        </div>
        <div class="kpi-icon" style="background: var(--danger-bg); color: var(--danger);">
          <i data-lucide="mail-warning" width="22" height="22"></i>
        </div>
      </div>
    </div>

    <!-- Alert banner if pending users exist -->
    ${pendientes > 0 ? `
      <div class="alert-banner-pending" style="display: flex; align-items: center; justify-content: space-between; background: #FFF8E1; border: 1px solid #FFE082; padding: var(--space-md) var(--space-lg); border-radius: var(--radius-md); margin-bottom: var(--space-lg);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #FFECB3; display: flex; align-items: center; justify-content: center; color: #F57F17; flex-shrink: 0;">
            <i data-lucide="bell-ring" width="18" height="18"></i>
          </div>
          <div>
            <strong style="color: #795548; font-size: 14px;">Hay ${pendientes} solicitud(es) de usuario esperando tu aprobación</strong>
            <p style="margin: 0; font-size: 12px; color: #8D6E63;">Estos usuarios no podrán acceder al sistema hasta que revises y apruebes sus permisos.</p>
          </div>
        </div>
        <button class="btn btn-sm btn-outline" style="border-color: #FFA000; color: #E65100; font-weight: 600;" onclick="document.getElementById('filter-estado-usr').value='Pendiente'; filterUsuarios();">
          Ver Pendientes
        </button>
      </div>
    ` : ''}

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="toolbar-search">
          <i data-lucide="search" width="14" height="14"></i>
          <input type="text" id="usuarios-search" placeholder="Buscar por nombre, email, cargo..." oninput="filterUsuarios()">
        </div>
        <select class="filter-select" id="filter-estado-usr" onchange="filterUsuarios()">
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente de Aprobación</option>
          <option value="Aprobado">Aprobado / Activo</option>
          <option value="Rechazado">Rechazado</option>
        </select>
        <select class="filter-select" id="filter-rol-usr" onchange="filterUsuarios()">
          <option value="">Todos los roles</option>
          <option value="Administrador">Administrador</option>
          <option value="Personal">Personal</option>
        </select>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Cargo / Rol</th>
              <th>Correo</th>
              <th>Estado Acceso</th>
              <th>Módulos Autorizados</th>
              <th>Registro</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody id="usuarios-body"></tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  renderUsuariosTable(usuarios);
}

function renderUsuariosTable(usuarios) {
  const tbody = document.getElementById('usuarios-body');
  if (!tbody) return;

  if (usuarios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No se encontraron usuarios registrados</td></tr>`;
    return;
  }

  // Sort: Pending first, then by date desc
  const sorted = [...usuarios].sort((a, b) => {
    if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
    if (b.estado === 'Pendiente' && a.estado !== 'Pendiente') return 1;
    return (b.created_at || '').localeCompare(a.created_at || '');
  });

  const currentUser = Auth.getCurrentUser();

  tbody.innerHTML = sorted.map(u => {
    const isSelf = currentUser && currentUser.id === u.id;
    const isPending = !u.aprobado || u.estado === 'Pendiente';
    const isApproved = u.aprobado && u.estado === 'Aprobado';
    const isRejected = u.estado === 'Rechazado';

    const modulesCount = Array.isArray(u.modulos_permitidos) ? u.modulos_permitidos.length : 0;
    const allModulesCount = SYSTEM_MODULES.length;

    let moduleBadgeHTML = '';
    if (u.rol === 'Administrador' || modulesCount >= allModulesCount) {
      moduleBadgeHTML = `<span class="badge" style="background: #EDE7F6; color: #512DA8; font-weight: 600;">Acceso Total (${allModulesCount})</span>`;
    } else if (modulesCount === 0) {
      moduleBadgeHTML = `<span class="badge" style="background: #FFEBEE; color: #C62828;">Sin módulos</span>`;
    } else {
      moduleBadgeHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 260px;">
          ${u.modulos_permitidos.slice(0, 3).map(m => `<span class="badge" style="background: var(--bg-alt); font-size: 11px; padding: 2px 6px;">${getModuleName(m)}</span>`).join('')}
          ${modulesCount > 3 ? `<span class="badge" style="background: var(--border-light); font-size: 11px;">+${modulesCount - 3}</span>` : ''}
        </div>
      `;
    }

    return `
      <tr class="${isPending ? 'row-pending-approval' : ''}">
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="user-avatar-circle" style="background: ${isPending ? '#FFE082' : 'var(--primary)'}; color: ${isPending ? '#5D4037' : 'white'};">
              ${getInitials(u.nombres)}
            </div>
            <div>
              <div style="font-weight: 600; color: var(--primary);">
                ${u.nombres} ${isSelf ? '<span class="badge badge-normal" style="font-size: 10px; padding: 1px 4px;">Tú</span>' : ''}
              </div>
              <div style="font-size: 12px; color: var(--text-muted);">${u.email}</div>
            </div>
          </div>
        </td>

        <td>
          <div style="font-weight: 500; font-size: 13px; ${(!u.cargo || u.cargo === 'Por Asignar') ? 'color: var(--text-muted); font-style: italic;' : ''}">
            ${u.cargo || 'Por Asignar'}
          </div>
          <span class="badge ${u.rol === 'Administrador' ? 'badge-vip' : 'badge-normal'}" style="font-size: 10px; margin-top: 2px;">
            ${u.rol || 'Personal'}
          </span>
        </td>

        <td>
          ${u.email_verificado 
            ? `<span class="badge badge-activo" style="font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="check" width="12" height="12"></i> Verificado</span>`
            : `
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span class="badge badge-inactivo" style="font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="alert-circle" width="12" height="12"></i> Pendiente</span>
                <span class="badge" style="background: #FFF3E0; color: #E65100; font-family: monospace; font-size: 11px; font-weight: 700; border: 1px solid #FFE0B2; padding: 1px 6px;" title="Código de 6 dígitos generado">Cód: ${u.codigo_verificacion || '------'}</span>
              </div>
            `}
        </td>

        <td>
          ${isApproved 
            ? `<span class="badge" style="background: #E8F5E9; color: #2E7D32; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="shield-check" width="12" height="12"></i> Aprobado</span>`
            : (isPending 
                ? (u.email_verificado 
                    ? `<span class="badge" style="background: #FFF3E0; color: #E65100; font-weight: 700; border: 1px solid #FFE0B2; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="user-check" width="12" height="12"></i> Listo para Aprobación</span>`
                    : `<span class="badge" style="background: #ECEFF1; color: #546E7A; font-weight: 600; border: 1px solid #CFD8DC; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="mail-warning" width="12" height="12"></i> Esperando Verificación</span>`
                  )
                : `<span class="badge badge-cancelado" style="font-size: 11px;">Rechazado</span>`
              )}
        </td>

        <td>${moduleBadgeHTML}</td>

        <td style="font-size: 12px; color: var(--text-muted);">
          ${formatDate(u.created_at ? u.created_at.split('T')[0] : '')}
        </td>

        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            ${isPending ? `
              ${u.email_verificado ? `
                <button class="btn btn-sm btn-primary" style="background: var(--success); border-color: var(--success); color: white; padding: 4px 10px; font-size: 12px; font-weight: 600;" onclick="openAprobarModal('${u.id}')" title="Aprobar Solicitud y Asignar Módulos">
                  <i data-lucide="user-check" width="14" height="14"></i> Aprobar
                </button>
              ` : `
                <button class="btn btn-sm btn-outline" disabled style="opacity: 0.6; cursor: not-allowed; font-size: 11px; padding: 4px 8px; color: var(--text-muted);" title="El usuario debe verificar primero su correo con el código recibido">
                  <i data-lucide="clock" width="13" height="13"></i> Esperando Verificación
                </button>
                <button class="btn btn-ghost btn-sm" style="color: #2E7D32; border: 1px solid #C8E6C9; background: #F1F8E9; padding: 4px 8px; font-size: 11px;" onclick="verificarEmailManual('${u.id}', '${u.nombres}')" title="Validar correo como Administrador (simula la verificación)">
                  <i data-lucide="mail-check" width="13" height="13"></i> Validar Correo
                </button>
              `}
              <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="rechazarUsuario('${u.id}', '${u.nombres}')" title="Rechazar Acceso">
                <i data-lucide="user-x" width="14" height="14"></i>
              </button>
            ` : `
              <button class="btn btn-ghost btn-sm" onclick="openPermisosModal('${u.id}')" title="Gestionar Módulos y Permisos">
                <i data-lucide="key" width="14" height="14"></i>
              </button>
              <button class="btn btn-ghost btn-sm" onclick="openUsuarioForm('${u.id}')" title="Editar Usuario">
                <i data-lucide="pencil" width="14" height="14"></i>
              </button>
              ${!isSelf ? `
                <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="deleteUsuario('${u.id}', '${u.nombres}')" title="Eliminar Usuario">
                  <i data-lucide="trash-2" width="14" height="14"></i>
                </button>
              ` : ''}
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function getModuleName(key) {
  const found = SYSTEM_MODULES.find(m => m.key === key);
  return found ? found.name : key;
}

async function filterUsuarios() {
  const search = document.getElementById('usuarios-search')?.value || '';
  const estado = document.getElementById('filter-estado-usr')?.value || '';
  const rol = document.getElementById('filter-rol-usr')?.value || '';

  let { data: usuarios } = await DB.getAll('usuarios');

  if (search) {
    const q = search.toLowerCase();
    usuarios = usuarios.filter(u =>
      (u.nombres || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.cargo || '').toLowerCase().includes(q)
    );
  }

  if (estado) {
    if (estado === 'Pendiente') {
      usuarios = usuarios.filter(u => !u.aprobado || u.estado === 'Pendiente');
    } else {
      usuarios = usuarios.filter(u => u.estado === estado);
    }
  }

  if (rol) {
    usuarios = usuarios.filter(u => u.rol === rol);
  }

  renderUsuariosTable(usuarios);
}

// ---- Modal: Aprobar Solicitud con Asignación de Módulos ----
async function openAprobarModal(id) {
  const { data: u } = await DB.getById('usuarios', id);
  if (!u) return;

  const currentModules = Array.isArray(u.modulos_permitidos) ? u.modulos_permitidos : ['dashboard'];

  const body = `
    <div style="margin-bottom: var(--space-md);">
      <div style="display: flex; align-items: center; gap: 12px; background: var(--bg-alt); padding: var(--space-md); border-radius: var(--radius-md); margin-bottom: var(--space-md);">
        <div class="user-avatar-circle" style="background: var(--primary); color: white; width: 44px; height: 44px;">
          ${getInitials(u.nombres)}
        </div>
        <div>
          <div style="font-weight: 700; font-size: var(--fs-md);">${u.nombres}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${u.email}</div>
        </div>
      </div>

      ${u.email_verificado ? `
        <div style="background: #E8F5E9; border: 1px solid #C8E6C9; padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: var(--space-md); font-size: 12px; color: #2E7D32; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="check-circle" width="16" height="16" style="color: #2E7D32; flex-shrink: 0;"></i>
          <div>
            <strong>Paso de autenticación completado:</strong> El usuario ya verificó su correo electrónico. Ahora puedes asignarle su cargo y módulos para aceptar su acceso al sistema.
          </div>
        </div>
      ` : `
        <div style="background: #FFF8E1; border: 1px solid #FFE082; padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: var(--space-md); font-size: 12px; color: #795548; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="info" width="16" height="16" style="color: #F57F17; flex-shrink: 0;"></i>
          <div>
            <strong>Aviso de proceso:</strong> Este usuario aún no ha verificado su correo con el código recibido (Código: <code style="background: white; padding: 1px 6px; border-radius: 3px; font-weight: 700; color: #E65100;">${u.codigo_verificacion || 'N/A'}</code>). Al presionar Guardar Cambios y Aprobar, se validará su correo y se le concederá acceso inmediato.
          </div>
        </div>
      `}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
        <label class="form-label" style="font-weight: 700; margin: 0;">
          <i data-lucide="shield-check" width="16" height="16"></i> Módulos a los que tendrá acceso:
        </label>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="toggleAllCheckboxes(true)">Seleccionar Todos</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="toggleAllCheckboxes(false)">Desmarcar</button>
        </div>
      </div>

      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: var(--space-md);">
        Marca los módulos que el usuario podrá ver y operar. Los módulos no seleccionados quedarán ocultos y protegidos para su cuenta.
      </p>

      <form id="aprobar-form">
        <div class="modules-permission-grid">
          ${SYSTEM_MODULES.map(m => {
            const isChecked = currentModules.includes(m.key);
            return `
              <label class="module-check-card ${isChecked ? 'selected' : ''}">
                <input type="checkbox" name="modulo" value="${m.key}" ${isChecked ? 'checked' : ''} onchange="this.closest('.module-check-card').classList.toggle('selected', this.checked)">
                <div class="module-check-icon">
                  <i data-lucide="${m.icon}" width="18" height="18"></i>
                </div>
                <div class="module-check-info">
                  <div class="module-check-title">${m.name}</div>
                  <div class="module-check-desc">${m.desc}</div>
                </div>
              </label>
            `;
          }).join('')}
        </div>

        <div class="form-grid" style="margin-top: var(--space-lg);">
          <div class="form-group">
            <label class="form-label">Cargo o Puesto Asignado *</label>
            <input class="form-control" id="aprobar-cargo" value="${u.cargo && u.cargo !== 'Por Asignar' ? u.cargo : ''}" placeholder="Ej: Cajero / Ventas, Barista, Mesero..." required>
          </div>
          <div class="form-group">
            <label class="form-label">Rol en el Sistema *</label>
            <select class="form-control" id="aprobar-rol">
              <option value="Personal" ${u.rol === 'Personal' ? 'selected' : ''}>Personal (Acceso restringido a módulos)</option>
              <option value="Administrador" ${u.rol === 'Administrador' ? 'selected' : ''}>Administrador (Control total del sistema)</option>
            </select>
          </div>
        </div>

        <!-- Botón Guardar Cambios visible directamente al final del formulario -->
        <div style="margin-top: var(--space-xl); padding: var(--space-md); background: #F1F8E9; border: 1px solid #C8E6C9; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="font-size: 13px; color: #2E7D32; font-weight: 500;">
            <i data-lucide="shield-check" width="18" height="18" style="vertical-align: middle; margin-right: 4px;"></i> Al guardar cambios, el usuario será aprobado con los módulos asignados y podrá ingresar.
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" style="background: var(--success); border-color: var(--success); color: white; padding: 10px 22px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 8px rgba(46, 125, 50, 0.3); display: inline-flex; align-items: center; gap: 8px;" onclick="saveAprobacion('${u.id}')">
              <i data-lucide="save" width="16" height="16"></i> Guardar Cambios y Aprobar
            </button>
          </div>
        </div>
      </form>
    </div>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" style="background: var(--success); border-color: var(--success); color: white; font-weight: 700; padding: 8px 20px; display: inline-flex; align-items: center; gap: 8px;" onclick="saveAprobacion('${u.id}')">
      <i data-lucide="save" width="16" height="16"></i> Guardar Cambios y Aprobar
    </button>
  `;

  openModal('Aprobar Solicitud de Acceso', body, footer, 'modal-lg');
  if (window.lucide) lucide.createIcons();
}

async function saveAprobacion(id) {
  const form = document.getElementById('aprobar-form');
  if (!form) return;

  const checkedModules = Array.from(form.querySelectorAll('input[name="modulo"]:checked')).map(cb => cb.value);
  const cargo = document.getElementById('aprobar-cargo')?.value.trim() || 'Personal';
  const rol = document.getElementById('aprobar-rol')?.value || 'Personal';

  if (!cargo) {
    showToast('Debes ingresar el cargo o puesto para el usuario', 'warning');
    return;
  }

  if (checkedModules.length === 0 && rol !== 'Administrador') {
    showToast('Selecciona al menos un módulo para el usuario', 'warning');
    return;
  }

  const { data: u } = await DB.getById('usuarios', id);
  const currentUser = Auth.getCurrentUser();

  await DB.update('usuarios', id, {
    aprobado: true,
    estado: 'Aprobado',
    cargo: cargo,
    rol: rol,
    modulos_permitidos: checkedModules,
    email_verificado: true, // Automatically validates email to prevent deadlock!
    codigo_verificacion: '',
    fecha_aprobacion: new Date().toISOString(),
    aprobado_por: currentUser ? currentUser.nombres : 'Administrador'
  });

  showToast(`Usuario ${u ? u.nombres : ''} aprobado y activado exitosamente`, 'success');
  closeModal();
  renderUsuarios();

  if (u) {
    const primerNombre = u.nombres ? u.nombres.split(' ')[0] : 'el usuario';
    openModal(
      '¡Usuario Aprobado y Activado!',
      `
      <div style="text-align: center; padding: 10px 0;">
        <div style="width: 58px; height: 58px; background: #E8F5E9; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; border: 2px solid #A5D6A7;">
          <i data-lucide="shield-check" width="32" height="32" style="color: #2E7D32;"></i>
        </div>
        <h3 style="margin-bottom: 8px; font-size: 17px; color: var(--primary);">¡${u.nombres} ya tiene acceso a la plataforma!</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.5;">
          Cargo: <strong style="color: var(--primary);">${cargo}</strong> · Rol: <strong>${rol}</strong><br>
          Módulos permitidos: <strong style="color: #2E7D32;">${checkedModules.join(', ')}</strong>
        </p>

        <div style="background: var(--bg-alt); border-radius: var(--radius-md); padding: 12px 16px; border: 1px solid var(--border-light); margin-bottom: 16px; text-align: left; font-size: 12px;">
          <div style="font-weight: 700; margin-bottom: 4px; color: var(--primary);">Credenciales de Acceso:</div>
          <div>• Correo: <code style="background: white; padding: 2px 6px; border-radius: 3px; font-weight: 600;">${u.email}</code></div>
          <div style="margin-top: 4px;">• Contraseña: <code style="background: white; padding: 2px 6px; border-radius: 3px;">${u.password || '••••••'}</code></div>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
          ¿Deseas probar el inicio de sesión con este usuario ahora? Se cerrará la sesión de Administrador y se cargarán sus credenciales automáticamente en la pantalla de acceso.
        </p>
      </div>
      `,
      `
      <button class="btn btn-outline" onclick="closeModal()">Permanecer como Administrador</button>
      <button class="btn btn-primary" style="background: #2E7D32; border-color: #2E7D32; font-weight: 700;" onclick="Auth.testUserLogin('${u.email}', '${u.password || ''}')">
        <i data-lucide="log-in" width="16" height="16"></i> Probar Ingreso con ${primerNombre}
      </button>
      `,
      'modal-md'
    );
    if (window.lucide) lucide.createIcons();
  }
}

// ---- Modal: Gestionar Permisos para Usuario ya Activo ----
async function openPermisosModal(id) {
  const { data: u } = await DB.getById('usuarios', id);
  if (!u) return;

  const currentModules = Array.isArray(u.modulos_permitidos) ? u.modulos_permitidos : [];

  const body = `
    <div style="margin-bottom: var(--space-md);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md);">
        <div>
          <h4 style="margin: 0; font-size: 15px; color: var(--primary);">${u.nombres}</h4>
          <span style="font-size: 12px; color: var(--text-muted);">${u.email} · Rol: <strong>${u.rol}</strong></span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="toggleAllCheckboxes(true)">Todos</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="toggleAllCheckboxes(false)">Ninguno</button>
        </div>
      </div>

      <form id="permisos-form">
        <div class="modules-permission-grid">
          ${SYSTEM_MODULES.map(m => {
            const isChecked = currentModules.includes(m.key) || u.rol === 'Administrador';
            return `
              <label class="module-check-card ${isChecked ? 'selected' : ''}">
                <input type="checkbox" name="modulo" value="${m.key}" ${isChecked ? 'checked' : ''} onchange="this.closest('.module-check-card').classList.toggle('selected', this.checked)">
                <div class="module-check-icon">
                  <i data-lucide="${m.icon}" width="18" height="18"></i>
                </div>
                <div class="module-check-info">
                  <div class="module-check-title">${m.name}</div>
                  <div class="module-check-desc">${m.desc}</div>
                </div>
              </label>
            `;
          }).join('')}
        </div>

        <!-- Botón Guardar Cambios dentro del formulario de permisos -->
        <div style="margin-top: var(--space-xl); padding-top: var(--space-md); border-top: 1px solid var(--border-light); display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" style="padding: 10px 22px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;" onclick="savePermisos('${u.id}')">
            <i data-lucide="save" width="16" height="16"></i> Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" style="font-weight: 700; padding: 8px 20px; display: inline-flex; align-items: center; gap: 8px;" onclick="savePermisos('${u.id}')">
      <i data-lucide="save" width="16" height="16"></i> Guardar Cambios
    </button>
  `;

  openModal('Permisos de Módulos', body, footer, 'modal-lg');
  if (window.lucide) lucide.createIcons();
}

async function savePermisos(id) {
  const form = document.getElementById('permisos-form');
  if (!form) return;

  const checkedModules = Array.from(form.querySelectorAll('input[name="modulo"]:checked')).map(cb => cb.value);

  await DB.update('usuarios', id, {
    modulos_permitidos: checkedModules
  });

  // If editing self, update current user cache
  const currentUser = Auth.getCurrentUser();
  if (currentUser && currentUser.id === id) {
    currentUser.modulos_permitidos = checkedModules;
    Auth.setCurrentUser(currentUser);
    applySidebarPermissions(currentUser);
  }

  showToast('Permisos de módulos actualizados', 'success');
  closeModal();
  renderUsuarios();
}

function toggleAllCheckboxes(select) {
  document.querySelectorAll('.module-check-card input[type="checkbox"]').forEach(cb => {
    cb.checked = select;
    cb.closest('.module-check-card').classList.toggle('selected', select);
  });
}

// ---- Modal: Crear / Editar Usuario Manualmente ----
async function openUsuarioForm(id = null) {
  let u = {
    nombres: '',
    email: '',
    telefono: '',
    cargo: 'Cajero / Ventas',
    rol: 'Personal',
    password: '',
    aprobado: true,
    estado: 'Aprobado',
    email_verificado: true,
    modulos_permitidos: ['dashboard', 'clientes', 'productos', 'ventas', 'reservaciones']
  };

  if (id) {
    const res = await DB.getById('usuarios', id);
    if (res.data) u = res.data;
  }

  const body = `
    <form id="usuario-form">
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Nombres y Apellidos *</label>
          <input class="form-control" name="nombres" value="${u.nombres}" required placeholder="Ej: Esteban Morales">
        </div>

        <div class="form-group">
          <label class="form-label">Correo Electrónico *</label>
          <input class="form-control" type="email" name="email" value="${u.email}" required placeholder="correo@ovejanegra.ec">
        </div>

        <div class="form-group">
          <label class="form-label">Teléfono / Celular</label>
          <input class="form-control" type="tel" name="telefono" value="${u.telefono || ''}" placeholder="0991234567">
        </div>

        <div class="form-group">
          <label class="form-label">Cargo / Puesto</label>
          <input class="form-control" name="cargo" value="${u.cargo}" placeholder="Ej: Barista, Cajero, Administrador">
        </div>

        <div class="form-group">
          <label class="form-label">Rol del Sistema *</label>
          <select class="form-control" name="rol" id="user-form-rol">
            <option value="Personal" ${u.rol === 'Personal' ? 'selected' : ''}>Personal</option>
            <option value="Administrador" ${u.rol === 'Administrador' ? 'selected' : ''}>Administrador</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Estado de Aprobación *</label>
          <select class="form-control" name="estado">
            <option value="Aprobado" ${u.estado === 'Aprobado' ? 'selected' : ''}>Aprobado (Acceso permitido)</option>
            <option value="Pendiente" ${u.estado === 'Pendiente' ? 'selected' : ''}>Pendiente (Acceso bloqueado)</option>
            <option value="Rechazado" ${u.estado === 'Rechazado' ? 'selected' : ''}>Rechazado</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Correo Verificado</label>
          <select class="form-control" name="email_verificado">
            <option value="true" ${u.email_verificado ? 'selected' : ''}>Sí (Verificado)</option>
            <option value="false" ${!u.email_verificado ? 'selected' : ''}>No (Pendiente de verificar)</option>
          </select>
        </div>

        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">${id ? 'Cambiar Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña de Acceso *'}</label>
          <input class="form-control" type="password" name="password" ${id ? '' : 'required'} minlength="6" placeholder="••••••••">
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveUsuario('${id || ''}')">
      <i data-lucide="save" width="14" height="14"></i> ${id ? 'Actualizar Usuario' : 'Crear Usuario'}
    </button>
  `;

  openModal(id ? 'Editar Usuario' : 'Nuevo Usuario', body, footer);
  if (window.lucide) lucide.createIcons();
}

async function saveUsuario(id) {
  const form = document.getElementById('usuario-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  if (!data.nombres || !data.email) {
    showToast('Nombres y correo son campos obligatorios', 'warning');
    return;
  }

  data.email = data.email.trim().toLowerCase();
  data.email_verificado = data.email_verificado === 'true';
  data.aprobado = data.estado === 'Aprobado';

  // Check email uniqueness if creating or if changed
  const { data: allUsers } = await DB.getAll('usuarios');
  const duplicate = allUsers.find(u => u.email === data.email && u.id !== id);
  if (duplicate) {
    showToast('Ya existe otro usuario con ese correo electrónico', 'danger');
    return;
  }

  if (id) {
    const { data: current } = await DB.getById('usuarios', id);
    if (!data.password && current) {
      data.password = current.password;
    }
    await DB.update('usuarios', id, data);
    showToast('Usuario actualizado correctamente', 'success');
  } else {
    data.modulos_permitidos = data.rol === 'Administrador' 
      ? SYSTEM_MODULES.map(m => m.key) 
      : ['dashboard', 'clientes', 'productos', 'ventas'];
    data.codigo_verificacion = '';
    await DB.create('usuarios', data);
    showToast('Usuario creado correctamente', 'success');
  }

  closeModal();
  renderUsuarios();
}

function rechazarUsuario(id, nombres) {
  showConfirm(`¿Deseas rechazar la solicitud de acceso para <strong>${nombres}</strong>?`, async () => {
    await DB.update('usuarios', id, {
      aprobado: false,
      estado: 'Rechazado'
    });
    showToast(`Solicitud de ${nombres} rechazada`, 'info');
    renderUsuarios();
  });
}

function deleteUsuario(id, nombres) {
  const currentUser = Auth.getCurrentUser();
  if (currentUser && currentUser.id === id) {
    showToast('No puedes eliminar tu propia cuenta de usuario activa', 'danger');
    return;
  }

  showConfirm(`¿Deseas eliminar permanentemente la cuenta de <strong>${nombres}</strong>?`, async () => {
    await DB.delete('usuarios', id);
    showToast('Usuario eliminado', 'danger');
    renderUsuarios();
  });
}

// ---- Direct Manual Email Verification by Admin ----
async function verificarEmailManual(id, nombres) {
  showConfirm(`¿Deseas validar manualmente el correo electrónico de <strong>${nombres}</strong>?<br><span style="font-size: 12px; color: var(--text-muted);">Esto omitirá la verificación del código de 6 dígitos.</span>`, async () => {
    await DB.update('usuarios', id, {
      email_verificado: true,
      codigo_verificacion: ''
    });
    showToast(`Correo de ${nombres} validado exitosamente`, 'success');
    renderUsuarios();
  });
}

// ---- Modal: Configuración de Envío de Correos (EmailJS) ----
function openEmailConfigModal() {
  const config = Auth.getEmailConfig() || {
    service_id: '',
    template_id: '',
    public_key: ''
  };

  const body = `
    <div style="margin-bottom: var(--space-md);">
      <div style="background: #E8F5E9; border: 1px solid #C8E6C9; border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-lg);">
        <div style="display: flex; gap: 10px; align-items: flex-start;">
          <i data-lucide="mail-check" width="22" height="22" style="color: #2E7D32; flex-shrink: 0; margin-top: 2px;"></i>
          <div style="font-size: 12px; color: #1B5E20; line-height: 1.45;">
            <strong>Servicio de Entrega de Correos (EmailJS):</strong><br>
            Permite despachar correos reales con el código de 6 dígitos a cualquier dirección (Gmail, Outlook, Yahoo) directamente desde el navegador de forma gratuita (200 envíos/mes).
          </div>
        </div>
      </div>

      <form id="email-config-form" onsubmit="event.preventDefault(); saveEmailConfigForm();">
        <div class="form-group" style="margin-bottom: var(--space-md);">
          <label class="form-label">Service ID (EmailJS) *</label>
          <input type="text" id="cfg-service-id" class="form-control" placeholder="Ej: service_ovejanegra" value="${config.service_id || ''}">
          <span style="font-size: 11px; color: var(--text-muted);">Encuéntralo en tu panel de EmailJS en <strong>Email Services</strong>.</span>
        </div>

        <div class="form-group" style="margin-bottom: var(--space-md);">
          <label class="form-label">Template ID *</label>
          <input type="text" id="cfg-template-id" class="form-control" placeholder="Ej: template_verificacion" value="${config.template_id || ''}">
          <span style="font-size: 11px; color: var(--text-muted);">Encuéntralo en <strong>Email Templates</strong>. En tu plantilla usa los tags: <code>{{to_name}}</code>, <code>{{to_email}}</code>, <code>{{verification_code}}</code>.</span>
        </div>

        <div class="form-group" style="margin-bottom: var(--space-lg);">
          <label class="form-label">Public Key (API Key) *</label>
          <input type="text" id="cfg-public-key" class="form-control" placeholder="Ej: user_XXXXXXXXXXXXXXX o public key" value="${config.public_key || ''}">
          <span style="font-size: 11px; color: var(--text-muted);">Encuéntralo en <strong>Account -> API Keys -> Public Key</strong>.</span>
        </div>

        <div style="background: var(--bg-alt); padding: var(--space-md); border-radius: var(--radius-md); border: 1px solid var(--border-light); margin-bottom: var(--space-sm);">
          <label class="form-label" style="font-weight: 600; margin-bottom: 6px;"><i data-lucide="send" width="14" height="14"></i> Probar Envío Inmediato a un Correo</label>
          <div style="display: flex; gap: 8px;">
            <input type="email" id="cfg-test-email" class="form-control" placeholder="tu_correo@gmail.com" value="${Auth.getCurrentUser()?.email || 'admin@ovejanegra.ec'}">
            <button type="button" class="btn btn-outline" id="btn-test-email" onclick="testLiveEmailDelivery()" style="white-space: nowrap;">
              <i data-lucide="send" width="14" height="14"></i> Probar Envío
            </button>
          </div>
          <div id="cfg-test-result" style="margin-top: 8px; font-size: 12px; display: none;"></div>
        </div>
      </form>
    </div>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
    <button class="btn btn-primary" onclick="saveEmailConfigForm()">
      <i data-lucide="save" width="14" height="14"></i> Guardar Configuración
    </button>
  `;

  openModal('Configuración de Correo Electrónico (EmailJS)', body, footer, 'modal-md');
  if (window.lucide) lucide.createIcons();
}

async function testLiveEmailDelivery() {
  const service_id = document.getElementById('cfg-service-id')?.value.trim() || '';
  const template_id = document.getElementById('cfg-template-id')?.value.trim() || '';
  const public_key = document.getElementById('cfg-public-key')?.value.trim() || '';
  const test_email = document.getElementById('cfg-test-email')?.value.trim();
  const resEl = document.getElementById('cfg-test-result');
  const btn = document.getElementById('btn-test-email');

  if (!test_email) {
    showToast('Ingresa un correo para la prueba', 'warning');
    return;
  }

  if (!service_id || !public_key) {
    if (resEl) {
      resEl.style.display = 'block';
      resEl.innerHTML = `<span style="color: #C62828; font-weight: 600;">⚠️ Ingresa tu <strong>Service ID</strong> y <strong>Public Key</strong> de EmailJS para realizar la prueba de envío.</span>`;
    }
    showToast('Ingresa Service ID y Public Key de EmailJS', 'warning');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-sm"></span> Enviando...`;
  }
  if (resEl) {
    resEl.style.display = 'block';
    resEl.innerHTML = `<span style="color: var(--text-muted);"><span class="spinner-sm"></span> Conectando con los servidores de EmailJS...</span>`;
  }

  // Save current config temporarily for test
  Auth.saveEmailConfig({ service_id, template_id, public_key });

  const testCode = Math.floor(100000 + Math.random() * 900000).toString();
  const res = await Auth.sendVerificationEmail(test_email, 'Administrador de Pruebas', testCode);

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="send" width="14" height="14"></i> Probar Envío`;
    if (window.lucide) lucide.createIcons();
  }

  if (res.success) {
    resEl.innerHTML = `<span style="color: #2E7D32; font-weight: 600;">✅ ¡Correo despachado exitosamente vía ${res.provider}! Revisa tu bandeja de entrada o spam en ${test_email}. (Código enviado: ${testCode})</span>`;
    showToast(`Correo de prueba despachado a ${test_email}`, 'success');
  } else {
    resEl.innerHTML = `<span style="color: #C62828; font-weight: 600;">⚠️ ${res.message || 'No se pudo enviar.'} Código generado para pruebas: <strong>${testCode}</strong> (también registrado en consola F12).</span>`;
    showToast('No se pudo entregar el correo externo', 'danger');
  }
}

function saveEmailConfigForm() {
  const service_id = document.getElementById('cfg-service-id')?.value.trim() || '';
  const template_id = document.getElementById('cfg-template-id')?.value.trim() || '';
  const public_key = document.getElementById('cfg-public-key')?.value.trim() || '';

  Auth.saveEmailConfig({ service_id, template_id, public_key });
  showToast('Configuración de EmailJS guardada correctamente', 'success');
  closeModal();
}

// Global window attachments
window.openEmailConfigModal = openEmailConfigModal;
window.testLiveEmailDelivery = testLiveEmailDelivery;
window.saveEmailConfigForm = saveEmailConfigForm;
