/* ================================================
   Dashboard Module — KPIs, Charts & Analytics
   ================================================ */

async function renderDashboard() {
  const content = document.getElementById('page-content');
  
  // Fetch all data
  const { data: clientes } = await DB.getAll('clientes');
  const { data: productos } = await DB.getAll('productos');
  const { data: ventas } = await DB.getAll('ventas');
  const { data: reservaciones } = await DB.getAll('reservaciones');
  const { data: inventario } = await DB.getAll('inventario');

  // Calculate KPIs
  const hoy = new Date().toISOString().split('T')[0];
  const hace7dias = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const ventasHoy = ventas.filter(v => v.fecha_pedido === hoy);
  const ventasSemana = ventas.filter(v => v.fecha_pedido >= hace7dias);
  const ventasMes = ventas.filter(v => v.fecha_pedido >= inicioMes);
  const pedidosPendientes = ventas.filter(v => ['Pendiente', 'Confirmado', 'Preparado'].includes(v.estado));
  const stockBajo = inventario.filter(i => i.stock_actual <= i.stock_minimo);
  const proximasReservas = reservaciones.filter(r => r.fecha >= hoy && r.estado !== 'Cancelada' && r.estado !== 'No asistió')
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)).slice(0, 5);

  const totalVentasHoy = ventasHoy.reduce((s, v) => s + (v.total || 0), 0);
  const totalVentasSemana = ventasSemana.reduce((s, v) => s + (v.total || 0), 0);
  const totalVentasMes = ventasMes.reduce((s, v) => s + (v.total || 0), 0);

  // Top products by count
  const productCount = {};
  ventas.forEach(v => {
    if (v.estado !== 'Cancelado') {
      productCount[v.producto_nombre] = (productCount[v.producto_nombre] || 0) + (v.cantidad || 1);
    }
  });
  const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top clients by purchases
  const topClientes = [...clientes].sort((a, b) => (b.num_compras || 0) - (a.num_compras || 0)).slice(0, 5);

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Resumen general de Oveja Negra</p>
      </div>
      <div class="page-actions">
        <span class="header-date" style="font-size: var(--fs-sm); color: var(--text-muted);">
          <i data-lucide="calendar" width="14" height="14"></i>
          ${new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon primary"><i data-lucide="users" width="24" height="24"></i></div>
        <div class="kpi-info">
          <div class="kpi-label">Total Clientes</div>
          <div class="kpi-value">${clientes.length}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon secondary"><i data-lucide="coffee" width="24" height="24"></i></div>
        <div class="kpi-info">
          <div class="kpi-label">Productos</div>
          <div class="kpi-value">${productos.length}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon success"><i data-lucide="shopping-bag" width="24" height="24"></i></div>
        <div class="kpi-info">
          <div class="kpi-label">Ventas Realizadas</div>
          <div class="kpi-value">${ventas.filter(v => v.estado === 'Entregado').length}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon info"><i data-lucide="calendar-check" width="24" height="24"></i></div>
        <div class="kpi-info">
          <div class="kpi-label">Reservaciones</div>
          <div class="kpi-value">${reservaciones.length}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon warning"><i data-lucide="clock" width="24" height="24"></i></div>
        <div class="kpi-info">
          <div class="kpi-label">Pedidos Pendientes</div>
          <div class="kpi-value">${pedidosPendientes.length}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon danger"><i data-lucide="alert-triangle" width="24" height="24"></i></div>
        <div class="kpi-info">
          <div class="kpi-label">Stock Bajo</div>
          <div class="kpi-value">${stockBajo.length}</div>
          <div class="kpi-change down">${stockBajo.length > 0 ? 'Requiere atención' : 'Todo en orden'}</div>
        </div>
      </div>
    </div>

    <!-- Sales Summary Cards -->
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: var(--space-xl);">
      <div class="kpi-card" style="border-top: 3px solid var(--success);">
        <div class="kpi-info" style="text-align: center; width: 100%;">
          <div class="kpi-label">Ventas Hoy</div>
          <div class="kpi-value" style="color: var(--success);">${formatCurrency(totalVentasHoy)}</div>
          <div class="kpi-change">${ventasHoy.length} pedidos</div>
        </div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid var(--info);">
        <div class="kpi-info" style="text-align: center; width: 100%;">
          <div class="kpi-label">Ventas Semana</div>
          <div class="kpi-value" style="color: var(--info);">${formatCurrency(totalVentasSemana)}</div>
          <div class="kpi-change">${ventasSemana.length} pedidos</div>
        </div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid var(--secondary);">
        <div class="kpi-info" style="text-align: center; width: 100%;">
          <div class="kpi-label">Ventas del Mes</div>
          <div class="kpi-value" style="color: var(--secondary);">${formatCurrency(totalVentasMes)}</div>
          <div class="kpi-change">${ventasMes.length} pedidos</div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="bar-chart-3" width="18" height="18"></i> Ventas Últimos 7 Días</h3>
        </div>
        <div class="card-body">
          <div class="chart-container">
            <canvas id="chart-ventas-semana"></canvas>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="pie-chart" width="18" height="18"></i> Productos Más Vendidos</h3>
        </div>
        <div class="card-body">
          <div class="chart-container">
            <canvas id="chart-productos"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Grid: Lists -->
    <div class="charts-grid-equal">
      <!-- Top Clients -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="star" width="18" height="18"></i> Clientes Frecuentes</h3>
          <button class="btn btn-ghost btn-sm" onclick="window.location.hash='clientes'">Ver todos</button>
        </div>
        <div class="card-body">
          <ul class="dash-list">
            ${topClientes.map(c => `
              <li class="dash-list-item">
                <div class="dash-list-info">
                  <div class="dash-list-avatar">${getInitials(c.nombres)}</div>
                  <div>
                    <div class="dash-list-name">${truncate(c.nombres, 25)}</div>
                    <div class="dash-list-meta">${c.num_compras} compras · ${formatCurrency(c.gasto_acumulado)}</div>
                  </div>
                </div>
                <span class="badge ${getBadgeClass(c.nivel_fidelizacion)}">${c.nivel_fidelizacion}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <!-- Stock Bajo + Próximas Reservas -->
      <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
        <!-- Low Stock -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i data-lucide="package-minus" width="18" height="18"></i> Stock Bajo</h3>
            <button class="btn btn-ghost btn-sm" onclick="window.location.hash='inventario'">Gestionar</button>
          </div>
          <div class="card-body" style="padding: var(--space-sm) var(--space-lg);">
            ${stockBajo.length === 0 ? '<p style="text-align:center; color: var(--text-muted); padding: var(--space-md);">✅ Todo el inventario en orden</p>' : ''}
            <ul class="dash-list">
              ${stockBajo.slice(0, 5).map(i => `
                <li class="dash-list-item">
                  <div>
                    <div class="dash-list-name">${i.nombre}</div>
                    <div class="dash-list-meta">${i.categoria}</div>
                  </div>
                  <div style="text-align:right;">
                    <span style="font-weight: 700; color: var(--danger);">${i.stock_actual}</span>
                    <span style="color: var(--text-muted);">/ ${i.stock_minimo} mín</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <!-- Upcoming Reservations -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i data-lucide="calendar-days" width="18" height="18"></i> Próximas Reservaciones</h3>
            <button class="btn btn-ghost btn-sm" onclick="window.location.hash='reservaciones'">Ver agenda</button>
          </div>
          <div class="card-body" style="padding: var(--space-sm) var(--space-lg);">
            ${proximasReservas.length === 0 ? '<p style="text-align:center; color: var(--text-muted); padding: var(--space-md);">No hay reservaciones próximas</p>' : ''}
            <ul class="dash-list">
              ${proximasReservas.map(r => `
                <li class="dash-list-item">
                  <div>
                    <div class="dash-list-name">${truncate(r.nombre_cliente, 20)}</div>
                    <div class="dash-list-meta">${formatDate(r.fecha)} · ${r.hora} · ${r.num_personas} personas</div>
                  </div>
                  <span class="badge ${getBadgeClass(r.estado)}">${r.estado}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Render Charts
  renderWeeklyChart(ventas);
  renderProductsChart(topProducts);
}

// ---- Weekly Sales Chart ----
function renderWeeklyChart(ventas) {
  const canvas = document.getElementById('chart-ventas-semana');
  if (!canvas) return;

  const labels = [];
  const data = [];
  const diasAbrev = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(diasAbrev[d.getDay()] + ' ' + d.getDate());
    const dayTotal = ventas
      .filter(v => v.fecha_pedido === dateStr && v.estado !== 'Cancelado')
      .reduce((sum, v) => sum + (v.total || 0), 0);
    data.push(+dayTotal.toFixed(2));
  }

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ventas ($)',
        data,
        backgroundColor: 'rgba(139, 94, 60, 0.7)',
        borderColor: '#8B5E3C',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#2C1810',
          titleFont: { family: 'Inter' },
          bodyFont: { family: 'Inter' },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ' $' + ctx.raw.toFixed(2)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: {
            font: { family: 'Inter', size: 11 },
            callback: (v) => '$' + v
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      }
    }
  });
}

// ---- Top Products Chart ----
function renderProductsChart(topProducts) {
  const canvas = document.getElementById('chart-productos');
  if (!canvas) return;

  const colors = [
    'rgba(139, 94, 60, 0.85)',
    'rgba(212, 165, 116, 0.85)',
    'rgba(44, 24, 16, 0.75)',
    'rgba(166, 123, 91, 0.8)',
    'rgba(232, 201, 168, 0.85)'
  ];

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: topProducts.map(p => p[0]),
      datasets: [{
        data: topProducts.map(p => p[1]),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { family: 'Inter', size: 11 }
          }
        },
        tooltip: {
          backgroundColor: '#2C1810',
          titleFont: { family: 'Inter' },
          bodyFont: { family: 'Inter' },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} vendidos`
          }
        }
      }
    }
  });
}
