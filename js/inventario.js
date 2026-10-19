/* ================================================
   Inventario Module — CRUD + alertas de stock
   ================================================ */

async function renderInventario() {
  const content = document.getElementById('page-content');
  const { data: inventario } = await DB.getAll('inventario');

  const stockBajo = inventario.filter(i => i.stock_actual <= i.stock_minimo);
  const valorTotal = inventario.reduce((s, i) => s + (i.total || 0), 0);

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventario</h1>
        <p class="page-subtitle">${inventario.length} insumos · Valor total: ${formatCurrency(valorTotal)}</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openInventarioForm()">
          <i data-lucide="package-plus" width="16" height="16"></i> Nuevo Insumo
        </button>
      </div>
    </div>

    ${stockBajo.length > 0 ? `
      <div class="alert-bar warning">
        <i data-lucide="alert-triangle" width="18" height="18"></i>
        <strong>⚠️ ${stockBajo.length} insumo${stockBajo.length > 1 ? 's' : ''} con stock bajo:</strong>
        ${stockBajo.map(i => i.nombre).join(', ')}
      </div>
    ` : `
      <div class="alert-bar success">
        <i data-lucide="check-circle" width="18" height="18"></i>
        ✅ Todos los insumos tienen stock suficiente.
      </div>
    `}

    <div class="toolbar">
      <div class="toolbar-left">
        <div class="toolbar-search">
          <i data-lucide="search" width="14" height="14"></i>
          <input type="text" id="inventario-search" placeholder="Buscar insumo..." oninput="filterInventario()">
        </div>
        <select class="filter-select" id="filter-categoria-inv" onchange="filterInventario()">
          <option value="">Todas las categorías</option>
          ${[...new Set(inventario.map(i => i.categoria))].map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select class="filter-select" id="filter-estado-inv" onchange="filterInventario()">
          <option value="">Todos los estados</option>
          <option value="Disponible">Disponible</option>
          <option value="Stock Bajo">Stock Bajo</option>
          <option value="Agotado">Agotado</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Categoría</th>
              <th>Stock Actual</th>
              <th>Stock Mín / Máx</th>
              <th>Nivel</th>
              <th>Costo Unit.</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="inventario-body"></tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  renderInventarioTable(inventario);
}

function renderInventarioTable(inventario) {
  const tbody = document.getElementById('inventario-body');
  if (!tbody) return;

  if (inventario.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No se encontraron insumos</td></tr>`;
    return;
  }

  tbody.innerHTML = inventario.map(i => {
    // Calculate stock level
    const pct = i.stock_maximo > 0 ? Math.min((i.stock_actual / i.stock_maximo) * 100, 100) : 0;
    const isLow = i.stock_actual <= i.stock_minimo;
    const isOut = i.stock_actual === 0;
    const barClass = isOut ? 'critical' : isLow ? 'low' : 'ok';
    const estado = isOut ? 'Agotado' : isLow ? 'Stock Bajo' : 'Disponible';

    return `
      <tr style="${isLow ? 'background: var(--warning-bg);' : ''}">
        <td>
          <div style="font-weight: 600;">${i.nombre}</div>
          <div style="font-size: 11px; color: var(--text-muted);">ID: ${i.id}</div>
        </td>
        <td>
          <span style="background: var(--bg-alt); padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;">${i.categoria}</span>
        </td>
        <td>
          <div style="font-weight: 700; font-size: var(--fs-md); color: ${isLow ? 'var(--danger)' : 'var(--text)'};">
            ${i.stock_actual}
            ${isLow ? ' ⚠️' : ''}
          </div>
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">
          ${i.stock_minimo} / ${i.stock_maximo}
        </td>
        <td style="min-width: 120px;">
          <div class="stock-bar">
            <div class="stock-bar-fill ${barClass}" style="width: ${pct}%;"></div>
          </div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${pct.toFixed(0)}%</div>
        </td>
        <td>${formatCurrency(i.costo_unitario)}</td>
        <td style="font-weight: 600;">${formatCurrency(i.total)}</td>
        <td><span class="badge ${getBadgeClass(estado)}">${estado}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost btn-sm" onclick="openInventarioForm('${i.id}')" title="Editar">
              <i data-lucide="pencil" width="14" height="14"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="deleteInventario('${i.id}', '${i.nombre.replace(/'/g, "\\'")}')" title="Eliminar" style="color: var(--danger);">
              <i data-lucide="trash-2" width="14" height="14"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

async function filterInventario() {
  const search = document.getElementById('inventario-search')?.value || '';
  const categoria = document.getElementById('filter-categoria-inv')?.value || '';
  const estado = document.getElementById('filter-estado-inv')?.value || '';

  let { data: inventario } = await DB.getAll('inventario');

  if (search) {
    const q = search.toLowerCase();
    inventario = inventario.filter(i => i.nombre.toLowerCase().includes(q));
  }

  if (categoria) inventario = inventario.filter(i => i.categoria === categoria);

  if (estado) {
    inventario = inventario.filter(i => {
      const isLow = i.stock_actual <= i.stock_minimo;
      const isOut = i.stock_actual === 0;
      const st = isOut ? 'Agotado' : isLow ? 'Stock Bajo' : 'Disponible';
      return st === estado;
    });
  }

  renderInventarioTable(inventario);
}

async function openInventarioForm(id = null) {
  let i = { nombre: '', categoria: '', stock_actual: 0, stock_minimo: 0, stock_maximo: 0, costo_unitario: 0, total: 0, estado: 'Disponible' };

  if (id) {
    const result = await DB.getById('inventario', id);
    if (result.data) i = result.data;
  }

  const categorias = ['Café', 'Lácteos', 'Endulzantes', 'Empaques', 'Jarabes', 'Ingredientes', 'Frutas', 'Insumos'];

  const body = `
    <form id="inventario-form">
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Nombre del Insumo *</label>
          <input class="form-control" name="nombre" value="${i.nombre}" required placeholder="Nombre del insumo">
        </div>
        <div class="form-group">
          <label class="form-label">Categoría *</label>
          <select class="form-control" name="categoria" required>
            <option value="">Seleccionar</option>
            ${categorias.map(c => `<option ${i.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Stock Actual</label>
          <input class="form-control" type="number" name="stock_actual" id="inv-stock" value="${i.stock_actual}" min="0" onchange="calcularTotalInventario()">
        </div>
        <div class="form-group">
          <label class="form-label">Stock Mínimo</label>
          <input class="form-control" type="number" name="stock_minimo" value="${i.stock_minimo}" min="0">
          <span class="form-hint">Alerta cuando sea igual o menor</span>
        </div>
        <div class="form-group">
          <label class="form-label">Stock Máximo</label>
          <input class="form-control" type="number" name="stock_maximo" value="${i.stock_maximo}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Costo Unitario ($)</label>
          <input class="form-control" type="number" step="0.01" name="costo_unitario" id="inv-costo" value="${i.costo_unitario}" onchange="calcularTotalInventario()">
        </div>
        <div class="form-group">
          <label class="form-label">Total ($)</label>
          <input class="form-control" type="number" step="0.01" name="total" id="inv-total" value="${i.total}" readonly style="background: var(--bg-alt); font-weight: 700;">
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveInventario('${id || ''}')">
      <i data-lucide="save" width="14" height="14"></i> ${id ? 'Actualizar' : 'Guardar Insumo'}
    </button>
  `;

  openModal(id ? 'Editar Insumo' : 'Nuevo Insumo', body, footer);
}

function calcularTotalInventario() {
  const stock = parseFloat(document.getElementById('inv-stock')?.value || 0);
  const costo = parseFloat(document.getElementById('inv-costo')?.value || 0);
  const totalEl = document.getElementById('inv-total');
  if (totalEl) totalEl.value = (stock * costo).toFixed(2);
}

async function saveInventario(id) {
  const form = document.getElementById('inventario-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  if (!data.nombre.trim() || !data.categoria) {
    showToast('El nombre y la categoría son obligatorios', 'warning');
    return;
  }

  data.stock_actual = parseInt(data.stock_actual) || 0;
  data.stock_minimo = parseInt(data.stock_minimo) || 0;
  data.stock_maximo = parseInt(data.stock_maximo) || 0;
  data.costo_unitario = parseFloat(data.costo_unitario) || 0;
  data.total = parseFloat(data.total) || 0;

  // Auto-set estado
  if (data.stock_actual === 0) data.estado = 'Agotado';
  else if (data.stock_actual <= data.stock_minimo) data.estado = 'Stock Bajo';
  else data.estado = 'Disponible';

  if (id) {
    await DB.update('inventario', id, data);
    showToast('Insumo actualizado', 'success');
  } else {
    await DB.create('inventario', data);
    showToast('Insumo creado', 'success');
  }

  closeModal();
  renderInventario();
  updateStockBadge();
}

function deleteInventario(id, nombre) {
  showConfirm(`¿Deseas eliminar el insumo <strong>${nombre}</strong>?`, async () => {
    await DB.delete('inventario', id);
    showToast('Insumo eliminado', 'danger');
    renderInventario();
    updateStockBadge();
  });
}
