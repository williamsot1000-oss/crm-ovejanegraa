/* ================================================
   App.js — Main Controller (SPA Router + Utilities)
   CRM Cafetería "Oveja Negra"
   ================================================ */

// ---- Globals ----
let currentModule = 'dashboard';

// ---- Initialize App ----
document.addEventListener('DOMContentLoaded', () => {
  // Seed data if needed
  seedDatabase();

  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();

  // Check authentication session
  if (!Auth.isLoggedIn()) {
    Auth.renderAuthScreen('login');
  } else {
    initAppSession(Auth.getCurrentUser());
  }
});

// ---- Initialize Authenticated App Session ----
function initAppSession(user) {
  if (!user) {
    Auth.renderAuthScreen('login');
    return;
  }

  Auth.hideAuthScreen();

  // Setup navigation
  setupNavigation();
  setupMenuToggle();

  // Setup global search
  setupGlobalSearch();

  // Display date
  updateHeaderDate();

  // Update user profile in header
  updateHeaderProfile(user);

  // Apply RBAC permissions to sidebar items
  applySidebarPermissions(user);

  // Update low-stock badge
  updateStockBadge();

  // Update pending users badge for admin
  updatePendingUsersBadge();

  // Load target module (from hash or first allowed)
  let target = window.location.hash.replace('#', '') || 'dashboard';
  if (!Auth.hasModuleAccess(target)) {
    target = getFirstAllowedModule(user);
  }

  navigateTo(target);
}

// ---- SPA Router ----
window.addEventListener('hashchange', () => {
  if (!Auth.isLoggedIn()) {
    Auth.renderAuthScreen('login');
    return;
  }
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  navigateTo(hash);
});

function navigateTo(module) {
  if (!Auth.isLoggedIn()) {
    Auth.renderAuthScreen('login');
    return;
  }

  const user = Auth.getCurrentUser();
  if (!Auth.hasModuleAccess(module)) {
    showToast(`No tienes permiso para acceder al módulo "${module}".`, 'warning');
    const allowed = getFirstAllowedModule(user);
    if (allowed && allowed !== module) {
      window.location.hash = allowed;
      return;
    }
  }

  currentModule = module;

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.module === module);
  });

  // Close sidebar on mobile
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('active');

  // Load module
  const content = document.getElementById('page-content');
  if (content) {
    content.innerHTML = '<div class="spinner"></div>';
    content.classList.remove('animate-in');

    // Slight delay for animation
    requestAnimationFrame(() => {
      loadModule(module);
      content.classList.add('animate-in');
      if (window.lucide) lucide.createIcons();
    });
  }
}

function loadModule(module) {
  switch (module) {
    case 'dashboard': renderDashboard(); break;
    case 'clientes': renderClientes(); break;
    case 'productos': renderProductos(); break;
    case 'ventas': renderVentas(); break;
    case 'reservaciones': renderReservaciones(); break;
    case 'promociones': renderPromociones(); break;
    case 'proveedores': renderProveedores(); break;
    case 'inventario': renderInventario(); break;
    case 'usuarios': renderUsuarios(); break;
    default: renderDashboard(); break;
  }
}

// ---- RBAC: Sidebar Permissions & Profile Helpers ----
function applySidebarPermissions(user) {
  if (!user) return;

  document.querySelectorAll('.nav-item').forEach(item => {
    const mod = item.dataset.module;
    if (mod) {
      const hasAccess = Auth.hasModuleAccess(mod);
      item.style.display = hasAccess ? 'flex' : 'none';
    }
  });

  // Check section visibility: hide sections if all items inside are hidden
  document.querySelectorAll('.nav-section').forEach(section => {
    const visibleItems = Array.from(section.querySelectorAll('.nav-item')).filter(i => i.style.display !== 'none');
    section.style.display = visibleItems.length > 0 ? 'block' : 'none';
  });
}

function getFirstAllowedModule(user) {
  const preferred = ['dashboard', 'ventas', 'productos', 'clientes', 'reservaciones', 'promociones', 'inventario', 'proveedores', 'usuarios'];
  for (const m of preferred) {
    if (Auth.hasModuleAccess(m)) return m;
  }
  return 'dashboard';
}

function updateHeaderProfile(user) {
  const avatar = document.getElementById('header-user-avatar');
  const name = document.getElementById('header-user-name');
  const role = document.getElementById('header-user-role');

  if (avatar) avatar.textContent = getInitials(user.nombres);
  if (name) name.textContent = truncate(user.nombres, 20);
  if (role) role.textContent = user.cargo || user.rol || 'Personal';
}

async function updatePendingUsersBadge() {
  const badge = document.getElementById('pending-users-badge');
  if (!badge) return;

  if (!Auth.isAdmin()) {
    badge.style.display = 'none';
    return;
  }

  const { data: usuarios } = await DB.getAll('usuarios');
  const pendingCount = usuarios.filter(u => !u.aprobado || u.estado === 'Pendiente').length;

  if (pendingCount > 0) {
    badge.textContent = pendingCount;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

// ---- Navigation Setup ----
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const module = item.dataset.module;
      window.location.hash = module;
    });
  });
}

