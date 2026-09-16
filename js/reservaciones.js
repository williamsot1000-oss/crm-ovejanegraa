/* ================================================
   Reservaciones Module — Calendario + CRUD
   ================================================ */

let reservacionesView = 'calendar'; // 'calendar' or 'list'
let fcCalendar = null;

async function renderReservaciones() {
  if (fcCalendar) {
    fcCalendar.destroy();
    fcCalendar = null;
  }
  const content = document.getElementById('page-content');
  const { data: reservaciones } = await DB.getAll('reservaciones');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Reservaciones</h1>
        <p class="page-subtitle" id="reservaciones-subtitle">${reservaciones.length} reservaciones registradas</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openReservacionForm()">
          <i data-lucide="calendar-plus" width="16" height="16"></i> Nueva Reservación
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <select class="filter-select" id="filter-estado-res" onchange="filterReservaciones()">
          <option value="">Todos los estados</option>
          <option value="Solicitada">Solicitada</option>
          <option value="Confirmada">Confirmada</option>
          <option value="En espera">En espera</option>
          <option value="Atendida">Atendida</option>
          <option value="Cancelada">Cancelada</option>
          <option value="No asistió">No asistió</option>
        </select>
      </div>
      <div class="view-toggle">
        <button class="${reservacionesView === 'calendar' ? 'active' : ''}" onclick="reservacionesView='calendar'; renderReservacionesContent()">
          <i data-lucide="calendar" width="16" height="16"></i> Calendario
        </button>
        <button class="${reservacionesView === 'list' ? 'active' : ''}" onclick="reservacionesView='list'; renderReservacionesContent()">
          <i data-lucide="list" width="16" height="16"></i> Lista
        </button>
      </div>
    </div>

    <div id="reservaciones-container"></div>
  `;

  if (window.lucide) lucide.createIcons();
  renderReservacionesContent();
}

async function renderReservacionesContent() {
  const container = document.getElementById('reservaciones-container');
  if (!container) return;

  // Update view toggle buttons
  document.querySelectorAll('.view-toggle button').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && reservacionesView === 'calendar') || (i === 1 && reservacionesView === 'list'));
  });

  const { data: allReservaciones } = await DB.getAll('reservaciones');
  const estado = document.getElementById('filter-estado-res')?.value || '';
  const filtered = estado ? allReservaciones.filter(r => r.estado === estado) : allReservaciones;

  const subtitle = document.getElementById('reservaciones-subtitle');
  if (subtitle) {
    subtitle.textContent = estado
      ? `${filtered.length} reservaciones con estado "${estado}" (de ${allReservaciones.length})`
      : `${allReservaciones.length} reservaciones registradas`;
  }

  if (reservacionesView === 'calendar') {
    const calEl = document.getElementById('fc-calendar');
    if (!calEl) {
      container.innerHTML = `<div class="card"><div class="card-body" style="padding: var(--space-lg);"><div id="fc-calendar"></div></div></div>`;
      renderCalendar(filtered);
    } else {
      updateCalendarEvents(filtered);
    }
  } else {
    if (fcCalendar) {
      fcCalendar.destroy();
      fcCalendar = null;
    }
    renderReservacionesTable(filtered);
  }
}

const resColorMap = {
  'Solicitada': '#7B1FA2',
  'Confirmada': '#1565C0',
  'En espera': '#EF6C00',
  'Atendida': '#2E7D32',
  'Cancelada': '#C62828',
  'No asistió': '#78909C'
};

function getCalendarEvents(reservaciones) {
  return reservaciones.map(r => ({
    id: r.id,
    title: `${r.hora} - ${r.nombre_cliente} (${r.num_personas}p)`,
    start: r.fecha,
    backgroundColor: resColorMap[r.estado] || '#8B5E3C',
    borderColor: resColorMap[r.estado] || '#8B5E3C',
    extendedProps: r
  }));
}

function updateCalendarEvents(reservaciones) {
  if (!fcCalendar) {
    renderCalendar(reservaciones);
    return;
  }
  fcCalendar.getEvents().forEach(ev => ev.remove());
  const newEvents = getCalendarEvents(reservaciones);
  newEvents.forEach(ev => fcCalendar.addEvent(ev));
}

function renderCalendar(reservaciones) {
  const calEl = document.getElementById('fc-calendar');
  if (!calEl || !window.FullCalendar) return;

  if (fcCalendar) {
    fcCalendar.destroy();
    fcCalendar = null;
  }

  const events = getCalendarEvents(reservaciones);

  fcCalendar = new FullCalendar.Calendar(calEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      list: 'Agenda'
    },
    events,
    eventClick: (info) => {
      viewReservacion(info.event.id);
    },
    dateClick: (info) => {
      openReservacionForm(null, info.dateStr);
    },
    height: 'auto',
    dayMaxEvents: 3,
    eventDisplay: 'block'
  });

  fcCalendar.render();
}

function renderReservacionesTable(reservaciones) {
  const container = document.getElementById('reservaciones-container');

  const filtered = [...reservaciones].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  container.innerHTML = `
    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Personas</th>
              <th>Mesa</th>
              <th>Motivo</th>
              <th>Canal</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? '<tr><td colspan="10" class="table-empty">No se encontraron reservaciones</td></tr>' : ''}
            ${filtered.map(r => `
              <tr>
                <td><code style="background: var(--bg-alt); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${r.id}</code></td>
                <td style="font-weight: 600;">${truncate(r.nombre_cliente, 22)}</td>
                <td>${formatDate(r.fecha)}</td>
                <td style="font-weight: 600;">${r.hora}</td>
                <td style="text-align: center;">${r.num_personas}</td>
                <td>${r.mesa || '—'}</td>
                <td>${r.motivo || '—'}</td>
                <td style="font-size: 12px;">${r.canal || '—'}</td>
                <td><span class="badge ${getBadgeClass(r.estado)}">${r.estado}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-ghost btn-sm" onclick="viewReservacion('${r.id}')"><i data-lucide="eye" width="14" height="14"></i></button>
                    <button class="btn btn-ghost btn-sm" onclick="openReservacionForm('${r.id}')"><i data-lucide="pencil" width="14" height="14"></i></button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteReservacion('${r.id}')" style="color: var(--danger);"><i data-lucide="trash-2" width="14" height="14"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

async function filterReservaciones() {
  renderReservacionesContent();
}

async function viewReservacion(id) {
  const { data: r } = await DB.getById('reservaciones', id);
  if (!r) return;

  const body = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">ID</div><div class="detail-value">${r.id}</div></div>
      <div class="detail-item"><div class="detail-label">Estado</div><div class="detail-value"><span class="badge ${getBadgeClass(r.estado)}">${r.estado}</span></div></div>
      <div class="detail-item"><div class="detail-label">Cliente</div><div class="detail-value">${r.nombre_cliente}</div></div>
      <div class="detail-item"><div class="detail-label">Fecha</div><div class="detail-value">${formatDate(r.fecha)}</div></div>
      <div class="detail-item"><div class="detail-label">Hora</div><div class="detail-value">${r.hora}</div></div>
      <div class="detail-item"><div class="detail-label">Personas</div><div class="detail-value">${r.num_personas}</div></div>
      <div class="detail-item"><div class="detail-label">Mesa</div><div class="detail-value">${r.mesa || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Motivo</div><div class="detail-value">${r.motivo || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Canal</div><div class="detail-value">${r.canal || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Creada</div><div class="detail-value">${formatDateTime(r.created_at)}</div></div>
      <div class="detail-item" style="grid-column: 1/-1;"><div class="detail-label">Observaciones</div><div class="detail-value">${r.observaciones || 'Sin observaciones'}</div></div>
    </div>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
    <button class="btn btn-primary" onclick="closeModal(); openReservacionForm('${r.id}')">
      <i data-lucide="pencil" width="14" height="14"></i> Editar
    </button>
  `;

  openModal('Detalle de Reservación', body, footer);
}

async function openReservacionForm(id = null, presetDate = null) {
  let r = { cliente_id: '', nombre_cliente: '', fecha: presetDate || new Date().toISOString().split('T')[0], hora: '10:00', num_personas: 2, mesa: '', motivo: '', estado: 'Solicitada', observaciones: '', canal: 'WhatsApp' };

  if (id) {
    const result = await DB.getById('reservaciones', id);
    if (result.data) r = result.data;
  }

  const { data: clientes } = await DB.getAll('clientes');
  const mesas = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 7', 'Mesa 8', 'Terraza 1', 'Terraza 2', 'VIP 1'];

  const body = `
    <form id="reservacion-form">
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Cliente *</label>
          <select class="form-control" name="cliente_id" id="res-cliente" onchange="updateResCliente()" required>
            <option value="">Seleccionar cliente</option>
            ${clientes.map(c => `<option value="${c.id}" data-nombre="${c.nombres}" ${r.cliente_id === c.id ? 'selected' : ''}>${c.nombres}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha *</label>
          <input class="form-control" type="date" name="fecha" value="${r.fecha}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Hora *</label>
          <input class="form-control" type="time" name="hora" value="${r.hora}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Número de Personas</label>
          <input class="form-control" type="number" name="num_personas" value="${r.num_personas}" min="1" max="20">
        </div>
        <div class="form-group">
          <label class="form-label">Mesa</label>
          <select class="form-control" name="mesa">
            <option value="">Seleccionar mesa</option>
            ${mesas.map(m => `<option ${r.mesa === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Motivo</label>
          <select class="form-control" name="motivo">
            <option value="">Seleccionar</option>
            ${['Cumpleaños', 'Reunión de trabajo', 'Cita', 'Estudio grupal', 'Evento privado', 'Casual'].map(m => `<option ${r.motivo === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-control" name="estado">
            ${['Solicitada', 'Confirmada', 'En espera', 'Atendida', 'Cancelada', 'No asistió'].map(e => `<option ${r.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Canal de Reservación</label>
          <select class="form-control" name="canal">
            ${['Teléfono', 'WhatsApp', 'Instagram', 'Presencial', 'Web'].map(c => `<option ${r.canal === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="grid-column: 1/-1;">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" name="observaciones" rows="2" placeholder="Notas adicionales...">${r.observaciones || ''}</textarea>
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveReservacion('${id || ''}')">
      <i data-lucide="save" width="14" height="14"></i> ${id ? 'Actualizar' : 'Crear Reservación'}
    </button>
  `;

  openModal(id ? 'Editar Reservación' : 'Nueva Reservación', body, footer);
}

function updateResCliente() {
  // Name is extracted from select on save
}

async function saveReservacion(id) {
  const form = document.getElementById('reservacion-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  if (!data.cliente_id || !data.fecha || !data.hora) {
    showToast('Cliente, fecha y hora son obligatorios', 'warning');
    return;
  }

  const clienteSelect = document.getElementById('res-cliente');
  data.nombre_cliente = clienteSelect.options[clienteSelect.selectedIndex]?.dataset?.nombre || '';
  data.num_personas = parseInt(data.num_personas) || 1;

  if (id) {
    await DB.update('reservaciones', id, data);
    showToast('Reservación actualizada', 'success');
  } else {
    data.created_at = new Date().toISOString();
    await DB.create('reservaciones', data);
    showToast('Reservación creada', 'success');
  }

  closeModal();
  renderReservaciones();
}

function deleteReservacion(id) {
  showConfirm('¿Deseas eliminar esta reservación?', async () => {
    await DB.delete('reservaciones', id);
    showToast('Reservación eliminada', 'danger');
    renderReservaciones();
  });
}
