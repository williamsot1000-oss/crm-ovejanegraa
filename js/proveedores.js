/* ================================================
   Proveedores Module — CRUD completo
   ================================================ */

async function renderProveedores() {
  const content = document.getElementById('page-content');
  const { data: proveedores } = await DB.getAll('proveedores');

  const totalPagar = proveedores.reduce((s, p) => s + (p.total_pagar || 0), 0);

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Proveedores</h1>
        <p class="page-subtitle">${proveedores.length} proveedores · Total por pagar: ${formatCurrency(totalPagar)}</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openProveedorForm()">
          <i data-lucide="truck" width="16" height="16"></i> Nuevo Proveedor
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <div class="toolbar-search">
          <i data-lucide="search" width="14" height="14"></i>
          <input type="text" id="proveedores-search" placeholder="Buscar proveedor..." oninput="filterProveedores()">
        </div>
        <select class="filter-select" id="filter-estado-prov" onchange="filterProveedores()">
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmado">Confirmado</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>RUC</th>
              <th>Contacto</th>
              <th>Ciudad</th>
              <th>Cant. Producto</th>
              <th>Total</th>
              <th>Método</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="proveedores-body"></tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  renderProveedoresTable(proveedores);
}

function renderProveedoresTable(proveedores) {
  const tbody = document.getElementById('proveedores-body');
  if (!tbody) return;

  if (proveedores.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="table-empty">No se encontraron proveedores</td></tr>`;
    return;
  }

  tbody.innerHTML = proveedores.map(p => `
    <tr>
      <td>
        <div>
          <div style="font-weight: 600;">${truncate(p.nombre, 28)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${p.email || ''}</div>
        </div>
      </td>
      <td><code style="background: var(--bg-alt); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${p.ruc || '—'}</code></td>
      <td style="font-size: 12px;">${p.contacto || '—'}</td>
      <td>${p.ciudad || '—'}</td>
      <td style="text-align: center; font-weight: 600;">${p.cantidad_producto || 0}</td>
      <td style="font-weight: 700;">${formatCurrency(p.total_pagar)}</td>
      <td style="font-size: 12px;">${p.metodo_pago || '—'}</td>
      <td>${formatDate(p.fecha)}</td>
      <td><span class="badge ${getBadgeClass(p.estado)}">${p.estado || 'Pendiente'}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="viewProveedor('${p.id}')"><i data-lucide="eye" width="14" height="14"></i></button>
          <button class="btn btn-ghost btn-sm" onclick="openProveedorForm('${p.id}')"><i data-lucide="pencil" width="14" height="14"></i></button>
          <button class="btn btn-ghost btn-sm" onclick="deleteProveedor('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')" style="color: var(--danger);"><i data-lucide="trash-2" width="14" height="14"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

async function filterProveedores() {
  const search = document.getElementById('proveedores-search')?.value || '';
  const estado = document.getElementById('filter-estado-prov')?.value || '';

  let { data: proveedores } = await DB.getAll('proveedores');

  if (search) {
    const q = search.toLowerCase();
    proveedores = proveedores.filter(p =>
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.ruc || '').toLowerCase().includes(q) ||
      (p.ciudad || '').toLowerCase().includes(q)
    );
  }

  if (estado) proveedores = proveedores.filter(p => p.estado === estado);

  renderProveedoresTable(proveedores);
}

async function viewProveedor(id) {
  const { data: p } = await DB.getById('proveedores', id);
  if (!p) return;

  const body = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Nombre</div><div class="detail-value">${p.nombre}</div></div>
      <div class="detail-item"><div class="detail-label">RUC</div><div class="detail-value">${p.ruc || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${p.email || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Contacto</div><div class="detail-value">${p.contacto || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Ciudad</div><div class="detail-value">${p.ciudad || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Dirección</div><div class="detail-value">${p.direccion || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Descuentos</div><div class="detail-value">${p.descuentos || 'Ninguno'}</div></div>
      <div class="detail-item"><div class="detail-label">Estado</div><div class="detail-value"><span class="badge ${getBadgeClass(p.estado)}">${p.estado}</span></div></div>
      <div class="detail-item"><div class="detail-label">Cantidad de Producto</div><div class="detail-value">${p.cantidad_producto || 0}</div></div>
      <div class="detail-item"><div class="detail-label">Fecha</div><div class="detail-value">${formatDate(p.fecha)}</div></div>
      <div class="detail-item"><div class="detail-label">Total por Pagar</div><div class="detail-value" style="font-weight: 700; color: var(--secondary);">${formatCurrency(p.total_pagar)}</div></div>
      <div class="detail-item"><div class="detail-label">Método de Pago</div><div class="detail-value">${p.metodo_pago || '—'}</div></div>
    </div>
  `;

  openModal('Detalle del Proveedor', body, `<button class="btn btn-outline" onclick="closeModal()">Cerrar</button>`);
}

async function openProveedorForm(id = null) {
  let p = { nombre: '', ruc: '', email: '', contacto: '', provincia: '', ciudad: '', direccion: '', descuentos: '', estado: 'Pendiente', cantidad_producto: 0, fecha: new Date().toISOString().split('T')[0], total_pagar: 0, metodo_pago: 'Transferencia' };

  if (id) {
    const result = await DB.getById('proveedores', id);
    if (result.data) p = result.data;
  }

  const body = `
    <form id="proveedor-form">
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Nombre (Personal / Empresarial) *</label>
          <input class="form-control" name="nombre" value="${p.nombre}" required placeholder="Nombre del proveedor">
        </div>
        <div class="form-group">
          <label class="form-label">RUC</label>
          <input class="form-control" name="ruc" value="${p.ruc || ''}" placeholder="1390000000001">
        </div>
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input class="form-control" type="email" name="email" value="${p.email || ''}" placeholder="correo@proveedor.com">
        </div>
        <div class="form-group">
          <label class="form-label">Contacto</label>
          <input class="form-control" name="contacto" value="${p.contacto || ''}" placeholder="0987654321">
        </div>
        <div class="form-group">
          <label class="form-label">Provincia</label>
          <select class="form-control" name="provincia" id="prov-select" onchange="updateCiudadSelect()">
            <option value="">Selecciona Provincia</option>
            ${Object.keys(window.ecuadorLocations).map(prov => `<option value="${prov}" ${p.provincia === prov ? 'selected' : ''}>${prov}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Ciudad</label>
          <select class="form-control" name="ciudad" id="ciudad-select">
            <option value="">Selecciona Ciudad</option>
            ${p.provincia && window.ecuadorLocations[p.provincia] ? window.ecuadorLocations[p.provincia].map(c => `<option value="${c}" ${p.ciudad === c ? 'selected' : ''}>${c}</option>`).join('') : (p.ciudad ? `<option value="${p.ciudad}" selected>${p.ciudad} (Falta provincia)</option>` : '')}
          </select>
        </div>
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Dirección</label>
          <input class="form-control" name="direccion" value="${p.direccion || ''}" placeholder="Dirección completa">
        </div>
        <div class="form-group">
          <label class="form-label">Descuentos</label>
          <input class="form-control" name="descuentos" value="${p.descuentos || ''}" placeholder="5% por volumen...">
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-control" name="estado">
            ${['Pendiente', 'Confirmado', 'Entregado', 'Cancelado'].map(e => `<option ${p.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Cantidad de Producto</label>
          <input class="form-control" type="number" name="cantidad_producto" value="${p.cantidad_producto || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input class="form-control" type="date" name="fecha" value="${p.fecha || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Total / Cantidad por Pagar ($)</label>
          <input class="form-control" type="number" step="0.01" name="total_pagar" value="${p.total_pagar || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Método de Pago</label>
          <select class="form-control" name="metodo_pago">
            ${['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Cheque'].map(m => `<option ${p.metodo_pago === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveProveedor('${id || ''}')">
      <i data-lucide="save" width="14" height="14"></i> ${id ? 'Actualizar' : 'Guardar Proveedor'}
    </button>
  `;

  openModal(id ? 'Editar Proveedor' : 'Nuevo Proveedor', body, footer, 'modal-lg');
}

async function saveProveedor(id) {
  const form = document.getElementById('proveedor-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  if (!data.nombre.trim()) {
    showToast('El nombre del proveedor es obligatorio', 'warning');
    return;
  }

  data.cantidad_producto = parseInt(data.cantidad_producto) || 0;
  data.total_pagar = parseFloat(data.total_pagar) || 0;

  if (id) {
    await DB.update('proveedores', id, data);
    showToast('Proveedor actualizado', 'success');
  } else {
    await DB.create('proveedores', data);
    showToast('Proveedor creado', 'success');
  }

  closeModal();
  renderProveedores();
}

function deleteProveedor(id, nombre) {
  showConfirm(`¿Deseas eliminar el proveedor <strong>${nombre}</strong>?`, async () => {
    await DB.delete('proveedores', id);
    showToast('Proveedor eliminado', 'danger');
    renderProveedores();
  });
}

window.ecuadorLocations = {
  "Azuay": ["Cuenca", "Camilo Ponce Enríquez", "Chordeleg", "El Pan", "Girón", "Guachapala", "Gualaceo", "Nabón", "Oña", "Paute", "Pucará", "San Fernando", "Santa Isabel", "Sevilla de Oro", "Sígsig"],
  "Bolívar": ["Guaranda", "Caluma", "Chillanes", "Chimbo", "Echeandía", "Las Naves", "San Miguel"],
  "Cañar": ["Azogues", "Biblián", "Cañar", "Déleg", "El Tambo", "La Troncal", "Suscal"],
  "Carchi": ["Tulcán", "Bolívar", "Espejo", "Mira", "Montúfar", "San Pedro de Huaca"],
  "Chimborazo": ["Riobamba", "Alausí", "Chambo", "Chunchi", "Colta", "Cumandá", "Guamote", "Guano", "Pallatanga", "Penipe"],
  "Cotopaxi": ["Latacunga", "La Maná", "Pangua", "Pujilí", "Salcedo", "Saquisilí", "Sigchos"],
  "El Oro": ["Machala", "Arenillas", "Atahualpa", "Balsas", "Chilla", "El Guabo", "Huaquillas", "Las Lajas", "Marcabelí", "Pasaje", "Piñas", "Portovelo", "Santa Rosa", "Zaruma"],
  "Esmeraldas": ["Esmeraldas", "Atacames", "Eloy Alfaro", "Muisne", "Quinindé", "Rioverde", "San Lorenzo"],
  "Galápagos": ["San Cristóbal", "Isabela", "Santa Cruz"],
  "Guayas": ["Guayaquil", "Alfredo Baquerizo Moreno (Juján)", "Balao", "Balzar", "Colimes", "Coronel Marcelino Maridueña", "Daule", "Durán", "El Empalme", "El Triunfo", "General Antonio Elizalde (Bucay)", "Isidro Ayora", "Lomas de Sargentillo", "Milagro", "Naranjal", "Naranjito", "Nobol", "Palestina", "Pedro Carbo", "Playas", "Salitre", "Samborondón", "Santa Lucía", "Simón Bolívar", "Yaguachi"],
  "Imbabura": ["Ibarra", "Antonio Ante", "Cotacachi", "Otavalo", "Pimampiro", "San Miguel de Urcuquí"],
  "Loja": ["Loja", "Calvas", "Catamayo", "Celica", "Chaguarpamba", "Espíndola", "Gonzanamá", "Macará", "Olmedo", "Paltas", "Pindal", "Puyango", "Quilanga", "Saraguro", "Sozoranga", "Zapotillo"],
  "Los Ríos": ["Babahoyo", "Baba", "Buena Fe", "Mocache", "Montalvo", "Palenque", "Puebloviejo", "Quevedo", "Quinsaloma", "Urdaneta", "Valencia", "Ventanas", "Vinces"],
  "Manabí": ["Portoviejo", "24 de Mayo", "Bolívar", "Chone", "El Carmen", "Flavio Alfaro", "Jama", "Jaramijó", "Jipijapa", "Junín", "Manta", "Montecristi", "Olmedo", "Paján", "Pedernales", "Pichincha", "Puerto López", "Rocafuerte", "San Vicente", "Santa Ana", "Sucre", "Tosagua"],
  "Morona Santiago": ["Macas", "Gualaquiza", "Huamboya", "Limón Indanza", "Logroño", "Morona", "Pablo Sexto", "Palora", "San Juan Bosco", "Santiago de Méndez", "Sucúa", "Taisha", "Tiwintza"],
  "Napo": ["Tena", "Archidona", "Carlos Julio Arosemena Tola", "El Chaco", "Quijos"],
  "Orellana": ["Francisco de Orellana", "Aguarico", "La Joya de los Sachas", "Loreto"],
  "Pastaza": ["Puyo", "Arajuno", "Mera", "Santa Clara"],
  "Pichincha": ["Quito", "Cayambe", "Mejía (Machachi)", "Pedro Moncayo", "Pedro Vicente Maldonado", "Puerto Quito", "Rumiñahui (Sangolquí)", "San Miguel de los Bancos"],
  "Santa Elena": ["Santa Elena", "La Libertad", "Salinas"],
  "Santo Domingo de los Tsáchilas": ["Santo Domingo", "La Concordia"],
  "Sucumbíos": ["Nueva Loja", "Cascales", "Cuyabeno", "Gonzalo Pizarro", "Putumayo", "Shushufindi", "Sucumbíos"],
  "Tungurahua": ["Ambato", "Baños de Agua Santa", "Cevallos", "Mocha", "Patate", "Pelileo", "Píllaro", "Quero", "Tisaleo"],
  "Zamora Chinchipe": ["Zamora", "Centinela del Cóndor", "Chinchipe", "El Pangui", "Nangaritza", "Palanda", "Paquisha", "Yacuambi", "Yantzaza"]
};

window.updateCiudadSelect = function() {
  const provSelect = document.getElementById('prov-select');
  const ciudSelect = document.getElementById('ciudad-select');
  const selectedProv = provSelect.value;
  
  if (!selectedProv || !window.ecuadorLocations[selectedProv]) {
    ciudSelect.innerHTML = '<option value="">Selecciona Ciudad</option>';
    return;
  }
  
  ciudSelect.innerHTML = '<option value="">Selecciona Ciudad</option>' + 
    window.ecuadorLocations[selectedProv].map(c => `<option value="${c}">${c}</option>`).join('');
};
