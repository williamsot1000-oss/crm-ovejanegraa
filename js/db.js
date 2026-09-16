/* ================================================
   Database Layer — localStorage (Supabase-ready)
   ================================================
   
   Capa de abstracción de datos que usa localStorage.
   Diseñada para facilitar migración a Supabase: cada método
   retorna Promises y usa la misma interfaz de API.
================================================ */

const DB = {
  // ---- Helpers ----
  _getTable(table) {
    const data = localStorage.getItem(`on_${table}`);
    if (!data || data === 'null' || data === 'undefined') return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  _setTable(table, data) {
    localStorage.setItem(`on_${table}`, JSON.stringify(data));
  },

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  // ---- CRUD Operations ----
  async getAll(table, filters = {}) {
    let data = this._getTable(table);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        data = data.filter(item => {
          if (typeof item[key] === 'string') {
            return item[key].toLowerCase().includes(value.toLowerCase());
          }
          return item[key] === value;
        });
      }
    });

    return { data, error: null };
  },

  async getById(table, id) {
    const data = this._getTable(table);
    const item = data.find(r => r.id === id);
    return { data: item || null, error: item ? null : 'No encontrado' };
  },

  async create(table, record) {
    const data = this._getTable(table);
    const newRecord = {
      id: this._generateId(),
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.push(newRecord);
    this._setTable(table, data);
    return { data: newRecord, error: null };
  },

  async update(table, id, updates) {
    const data = this._getTable(table);
    const index = data.findIndex(r => r.id === id);
    if (index === -1) return { data: null, error: 'No encontrado' };
    
    data[index] = {
      ...data[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this._setTable(table, data);
    return { data: data[index], error: null };
  },

  async delete(table, id) {
    let data = this._getTable(table);
    const item = data.find(r => r.id === id);
    if (!item) return { data: null, error: 'No encontrado' };
    
    data = data.filter(r => r.id !== id);
    this._setTable(table, data);
    return { data: item, error: null };
  },

  async search(table, fields, query) {
    const data = this._getTable(table);
    if (!query) return { data, error: null };
    
    const q = query.toLowerCase();
    const filtered = data.filter(item =>
      fields.some(field => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(q);
      })
    );
    return { data: filtered, error: null };
  },

  // ---- Aggregate queries for Dashboard ----
  async count(table, filters = {}) {
    const { data } = await this.getAll(table, filters);
    return data.length;
  },

  async sum(table, field, filters = {}) {
    const { data } = await this.getAll(table, filters);
    return data.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0);
  },

  async topN(table, sortField, n = 5, order = 'desc') {
    const data = this._getTable(table);
    data.sort((a, b) => {
      const va = parseFloat(a[sortField]) || 0;
      const vb = parseFloat(b[sortField]) || 0;
      return order === 'desc' ? vb - va : va - vb;
    });
    return { data: data.slice(0, n), error: null };
  },

  // ---- Check if seed data exists ----
  isSeeded() {
    return localStorage.getItem('on_seeded') === 'true';
  },

  markSeeded() {
    localStorage.setItem('on_seeded', 'true');
  },

  // ---- Clear all data ----
  clearAll() {
    const tables = ['clientes', 'productos', 'ventas', 'reservaciones', 'promociones', 'proveedores', 'inventario', 'usuarios'];
    tables.forEach(t => localStorage.removeItem(`on_${t}`));
    localStorage.removeItem('on_seeded');
    localStorage.removeItem('on_current_user');
  }
};
