/* ================================================
   Promociones Module — CRUD con tarjetas
   ================================================ */

async function renderPromociones() {
  const content = document.getElementById('page-content');
  const { data: promociones } = await DB.getAll('promociones');

  const activas = promociones.filter(p => p.activa);

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Promociones</h1>
        <p class="page-subtitle">${activas.length} activas de ${promociones.length} promociones</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openPromocionForm()">
          <i data-lucide="tag" width="16" height="16"></i> Nueva Promoción
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <select class="filter-select" id="filter-promo-estado" onchange="filterPromociones()">
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </div>
    </div>

    <div id="promociones-container"></div>
  `;

  if (window.lucide) lucide.createIcons();
  renderPromocionesCards(promociones);
}

function renderPromocionesCards(promociones) {
  const container = document.getElementById('promociones-container');
  if (!container) return;

  if (promociones.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="tag" width="64" height="64"></i>
        <h3>No hay promociones</h3>
        <p>Crea tu primera promoción para atraer más clientes.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="promo-grid">
      ${promociones.map(p => `
        <div class="promo-card" style="${!p.activa ? 'opacity: 0.6; background: linear-gradient(135deg, #546E7A 0%, #455A64 100%);' : ''}">
          <div style="position: relative; z-index: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-xs);">
              <div class="promo-card-discount">${p.descuento}%</div>
              <span class="badge ${p.activa ? 'badge-activo' : 'badge-inactivo'}" style="background: rgba(255,255,255,0.2); color: white;">${p.activa ? 'Activa' : 'Inactiva'}</span>
            </div>
            <div class="promo-card-name">${p.nombre}</div>
            <div class="promo-card-desc">${p.descripcion || 'Sin descripción'}</div>
            <div style="font-size: 12px; opacity: 0.65; margin-bottom: var(--space-sm);">
              <div>🏷️ ${p.tipo_promocion || 'General'}</div>
              <div>📦 ${p.producto_aplicable || 'Todo el menú'}</div>
            </div>
            <div class="promo-card-actions">
              <button class="btn btn-sm" style="background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.2);" onclick="openPromocionForm('${p.id}')">
                <i data-lucide="pencil" width="12" height="12"></i> Editar
              </button>
              <button class="btn btn-sm" style="background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.2);" onclick="togglePromocion('${p.id}', ${!p.activa})">
                <i data-lucide="${p.activa ? 'pause' : 'play'}" width="12" height="12"></i> ${p.activa ? 'Desactivar' : 'Activar'}
              </button>
              <button class="btn btn-sm" style="background: rgba(200,40,40,0.3); color: white; border: 1px solid rgba(200,40,40,0.3);" onclick="deletePromocion('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')">
                <i data-lucide="trash-2" width="12" height="12"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

async function filterPromociones() {
  const estado = document.getElementById('filter-promo-estado')?.value || '';
  let { data: promociones } = await DB.getAll('promociones');

  if (estado === 'true') promociones = promociones.filter(p => p.activa);
  else if (estado === 'false') promociones = promociones.filter(p => !p.activa);

  renderPromocionesCards(promociones);
}

async function openPromocionForm(id = null) {
  let p = { nombre: '', descripcion: '', tipo_promocion: '', descuento: 0, producto_aplicable: '', activa: true };

  if (id) {
    const result = await DB.getById('promociones', id);
    if (result.data) p = result.data;
  }

  const { data: productos } = await DB.getAll('productos');
  
  const grupos = productos.reduce((acc, prod) => {
    const categoria = prod.tipo_producto || 'Otros';
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(prod);
    return acc;
  }, {});

  let opcionesProductos = `<option value="Todo el menú" ${p.producto_aplicable === 'Todo el menú' || !p.producto_aplicable ? 'selected' : ''}>Todo el menú</option>`;
  
  for (const [categoria, prods] of Object.entries(grupos)) {
    opcionesProductos += `<optgroup label="${categoria}">`;
    opcionesProductos += `<option value="Categoría: ${categoria}" ${p.producto_aplicable === 'Categoría: ' + categoria ? 'selected' : ''}>► Toda la categoría: ${categoria}</option>`;
    opcionesProductos += prods.map(prod => `<option value="${prod.nombre}" ${p.producto_aplicable === prod.nombre ? 'selected' : ''}>${prod.nombre}</option>`).join('');
    opcionesProductos += `</optgroup>`;
  }

  const body = `
    <form id="promocion-form">
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Nombre de la Promoción *</label>
          <input class="form-control" name="nombre" value="${p.nombre}" required placeholder="Happy Hour, 2x1 Frappés...">
        </div>
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Descripción</label>
          <textarea class="form-control" name="descripcion" rows="2" placeholder="Descripción de la promoción...">${p.descripcion || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de Promoción</label>
          <select class="form-control" name="tipo_promocion">
            <option value="">Seleccionar</option>
            ${['Descuento Porcentual', '2x1', 'Combo', 'Happy Hour', 'Temporada', 'Producto Gratis'].map(t => `<option ${p.tipo_promocion === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Descuento (%)</label>
          <input class="form-control" type="number" name="descuento" value="${p.descuento}" min="0" max="100">
        </div>
        <div class="form-group">
          <label class="form-label">Producto Aplicable</label>
          <select class="form-control" name="producto_aplicable">
            ${opcionesProductos}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-control" name="activa">
            <option value="true" ${p.activa ? 'selected' : ''}>Activa</option>
            <option value="false" ${!p.activa ? 'selected' : ''}>Inactiva</option>
          </select>
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="savePromocion('${id || ''}')">
      <i data-lucide="save" width="14" height="14"></i> ${id ? 'Actualizar' : 'Crear Promoción'}
    </button>
  `;

  openModal(id ? 'Editar Promoción' : 'Nueva Promoción', body, footer);
}

async function savePromocion(id) {
  const form = document.getElementById('promocion-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  if (!data.nombre.trim()) {
    showToast('El nombre de la promoción es obligatorio', 'warning');
    return;
  }

  data.descuento = parseFloat(data.descuento) || 0;
  data.activa = data.activa === 'true';

  if (id) {
    await DB.update('promociones', id, data);
    showToast('Promoción actualizada', 'success');
  } else {
    await DB.create('promociones', data);
    showToast('Promoción creada', 'success');
  }

  closeModal();
  renderPromociones();
}

async function togglePromocion(id, newState) {
  await DB.update('promociones', id, { activa: newState });
  showToast(`Promoción ${newState ? 'activada' : 'desactivada'}`, 'info');
  renderPromociones();
}

function deletePromocion(id, nombre) {
  showConfirm(`¿Deseas eliminar la promoción <strong>${nombre}</strong>?`, async () => {
    await DB.delete('promociones', id);
    showToast('Promoción eliminada', 'danger');
    renderPromociones();
  });
}