function setupMenuToggle() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// ---- Global Search ----
function setupGlobalSearch() {
  const searchInput = document.getElementById('global-search');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        performGlobalSearch(query);
      }
    }, 300);
  });
}

async function performGlobalSearch(query) {
  // Search across clients by name
  const { data: clientes } = await DB.search('clientes', ['nombres', 'cedula', 'email'], query);
  if (clientes.length > 0) {
    window.location.hash = 'clientes';
    // Wait for module to load, then trigger search
    setTimeout(() => {
      const searchInput = document.querySelector('.toolbar-search input');
      if (searchInput) {
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input'));
      }
    }, 100);
  }
}

// ---- Header Date ----
function updateHeaderDate() {
  const el = document.getElementById('header-date');
  if (!el) return;
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = now.toLocaleDateString('es-EC', options);
}

// ---- Stock Badge ----
async function updateStockBadge() {
  const { data: inventario } = await DB.getAll('inventario');
  const lowStock = inventario.filter(i => i.stock_actual <= i.stock_minimo);
  const badge = document.getElementById('stock-badge');
  if (badge) {
    if (lowStock.length > 0) {
      badge.textContent = lowStock.length;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  // Notification dot
  const dot = document.getElementById('notification-dot');
  if (dot) {
    dot.style.display = lowStock.length > 0 ? 'block' : 'none';
  }
}

// ---- Modal System ----
function openModal(title, bodyHTML, footerHTML = '', size = '') {
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal ${size}">
        <div class="modal-header">
          <h2 class="modal-title"></h2>
          <button class="modal-close" onclick="closeModal()">
            <i data-lucide="x" width="20" height="20"></i>
          </button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const modal = overlay.querySelector('.modal');
  modal.className = `modal ${size}`;
  const header = overlay.querySelector('.modal-header');
  const footer = overlay.querySelector('.modal-footer');
  if (header) header.style.display = 'flex';
  if (footer) {
    footer.style.display = footerHTML ? 'flex' : 'none';
    footer.innerHTML = footerHTML;
  }
  overlay.querySelector('.modal-title').textContent = title;
  overlay.querySelector('.modal-body').innerHTML = bodyHTML;

  // Activate
  requestAnimationFrame(() => {
    overlay.classList.add('active');
    if (window.lucide) lucide.createIcons();
  });

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };

  // Close on Escape
  document.addEventListener('keydown', handleEscape);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.removeEventListener('keydown', handleEscape);
  }
}

function handleEscape(e) {
  if (e.key === 'Escape') closeModal();
}

// ---- Confirm Dialog ----
function showConfirm(message, onConfirm) {
  const body = `
    <div class="confirm-dialog">
      <i data-lucide="alert-triangle" width="48" height="48"></i>
      <h3>¿Estás seguro?</h3>
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-danger" id="confirm-btn" style="background: var(--danger); color: white; border: none;">Eliminar</button>
      </div>
    </div>
  `;
  openModal('Confirmar', body);

  // Remove footer for confirm dialogs
  const footer = document.querySelector('#modal-overlay .modal-footer');
  if (footer) footer.style.display = 'none';

  // Remove header for confirm dialogs
  const header = document.querySelector('#modal-overlay .modal-header');
  if (header) header.style.display = 'none';

  setTimeout(() => {
    const btn = document.getElementById('confirm-btn');
    if (btn) {
      btn.onclick = () => {
        closeModal();
        onConfirm();
      };
    }
  }, 50);
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: 'check-circle',
    warning: 'alert-triangle',
    danger: 'x-circle',
    info: 'info'
  };

  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" width="18" height="18" style="color: var(--${type}); flex-shrink: 0;"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300);">
      <i data-lucide="x" width="14" height="14"></i>
    </button>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  // Auto remove after 4s
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// ---- Utility Functions ----
function formatCurrency(amount) {
  return '$' + parseFloat(amount || 0).toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getBadgeClass(status) {
  const map = {
    'Normal': 'badge-normal',
    'Frecuente': 'badge-frecuente',
    'Fidelizado': 'badge-fidelizado',
    'VIP': 'badge-vip',
    'Pendiente': 'badge-pendiente',
    'Confirmado': 'badge-confirmado',
    'Confirmada': 'badge-confirmada',
    'Preparado': 'badge-preparado',
    'Entregado': 'badge-entregado',
    'Cancelado': 'badge-cancelado',
    'Cancelada': 'badge-cancelada',
    'Solicitada': 'badge-solicitada',
    'En espera': 'badge-en-espera',
    'Atendida': 'badge-atendida',
    'No asistió': 'badge-no-asistio',
    'Disponible': 'badge-disponible',
    'Stock Bajo': 'badge-stock-bajo',
    'Agotado': 'badge-agotado',
    'Activo': 'badge-activo',
    'Inactivo': 'badge-inactivo'
  };
  return map[status] || 'badge-normal';
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function truncate(str, len = 30) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// Product emoji map
function getProductEmoji(category) {
  const map = {
    'Café Caliente': '☕',
    'Bebida Fría': '🧊',
    'Bebida Caliente': '🍫',
    'Té': '🍵',
    'Postre': '🍰',
    'Snack': '🥪',
    'Desayuno': '🍳'
  };
  return map[category] || '☕';
}
