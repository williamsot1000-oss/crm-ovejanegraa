/* ================================================
   Clientes Module — CRUD completo
   ================================================ */

async function renderClientes() {
  const content = document.getElementById('page-content');
  const { data: clientes } = await DB.getAll('clientes');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">${clientes.length} clientes registrados</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openClienteForm()">
          <i data-lucide="user-plus" width="16" height="16"></i> Nuevo Cliente
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <div class="toolbar-search">
          <i data-lucide="search" width="14" height="14"></i>
          <input type="text" id="clientes-search" placeholder="Buscar por nombre, cédula, email..." oninput="filterClientes()">
        </div>
        <select class="filter-select" id="filter-fidelizacion" onchange="filterClientes()">
          <option value="">Todos los niveles</option>
          <option value="Normal">Normal</option>
          <option value="Frecuente">Frecuente</option>
          <option value="Fidelizado">Fidelizado</option>
          <option value="VIP">VIP</option>
        </select>
        <select class="filter-select" id="filter-tipo" onchange="filterClientes()">
          <option value="">Todos los tipos</option>
          <option value="Individual">Individual</option>
          <option value="Corporativo">Corporativo</option>
        </select>
        <select class="filter-select" id="filter-red-social" onchange="filterClientes()">
          <option value="">Todas las redes</option>
          <option value="Facebook">Facebook</option>
          <option value="Instagram">Instagram</option>
          <option value="TikTok">TikTok</option>
          <option value="LinkedIn">LinkedIn</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table class="data-table" id="clientes-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Cédula/RUC</th>
              <th>Contacto</th>
              <th>Ciudad</th>
              <th>Producto Favorito</th>
              <th>Compras</th>
              <th>Gasto</th>
              <th>Nivel</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="clientes-body">
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  renderClientesTable(clientes);
}

