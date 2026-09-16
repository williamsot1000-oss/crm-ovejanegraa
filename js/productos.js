/* ================================================
   Productos Module — CRUD con vista tarjeta y tabla
   ================================================ */

let productosView = 'grid'; // 'grid' or 'table'

async function renderProductos() {
  const content = document.getElementById('page-content');
  const { data: productos } = await DB.getAll('productos');

  const categorias = [...new Set(productos.map(p => p.tipo_producto))];

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Productos</h1>
        <p class="page-subtitle">${productos.length} productos en el menú</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openProductoForm()">
          <i data-lucide="plus" width="16" height="16"></i> Nuevo Producto
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <div class="toolbar-search">
          <i data-lucide="search" width="14" height="14"></i>
          <input type="text" id="productos-search" placeholder="Buscar producto..." oninput="filterProductos()">
        </div>
        <select class="filter-select" id="filter-categoria" onchange="filterProductos()">
          <option value="">Todas las categorías</option>
          ${categorias.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div class="view-toggle">
        <button class="${productosView === 'grid' ? 'active' : ''}" onclick="productosView='grid'; filterProductos()">
          <i data-lucide="layout-grid" width="16" height="16"></i>
        </button>
        <button class="${productosView === 'table' ? 'active' : ''}" onclick="productosView='table'; filterProductos()">
          <i data-lucide="list" width="16" height="16"></i>
        </button>
      </div>
    </div>

    <div id="productos-container"></div>
  `;

  if (window.lucide) lucide.createIcons();
  renderProductosList(productos);
}

function renderProductosList(productos) {
  const container = document.getElementById('productos-container');
  if (!container) return;

  if (productos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="coffee" width="64" height="64"></i>
        <h3>No se encontraron productos</h3>
        <p>Ajusta los filtros o agrega un nuevo producto.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (productosView === 'grid') {
    container.innerHTML = `
      <div class="products-grid">
        ${productos.map(p => {
          const stockStatus = p.stock_actual <= 5 ? 'out' : p.stock_actual <= 15 ? 'low' : 'ok';
          const stockLabel = p.stock_actual <= 5 ? 'Bajo' : p.stock_actual <= 15 ? 'Medio' : 'Disponible';
          return `
            <div class="product-card">
              <div class="product-card-img">
                ${getProductEmoji(p.tipo_producto)}
              </div>
              <div class="product-card-body">
                <div class="product-card-category">${p.tipo_producto}</div>
                <div class="product-card-name">${p.nombre}</div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div class="product-card-price">${formatCurrency(p.precio)}</div>
                  ${p.mas_vendido ? '<span class="badge badge-fidelizado">⭐ Top</span>' : ''}
                </div>
              </div>
              <div class="product-card-footer">
                <div class="product-stock">
                  <span class="stock-dot ${stockStatus}"></span>
                  Stock: ${p.stock_actual} · ${stockLabel}
                </div>
                <div class="table-actions">
                  <button class="btn btn-ghost btn-sm" onclick="openProductoForm('${p.id}')" title="Editar">
                    <i data-lucide="pencil" width="14" height="14"></i>
                  </button>
                  <button class="btn btn-ghost btn-sm" onclick="deleteProducto('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')" title="Eliminar" style="color: var(--danger);">
                    <i data-lucide="trash-2" width="14" height="14"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Disponible</th>
                <th>Top</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${productos.map(p => {
                const stockStatus = p.stock_actual <= 5 ? 'out' : p.stock_actual <= 15 ? 'low' : 'ok';
                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5em;">${getProductEmoji(p.tipo_producto)}</span>
                        <span style="font-weight: 600;">${p.nombre}</span>
                      </div>
                    </td>
                    <td><code style="background: var(--bg-alt); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${p.codigo}</code></td>
                    <td>${p.tipo_producto}</td>
                    <td style="font-weight: 700;">${formatCurrency(p.precio)}</td>
                    <td>
                      <div class="product-stock">
                        <span class="stock-dot ${stockStatus}"></span> ${p.stock_actual}
                      </div>
                    </td>
                    <td>${p.disponible ? '<span class="badge badge-disponible">Sí</span>' : '<span class="badge badge-agotado">No</span>'}</td>
                    <td>${p.mas_vendido ? '⭐' : '—'}</td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-ghost btn-sm" onclick="openProductoForm('${p.id}')"><i data-lucide="pencil" width="14" height="14"></i></button>
                        <button class="btn btn-ghost btn-sm" onclick="deleteProducto('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')" style="color: var(--danger);"><i data-lucide="trash-2" width="14" height="14"></i></button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

async function filterProductos() {
  const search = document.getElementById('productos-search')?.value || '';
  const categoria = document.getElementById('filter-categoria')?.value || '';

  let { data: productos } = await DB.getAll('productos');

  if (search) {
    const q = search.toLowerCase();
    productos = productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q)
    );
  }

  if (categoria) productos = productos.filter(p => p.tipo_producto === categoria);

  // Update view toggle
  document.querySelectorAll('.view-toggle button').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && productosView === 'grid') || (i === 1 && productosView === 'table'));
  });

  renderProductosList(productos);
}

async function openProductoForm(id = null) {
  let p = { tipo_producto: '', nombre: '', codigo: '', precio: 0, disponible: true, tiempo_espera: 0, imagen_url: '', stock_actual: 0, mas_vendido: false };

  if (id) {
    const result = await DB.getById('productos', id);
    if (result.data) p = result.data;
  }

  const categorias = ['Café Caliente', 'Bebida Fría', 'Bebida Caliente', 'Té', 'Postre', 'Snack', 'Desayuno'];

  const body = `
    <form id="producto-form">
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Nombre del Producto *</label>
          <input class="form-control" name="nombre" value="${p.nombre}" required placeholder="Nombre del producto">
        </div>
        <div class="form-group">
          <label class="form-label">Categoría *</label>
          <select class="form-control" name="tipo_producto" required>
            <option value="">Seleccionar categoría</option>
            ${categorias.map(c => `<option ${p.tipo_producto === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Código</label>
          <input class="form-control" name="codigo" value="${p.codigo}" placeholder="CAF-001">
        </div>
        <div class="form-group">
          <label class="form-label">Precio ($) *</label>
          <input class="form-control" type="number" step="0.01" name="precio" value="${p.precio}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Stock Actual</label>
          <input class="form-control" type="number" name="stock_actual" value="${p.stock_actual}">
        </div>
        <div class="form-group">
          <label class="form-label">Tiempo de Espera (min)</label>
          <input class="form-control" type="number" name="tiempo_espera" value="${p.tiempo_espera || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Disponible</label>
          <select class="form-control" name="disponible">
            <option value="true" ${p.disponible ? 'selected' : ''}>Sí</option>
            <option value="false" ${!p.disponible ? 'selected' : ''}>No</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Imagen del Producto</label>
          <input class="form-control" type="file" id="imagen-upload" accept="image/*" onchange="handleImageUpload(event)">
          <input type="hidden" name="imagen_url" id="imagen-base64" value="${p.imagen_url || ''}">
          <div style="margin-top: 8px;">
            ${p.imagen_url ? `<img src="${p.imagen_url}" id="imagen-preview" style="max-height: 60px; border-radius: 4px;">` : `<img id="imagen-preview" style="max-height: 60px; border-radius: 4px; display: none;">`}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Producto Más Vendido</label>
          <select class="form-control" name="mas_vendido">
            <option value="false" ${!p.mas_vendido ? 'selected' : ''}>No</option>
            <option value="true" ${p.mas_vendido ? 'selected' : ''}>Sí</option>
          </select>
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveProducto('${id || ''}')">
      <i data-lucide="save" width="14" height="14"></i> ${id ? 'Actualizar' : 'Guardar'}
    </button>
  `;

  openModal(id ? 'Editar Producto' : 'Nuevo Producto', body, footer);
}

async function saveProducto(id) {
  const form = document.getElementById('producto-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  if (!data.nombre.trim() || !data.tipo_producto) {
    showToast('El nombre y la categoría son obligatorios', 'warning');
    return;
  }

  data.precio = parseFloat(data.precio) || 0;
  data.stock_actual = parseInt(data.stock_actual) || 0;
  data.tiempo_espera = parseInt(data.tiempo_espera) || 0;
  data.disponible = data.disponible === 'true';
  data.mas_vendido = data.mas_vendido === 'true';

  if (id) {
    await DB.update('productos', id, data);
    showToast('Producto actualizado correctamente', 'success');
  } else {
    await DB.create('productos', data);
    showToast('Producto creado correctamente', 'success');
  }

  closeModal();
  renderProductos();
}

function deleteProducto(id, nombre) {
  showConfirm(`¿Deseas eliminar el producto <strong>${nombre}</strong>?`, async () => {
    await DB.delete('productos', id);
    showToast('Producto eliminado', 'danger');
    renderProductos();
  });
}

window.handleImageUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('imagen-base64').value = e.target.result;
    const preview = document.getElementById('imagen-preview');
    preview.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
};
