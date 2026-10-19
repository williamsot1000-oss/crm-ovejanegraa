/* ================================================
   Ventas Module — Registro y gestión de ventas
   ================================================ */

async function renderVentas() {
  const content = document.getElementById('page-content');
  const { data: ventas } = await DB.getAll('ventas');

  const totalVentas = ventas.filter(v => v.estado !== 'Cancelado').reduce((s, v) => s + (v.total || 0), 0);

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Ventas y Pedidos</h1>
        <p class="page-subtitle">${ventas.length} registros · Total: ${formatCurrency(totalVentas)}</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openVentaForm()">
          <i data-lucide="plus" width="16" height="16"></i> Nueva Venta
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <div class="toolbar-search">
          <i data-lucide="search" width="14" height="14"></i>
          <input type="text" id="ventas-search" placeholder="Buscar por código, cliente..." oninput="filterVentas()">
        </div>
        <select class="filter-select" id="filter-estado-venta" onchange="filterVentas()">
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmado">Confirmado</option>
          <option value="Preparado">Preparado</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        <select class="filter-select" id="filter-periodo-venta" onchange="filterVentas()">
          <option value="">Todo el período</option>
          <option value="hoy">Hoy</option>
          <option value="semana">Última semana</option>
          <option value="mes">Este mes</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Fecha</th>
              <th>Subtotal</th>
              <th>Desc.</th>
              <th>Impuesto</th>
              <th>Total</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="ventas-body"></tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  renderVentasTable(ventas);
}