function renderClientesTable(clientes) {
  const tbody = document.getElementById('clientes-body');
  if (!tbody) return;

  if (clientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No se encontraron clientes</td></tr>`;
    return;
  }

  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="dash-list-avatar">${getInitials(c.nombres)}</div>
          <div>
            <div style="font-weight: 600;">${truncate(c.nombres, 28)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${c.email || ''}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-weight: 500;">${c.cedula || '—'}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${c.tipo_documento || (c.cedula?.length === 13 ? 'RUC' : (c.cedula ? 'Cédula' : '—'))}</div>
      </td>
      <td>
        <div style="font-size: 12px;">${c.celular || '—'}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${c.red_social || ''}</div>
      </td>
      <td>${c.ciudad || '—'}</td>
      <td>${c.producto_favorito || '—'}</td>
      <td style="font-weight: 600;">${c.num_compras || 0}</td>
      <td style="font-weight: 600;">${formatCurrency(c.gasto_acumulado)}</td>
      <td><span class="badge ${getBadgeClass(c.nivel_fidelizacion)}">${c.nivel_fidelizacion || 'Normal'}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="viewCliente('${c.id}')" title="Ver detalle">
            <i data-lucide="eye" width="14" height="14"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="openClienteForm('${c.id}')" title="Editar">
            <i data-lucide="pencil" width="14" height="14"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteCliente('${c.id}', '${c.nombres.replace(/'/g, "\\'")}')" title="Eliminar" style="color: var(--danger);">
            <i data-lucide="trash-2" width="14" height="14"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

async function filterClientes() {
  const search = document.getElementById('clientes-search')?.value || '';
  const nivel = document.getElementById('filter-fidelizacion')?.value || '';
  const tipo = document.getElementById('filter-tipo')?.value || '';
  const redSocial = document.getElementById('filter-red-social')?.value || '';

  let { data: clientes } = await DB.getAll('clientes');

  if (search) {
    const q = search.toLowerCase();
    clientes = clientes.filter(c =>
      (c.nombres || '').toLowerCase().includes(q) ||
      (c.cedula || '').toLowerCase().includes(q) ||
      (c.tipo_documento || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.celular || '').includes(q) ||
      (c.red_social || '').toLowerCase().includes(q)
    );
  }

  if (nivel) clientes = clientes.filter(c => c.nivel_fidelizacion === nivel);
  if (tipo) clientes = clientes.filter(c => c.tipo_cliente === tipo);
  if (redSocial) clientes = clientes.filter(c => c.red_social === redSocial);

  renderClientesTable(clientes);
}

async function viewCliente(id) {
  const { data: c } = await DB.getById('clientes', id);
  if (!c) return;

  const docLabel = c.tipo_documento || (c.cedula?.length === 13 ? 'RUC' : (c.cedula ? 'Cédula' : 'Documento'));

  const body = `
    <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg);">
      <div class="dash-list-avatar" style="width: 56px; height: 56px; font-size: var(--fs-lg);">${getInitials(c.nombres)}</div>
      <div>
        <h3 style="font-size: var(--fs-lg); font-weight: 700;">${c.nombres}</h3>
        <span class="badge ${getBadgeClass(c.nivel_fidelizacion)}">${c.nivel_fidelizacion || 'Normal'}</span>
        <span class="badge" style="background: var(--bg-alt); color: var(--text-secondary);">${c.tipo_cliente || 'Individual'}</span>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">${docLabel}</div><div class="detail-value" style="font-weight: 600;">${c.cedula || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Fecha de Nacimiento</div><div class="detail-value">${formatDate(c.fecha_nacimiento)}</div></div>
      <div class="detail-item"><div class="detail-label">Género</div><div class="detail-value">${c.genero || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${c.email || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Celular</div><div class="detail-value">${c.celular || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Red Social</div><div class="detail-value">${c.red_social || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Ciudad</div><div class="detail-value">${c.ciudad || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Dirección</div><div class="detail-value">${c.direccion || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Ocupación</div><div class="detail-value">${c.ocupacion || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Producto Favorito</div><div class="detail-value">${c.producto_favorito || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Gasto Acumulado</div><div class="detail-value" style="color: var(--success); font-weight: 700;">${formatCurrency(c.gasto_acumulado)}</div></div>
      <div class="detail-item"><div class="detail-label">Número de Compras</div><div class="detail-value" style="font-weight: 700;">${c.num_compras || 0}</div></div>
      <div class="detail-item"><div class="detail-label">Frecuencia</div><div class="detail-value">${c.frecuencia_compra || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Horario Preferido</div><div class="detail-value">${c.preferencia_horario || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Preferencia de Consumo</div><div class="detail-value">${c.preferencia_consumo || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Observaciones</div><div class="detail-value">${c.observaciones || '—'}</div></div>
    </div>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
    <button class="btn btn-primary" onclick="closeModal(); openClienteForm('${c.id}')">
      <i data-lucide="pencil" width="14" height="14"></i> Editar
    </button>
  `;

  openModal('Detalle del Cliente', body, footer, 'modal-lg');
}

async function openClienteForm(id = null) {
  let c = { nombres: '', fecha_nacimiento: '', genero: '', cedula: '', email: '', celular: '', red_social: '', ciudad: '', direccion: '', ocupacion: '', tipo_cliente: 'Individual', producto_favorito: '', gasto_acumulado: 0, frecuencia_compra: '', num_compras: 0, preferencia_horario: '', nivel_fidelizacion: 'Normal', observaciones: '', preferencia_consumo: '' };
  
  if (id) {
    const result = await DB.getById('clientes', id);
    if (result.data) c = result.data;
  }

  // Cargar productos del sistema
  const { data: productos } = await DB.getAll('productos');
  const prodList = (productos || []).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const categorias = [...new Set(prodList.map(p => p.tipo_producto || 'General'))];

  let productosOpts = '<option value="">Seleccionar producto</option>';
  categorias.forEach(cat => {
    const prodsCat = prodList.filter(p => (p.tipo_producto || 'General') === cat);
    productosOpts += `<optgroup label="${cat}">`;
    prodsCat.forEach(p => {
      productosOpts += `<option value="${p.nombre}" ${c.producto_favorito === p.nombre ? 'selected' : ''}>${p.nombre}</option>`;
    });
    productosOpts += `</optgroup>`;
  });
  if (c.producto_favorito && !prodList.some(p => p.nombre === c.producto_favorito)) {
    productosOpts += `<option value="${c.producto_favorito}" selected>${c.producto_favorito}</option>`;
  }

  let tipoDoc = c.tipo_documento;
  if (!tipoDoc) {
    if (c.cedula && c.cedula.length === 13 && /^\d+$/.test(c.cedula)) {
      tipoDoc = 'RUC';
    } else if (c.cedula && /[a-zA-Z]/.test(c.cedula)) {
      tipoDoc = 'Pasaporte';
    } else {
      tipoDoc = 'Cédula';
    }
  }

  const title = id ? 'Editar Cliente' : 'Nuevo Cliente';
  const body = `
    <form id="cliente-form">
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Nombres completos *</label>
          <input class="form-control" name="nombres" value="${c.nombres}" required placeholder="Nombre completo del cliente">
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de Documento</label>
          <select class="form-control" name="tipo_documento" id="cliente-tipo-doc" onchange="onClienteTipoDocChange()">
            <option value="Cédula" ${tipoDoc === 'Cédula' ? 'selected' : ''}>Cédula</option>
            <option value="RUC" ${tipoDoc === 'RUC' ? 'selected' : ''}>RUC</option>
            <option value="Pasaporte" ${tipoDoc === 'Pasaporte' ? 'selected' : ''}>Pasaporte</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" id="cliente-doc-label">${tipoDoc}</label>
          <input class="form-control" name="cedula" id="cliente-doc-input" value="${c.cedula || ''}" required autocomplete="off" oninput="onClienteDocInput(this)">
        </div>
        <div class="form-group">
          <label class="form-label">Fecha de Nacimiento</label>
          <input class="form-control" type="date" name="fecha_nacimiento" value="${c.fecha_nacimiento || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Género</label>
          <select class="form-control" name="genero">
            <option value="">Seleccionar</option>
            <option ${c.genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
            <option ${c.genero === 'Femenino' ? 'selected' : ''}>Femenino</option>
            <option ${c.genero === 'Otro' ? 'selected' : ''}>Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Correo Electrónico *</label>
          <input class="form-control" type="email" name="email" id="cliente-email-input" value="${c.email || ''}" placeholder="correo@ejemplo.com" required oninput="this.style.borderColor = this.value.includes('@') ? 'var(--success)' : (this.value ? 'var(--danger)' : '')">
        </div>
        <div class="form-group">
          <label class="form-label">Celular</label>
          <input class="form-control" name="celular" id="cliente-celular-input" value="${c.celular || ''}" placeholder="0987654321" maxlength="10" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 10); this.style.borderColor = this.value.length === 10 ? 'var(--success)' : ''">
        </div>
        <div class="form-group">
          <label class="form-label">Red Social</label>
          <select class="form-control" name="red_social">
            <option value="">Seleccionar red social</option>
            <option value="Facebook" ${c.red_social === 'Facebook' ? 'selected' : ''}>Facebook</option>
            <option value="Instagram" ${c.red_social === 'Instagram' ? 'selected' : ''}>Instagram</option>
            <option value="TikTok" ${c.red_social === 'TikTok' ? 'selected' : ''}>TikTok</option>
            <option value="LinkedIn" ${c.red_social === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
            ${c.red_social && !['Facebook', 'Instagram', 'TikTok', 'LinkedIn'].includes(c.red_social) ? `<option value="${c.red_social}" selected>${c.red_social}</option>` : ''}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Ciudad</label>
          <select class="form-control" name="ciudad">
            <option value="">Seleccionar ciudad</option>
            <option value="Ambato" ${c.ciudad === 'Ambato' ? 'selected' : ''}>Ambato</option>
            <option value="Baños" ${c.ciudad === 'Baños' ? 'selected' : ''}>Baños</option>
            <option value="Pelileo" ${c.ciudad === 'Pelileo' ? 'selected' : ''}>Pelileo</option>
            <option value="Píllaro" ${c.ciudad === 'Píllaro' ? 'selected' : ''}>Píllaro</option>
            <option value="Cevallos" ${c.ciudad === 'Cevallos' ? 'selected' : ''}>Cevallos</option>
            <option value="Quito" ${c.ciudad === 'Quito' ? 'selected' : ''}>Quito</option>
            <option value="Guayaquil" ${c.ciudad === 'Guayaquil' ? 'selected' : ''}>Guayaquil</option>
            <option value="Cuenca" ${c.ciudad === 'Cuenca' ? 'selected' : ''}>Cuenca</option>
            <option value="Riobamba" ${c.ciudad === 'Riobamba' ? 'selected' : ''}>Riobamba</option>
            <option value="Latacunga" ${c.ciudad === 'Latacunga' ? 'selected' : ''}>Latacunga</option>
            <option value="Puyo" ${c.ciudad === 'Puyo' ? 'selected' : ''}>Puyo</option>
            <option value="Otra" ${c.ciudad === 'Otra' ? 'selected' : ''}>Otra</option>
            ${c.ciudad && !['Ambato', 'Baños', 'Pelileo', 'Píllaro', 'Cevallos', 'Quito', 'Guayaquil', 'Cuenca', 'Riobamba', 'Latacunga', 'Puyo', 'Otra'].includes(c.ciudad) ? `<option value="${c.ciudad}" selected>${c.ciudad}</option>` : ''}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input class="form-control" name="direccion" value="${c.direccion || ''}" placeholder="Dirección completa">
        </div>
        <div class="form-group">
          <label class="form-label">Ocupación</label>
          <input class="form-control" name="ocupacion" value="${c.ocupacion || ''}" placeholder="Profesión u ocupación">
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de Cliente</label>
          <select class="form-control" name="tipo_cliente">
            <option ${c.tipo_cliente === 'Individual' ? 'selected' : ''}>Individual</option>
            <option ${c.tipo_cliente === 'Corporativo' ? 'selected' : ''}>Corporativo</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Producto Favorito</label>
          <select class="form-control" name="producto_favorito">
            ${productosOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Gasto Acumulado ($)</label>
          <input class="form-control" type="number" step="0.01" name="gasto_acumulado" value="${c.gasto_acumulado || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Frecuencia de Compra</label>
          <select class="form-control" name="frecuencia_compra">
            <option value="">Seleccionar</option>
            <option ${c.frecuencia_compra === 'Diario' ? 'selected' : ''}>Diario</option>
            <option ${c.frecuencia_compra === 'Semanal' ? 'selected' : ''}>Semanal</option>
            <option ${c.frecuencia_compra === 'Quincenal' ? 'selected' : ''}>Quincenal</option>
            <option ${c.frecuencia_compra === 'Mensual' ? 'selected' : ''}>Mensual</option>
            <option ${c.frecuencia_compra === 'Ocasional' ? 'selected' : ''}>Ocasional</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Número de Compras</label>
          <input class="form-control" type="number" name="num_compras" value="${c.num_compras || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Preferencia de Horario</label>
          <select class="form-control" name="preferencia_horario">
            <option value="">Seleccionar</option>
            <option ${c.preferencia_horario === 'Mañana' ? 'selected' : ''}>Mañana</option>
            <option ${c.preferencia_horario === 'Tarde' ? 'selected' : ''}>Tarde</option>
            <option ${c.preferencia_horario === 'Noche' ? 'selected' : ''}>Noche</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nivel de Fidelización</label>
          <select class="form-control" name="nivel_fidelizacion">
            <option ${c.nivel_fidelizacion === 'Normal' ? 'selected' : ''}>Normal</option>
            <option ${c.nivel_fidelizacion === 'Frecuente' ? 'selected' : ''}>Frecuente</option>
            <option ${c.nivel_fidelizacion === 'Fidelizado' ? 'selected' : ''}>Fidelizado</option>
            <option ${c.nivel_fidelizacion === 'VIP' ? 'selected' : ''}>VIP</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Preferencia de Consumo</label>
          <select class="form-control" name="preferencia_consumo">
            <option value="">Seleccionar</option>
            <option ${c.preferencia_consumo === 'En local' ? 'selected' : ''}>En local</option>
            <option ${c.preferencia_consumo === 'Para llevar' ? 'selected' : ''}>Para llevar</option>
            <option ${c.preferencia_consumo === 'Delivery' ? 'selected' : ''}>Delivery</option>
          </select>
        </div>
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" name="observaciones" rows="2" placeholder="Notas adicionales...">${c.observaciones || ''}</textarea>
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveCliente('${id || ''}')">
      <i data-lucide="save" width="14" height="14"></i> ${id ? 'Actualizar' : 'Guardar'}
    </button>
  `;

  openModal(title, body, footer, 'modal-lg');
  setTimeout(() => {
    onClienteTipoDocChange();
  }, 10);
}

function onClienteTipoDocChange() {
  const tipoSelect = document.getElementById('cliente-tipo-doc');
  const input = document.getElementById('cliente-doc-input');
  const label = document.getElementById('cliente-doc-label');
  if (!tipoSelect || !input) return;

  const tipo = tipoSelect.value;
  if (label) label.textContent = tipo;

  if (tipo === 'Cédula') {
    input.placeholder = '1800000000';
    input.maxLength = 10;
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
  } else if (tipo === 'RUC') {
    input.placeholder = '1800000000001';
    input.maxLength = 13;
    input.value = input.value.replace(/\D/g, '').slice(0, 13);
  } else if (tipo === 'Pasaporte') {
    input.placeholder = 'A12345678';
    input.maxLength = 9;
    input.value = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 9);
  }

  onClienteDocInput(input);
}

function onClienteDocInput(input) {
  if (!input) return;
  const tipoSelect = document.getElementById('cliente-tipo-doc');
  const tipo = tipoSelect ? tipoSelect.value : 'Cédula';

  if (tipo === 'Cédula') {
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
    input.style.borderColor = input.value.length === 10 ? 'var(--success)' : '';
  } else if (tipo === 'RUC') {
    input.value = input.value.replace(/\D/g, '').slice(0, 13);
    input.style.borderColor = input.value.length === 13 ? 'var(--success)' : '';
  } else if (tipo === 'Pasaporte') {
    input.value = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 9);
    input.style.borderColor = (input.value.length >= 8 && input.value.length <= 9) ? 'var(--success)' : '';
  }
}

async function saveCliente(id) {
  const form = document.getElementById('cliente-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  if (!data.nombres || !data.nombres.trim()) {
    showToast('El nombre del cliente es obligatorio', 'warning');
    return;
  }

  // Validación de Identificación (Cédula, RUC, Pasaporte)
  const tipoDoc = data.tipo_documento || 'Cédula';
  const numDoc = (data.cedula || '').trim();
  const inputEl = document.getElementById('cliente-doc-input');

  if (!numDoc) {
    showToast(`Ingrese ${tipoDoc}`, 'warning');
    if (inputEl) { inputEl.focus(); inputEl.style.borderColor = 'var(--danger)'; }
    return;
  }

  if (tipoDoc === 'Cédula') {
    if (!/^\d+$/.test(numDoc) || numDoc.length !== 10) {
      showToast('Cédula no válida', 'danger');
      if (inputEl) { inputEl.focus(); inputEl.style.borderColor = 'var(--danger)'; }
      return;
    }
  } else if (tipoDoc === 'RUC') {
    if (!/^\d+$/.test(numDoc) || numDoc.length !== 13) {
      showToast('RUC no válido', 'danger');
      if (inputEl) { inputEl.focus(); inputEl.style.borderColor = 'var(--danger)'; }
      return;
    }
  } else if (tipoDoc === 'Pasaporte') {
    if (!/^[A-Z0-9]+$/i.test(numDoc) || numDoc.length < 8 || numDoc.length > 9) {
      showToast('Pasaporte no válido', 'danger');
      if (inputEl) { inputEl.focus(); inputEl.style.borderColor = 'var(--danger)'; }
      return;
    }
  }

  // Validación de Correo Electrónico (debe incluir '@')
  const emailVal = (data.email || '').trim();
  const emailInput = document.getElementById('cliente-email-input') || form.querySelector('[name="email"]');
  if (!emailVal || !emailVal.includes('@')) {
    showToast('El correo electrónico debe incluir @', 'danger');
    if (emailInput) {
      emailInput.focus();
      emailInput.style.borderColor = 'var(--danger)';
    }
    return;
  }

  // Validación de Celular (debe tener exactamente 10 dígitos si se ingresa o es requerido)
  const celVal = (data.celular || '').trim();
  const celInput = document.getElementById('cliente-celular-input') || form.querySelector('[name="celular"]');
  if (!celVal || celVal.length !== 10 || !/^\d+$/.test(celVal)) {
    showToast('Celular no válido', 'danger');
    if (celInput) {
      celInput.focus();
      celInput.style.borderColor = 'var(--danger)';
    }
    return;
  }

  // Asegurar formato limpio y mayúsculas
  data.cedula = tipoDoc === 'Pasaporte' ? numDoc.toUpperCase() : numDoc;
  data.tipo_documento = tipoDoc;
  data.gasto_acumulado = parseFloat(data.gasto_acumulado) || 0;
  data.num_compras = parseInt(data.num_compras) || 0;

  if (id) {
    await DB.update('clientes', id, data);
    showToast('Cliente actualizado correctamente', 'success');
  } else {
    await DB.create('clientes', data);
    showToast('Cliente creado correctamente', 'success');
  }

  closeModal();
  renderClientes();
}

function deleteCliente(id, nombre) {
  showConfirm(`¿Deseas eliminar al cliente <strong>${nombre}</strong>? Esta acción no se puede deshacer.`, async () => {
    await DB.delete('clientes', id);
    showToast('Cliente eliminado', 'danger');
    renderClientes();
  });
}