function renderVentasTable(ventas) {
  const tbody = document.getElementById('ventas-body');
  if (!tbody) return;

  if (ventas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="table-empty">No se encontraron ventas</td></tr>`;
    return;
  }

  // Sort by date desc
  const sorted = [...ventas].sort((a, b) => (b.fecha_pedido || '').localeCompare(a.fecha_pedido || ''));

  tbody.innerHTML = sorted.map(v => `
    <tr>
      <td><code style="background: var(--bg-alt); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${v.codigo_pedido}</code></td>
      <td style="font-weight: 500;">${truncate(v.cliente_nombre, 20)}</td>
      <td>${v.producto_nombre || '—'}</td>
      <td style="text-align: center;">${v.cantidad || 1}</td>
      <td>${formatDate(v.fecha_pedido)}</td>
      <td>${formatCurrency(v.subtotal)}</td>
      <td style="color: ${v.descuento > 0 ? 'var(--success)' : 'var(--text-muted)'};">${v.descuento > 0 ? '-' + formatCurrency(v.descuento) : '—'}</td>
      <td>${formatCurrency(v.impuesto)}</td>
      <td style="font-weight: 700;">${formatCurrency(v.total)}</td>
      <td style="font-size: 12px;">${v.metodo_pago || '—'}</td>
      <td><span class="badge ${getBadgeClass(v.estado)}">${v.estado}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="viewVenta('${v.id}')" title="Ver detalle">
            <i data-lucide="eye" width="14" height="14"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="openVentaForm('${v.id}')" title="Editar">
            <i data-lucide="pencil" width="14" height="14"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteVenta('${v.id}', '${v.codigo_pedido}')" title="Eliminar" style="color: var(--danger);">
            <i data-lucide="trash-2" width="14" height="14"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

async function filterVentas() {
  const search = document.getElementById('ventas-search')?.value || '';
  const estado = document.getElementById('filter-estado-venta')?.value || '';
  const periodo = document.getElementById('filter-periodo-venta')?.value || '';

  let { data: ventas } = await DB.getAll('ventas');

  if (search) {
    const q = search.toLowerCase();
    ventas = ventas.filter(v =>
      (v.codigo_pedido || '').toLowerCase().includes(q) ||
      (v.cliente_nombre || '').toLowerCase().includes(q) ||
      (v.producto_nombre || '').toLowerCase().includes(q)
    );
  }

  if (estado) ventas = ventas.filter(v => v.estado === estado);

  if (periodo) {
    const hoy = new Date().toISOString().split('T')[0];
    const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    if (periodo === 'hoy') ventas = ventas.filter(v => v.fecha_pedido === hoy);
    else if (periodo === 'semana') ventas = ventas.filter(v => v.fecha_pedido >= hace7);
    else if (periodo === 'mes') ventas = ventas.filter(v => v.fecha_pedido >= inicioMes);
  }

  renderVentasTable(ventas);
}

async function viewVenta(id) {
  const { data: v } = await DB.getById('ventas', id);
  if (!v) return;

  const body = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Código de Pedido</div><div class="detail-value">${v.codigo_pedido}</div></div>
      <div class="detail-item"><div class="detail-label">Estado</div><div class="detail-value"><span class="badge ${getBadgeClass(v.estado)}">${v.estado}</span></div></div>
      <div class="detail-item"><div class="detail-label">Cliente</div><div class="detail-value">${v.cliente_nombre}</div></div>
      <div class="detail-item"><div class="detail-label">Producto</div><div class="detail-value">${v.producto_nombre}</div></div>
      <div class="detail-item"><div class="detail-label">Cantidad</div><div class="detail-value">${v.cantidad || 1}</div></div>
      <div class="detail-item"><div class="detail-label">Fecha</div><div class="detail-value">${formatDate(v.fecha_pedido)}</div></div>
      <div class="detail-item"><div class="detail-label">Subtotal</div><div class="detail-value">${formatCurrency(v.subtotal)}</div></div>
      <div class="detail-item"><div class="detail-label">Descuento</div><div class="detail-value">${formatCurrency(v.descuento)}</div></div>
      <div class="detail-item"><div class="detail-label">Impuesto (IVA)</div><div class="detail-value">${formatCurrency(v.impuesto)}</div></div>
      <div class="detail-item"><div class="detail-label">Total</div><div class="detail-value" style="font-weight: 800; font-size: var(--fs-lg); color: var(--success);">${formatCurrency(v.total)}</div></div>
      <div class="detail-item"><div class="detail-label">Método de Pago</div><div class="detail-value">${v.metodo_pago || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Banco</div><div class="detail-value">${v.banco || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Promoción</div><div class="detail-value">${v.promocion_nombre || 'Ninguna'}</div></div>
      <div class="detail-item"><div class="detail-label">Cantidad a Facturar</div><div class="detail-value">${formatCurrency(v.cantidad_facturar)}</div></div>
    </div>
  `;

  openModal('Detalle de Venta', body, `<button class="btn btn-outline" onclick="closeModal()">Cerrar</button>`, 'modal-lg');
}

async function openVentaForm(id = null) {
  let v = { codigo_pedido: 'PED-' + (Date.now() % 10000), cliente_id: '', cliente_nombre: '', fecha_pedido: new Date().toISOString().split('T')[0], producto_id: '', producto_nombre: '', promocion_id: '', promocion_nombre: '', estado: 'Pendiente', metodo_pago: 'Efectivo', subtotal: 0, descuento: 0, total: 0, cantidad: 1, banco: '', impuesto: 0, cantidad_facturar: 0 };

  if (id) {
    const result = await DB.getById('ventas', id);
    if (result.data) v = result.data;
  }

  const { data: clientes } = await DB.getAll('clientes');
  const { data: productos } = await DB.getAll('productos');
  const { data: promociones } = await DB.getAll('promociones');

  const body = `
    <form id="venta-form">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Código de Pedido</label>
          <input class="form-control" name="codigo_pedido" value="${v.codigo_pedido}" readonly style="background: var(--bg-alt);">
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input class="form-control" type="date" name="fecha_pedido" value="${v.fecha_pedido}">
        </div>
        <div class="form-group">
          <label class="form-label">Cliente *</label>
          <select class="form-control" name="cliente_id" id="venta-cliente" onchange="updateVentaCliente()" required>
            <option value="">Seleccionar cliente</option>
            ${clientes.map(c => `<option value="${c.id}" data-nombre="${c.nombres}" ${v.cliente_id === c.id ? 'selected' : ''}>${c.nombres}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Producto *</label>
          <select class="form-control" name="producto_id" id="venta-producto" onchange="updateVentaProducto()" required>
            <option value="">Seleccionar producto</option>
            ${productos.map(p => `<option value="${p.id}" data-nombre="${p.nombre}" data-precio="${p.precio}" ${v.producto_id === p.id ? 'selected' : ''}>${p.nombre} — ${formatCurrency(p.precio)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Cantidad</label>
          <input class="form-control" type="number" name="cantidad" id="venta-cantidad" value="${v.cantidad || 1}" min="1" onchange="calcularTotalVenta()">
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-control" name="estado">
            ${['Pendiente', 'Confirmado', 'Preparado', 'Entregado', 'Cancelado'].map(e => `<option ${v.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Promoción</label>
          <select class="form-control" name="promocion_id" id="venta-promo" onchange="updateVentaPromo()">
            <option value="">Sin promoción</option>
            ${promociones.filter(p => p.activa).map(p => `<option value="${p.id}" data-nombre="${p.nombre}" data-descuento="${p.descuento}" ${v.promocion_id === p.id ? 'selected' : ''}>${p.nombre} (${p.descuento}%)</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Método de Pago</label>
          <select class="form-control" name="metodo_pago">
            ${['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'PayPhone'].map(m => `<option ${v.metodo_pago === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Banco</label>
          <select class="form-control" name="banco">
            <option value="">Seleccionar</option>
            ${['Pichincha', 'Guayaquil', 'Pacífico', 'Produbanco', 'Bolivariano', 'Internacional', 'Otro'].map(b => `<option ${v.banco === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid var(--border-light); margin: var(--space-lg) 0;">
      
      <div class="form-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
        <div class="form-group">
          <label class="form-label">Subtotal</label>
          <input class="form-control" type="number" step="0.01" name="subtotal" id="venta-subtotal" value="${v.subtotal}" readonly style="background: var(--bg-alt); font-weight: 700;">
        </div>
        <div class="form-group">
          <label class="form-label">Descuento</label>
          <input class="form-control" type="number" step="0.01" name="descuento" id="venta-descuento" value="${v.descuento}" onchange="calcularTotalVenta()">
        </div>
        <div class="form-group">
          <label class="form-label">IVA (15%)</label>
          <input class="form-control" type="number" step="0.01" name="impuesto" id="venta-impuesto" value="${v.impuesto}" readonly style="background: var(--bg-alt);">
        </div>
        <div class="form-group">
          <label class="form-label">Total</label>
          <input class="form-control" type="number" step="0.01" name="total" id="venta-total" value="${v.total}" readonly style="background: var(--success-bg); font-weight: 800; font-size: var(--fs-lg); color: var(--success);">
        </div>
      </div>
      <input type="hidden" name="cantidad_facturar" id="venta-facturar" value="${v.cantidad_facturar}">
    </form>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveVenta('${id || ''}')">
      <i data-lucide="save" width="14" height="14"></i> ${id ? 'Actualizar' : 'Registrar Venta'}
    </button>
  `;

  openModal(id ? 'Editar Venta' : 'Nueva Venta', body, footer, 'modal-lg');
}

function updateVentaCliente() {
  // Just for tracking, actual data used on save
}

function updateVentaProducto() {
  calcularTotalVenta();
}

function updateVentaPromo() {
  calcularTotalVenta();
}

function calcularTotalVenta() {
  const productoSelect = document.getElementById('venta-producto');
  const cantidadInput = document.getElementById('venta-cantidad');
  const promoSelect = document.getElementById('venta-promo');
  const descuentoInput = document.getElementById('venta-descuento');

  if (!productoSelect || !cantidadInput) return;

  const selectedOption = productoSelect.options[productoSelect.selectedIndex];
  const precio = parseFloat(selectedOption?.dataset?.precio || 0);
  const cantidad = parseInt(cantidadInput.value) || 1;
  const subtotal = +(precio * cantidad).toFixed(2);

  // Check for promotion discount
  let descuento = 0;
  if (promoSelect && promoSelect.value) {
    const promoOption = promoSelect.options[promoSelect.selectedIndex];
    const promoDescuento = parseFloat(promoOption?.dataset?.descuento || 0);
    descuento = +(subtotal * promoDescuento / 100).toFixed(2);
  } else {
    descuento = parseFloat(descuentoInput?.value || 0);
  }

  const baseImponible = subtotal - descuento;
  const impuesto = +(baseImponible * 0.15).toFixed(2);
  const total = +(baseImponible + impuesto).toFixed(2);

  document.getElementById('venta-subtotal').value = subtotal;
  document.getElementById('venta-descuento').value = descuento;
  document.getElementById('venta-impuesto').value = impuesto;
  document.getElementById('venta-total').value = total;
  document.getElementById('venta-facturar').value = total;
}

async function saveVenta(id) {
  const form = document.getElementById('venta-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  if (!data.cliente_id || !data.producto_id) {
    showToast('Selecciona un cliente y un producto', 'warning');
    return;
  }

  // Get names from selects
  const clienteSelect = document.getElementById('venta-cliente');
  const productoSelect = document.getElementById('venta-producto');
  const promoSelect = document.getElementById('venta-promo');

  data.cliente_nombre = clienteSelect.options[clienteSelect.selectedIndex]?.dataset?.nombre || '';
  data.producto_nombre = productoSelect.options[productoSelect.selectedIndex]?.dataset?.nombre || '';
  data.promocion_nombre = promoSelect && promoSelect.value ? promoSelect.options[promoSelect.selectedIndex]?.dataset?.nombre || '' : '';

  data.subtotal = parseFloat(data.subtotal) || 0;
  data.descuento = parseFloat(data.descuento) || 0;
  data.impuesto = parseFloat(data.impuesto) || 0;
  data.total = parseFloat(data.total) || 0;
  data.cantidad = parseInt(data.cantidad) || 1;
  data.cantidad_facturar = parseFloat(data.cantidad_facturar) || 0;

  if (id) {
    await DB.update('ventas', id, data);
    showToast('Venta actualizada correctamente', 'success');
  } else {
    await DB.create('ventas', data);
    showToast('Venta registrada correctamente', 'success');
  }

  closeModal();
  renderVentas();
}

function deleteVenta(id, codigo) {
  showConfirm(`¿Deseas eliminar la venta <strong>${codigo}</strong>?`, async () => {
    await DB.delete('ventas', id);
    showToast('Venta eliminada', 'danger');
    renderVentas();
  });
}
