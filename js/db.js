/* ================================================
   Database Layer — Resilient Storage (LocalStorage + Supabase)
   ================================================
   Capa de abstracción de datos para el CRM Oveja Negra.
   Proporciona almacenamiento confiable en LocalStorage y
   compatibilidad con Supabase cuando esté disponible.
   ================================================ */

const DB = {
  // ---- Helpers ----
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  _getTable(table) {
    try {
      const data = localStorage.getItem('on_' + table);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error leyendo tabla local ${table}:`, e);
      return [];
    }
  },

  _setTable(table, data) {
    try {
      localStorage.setItem('on_' + table, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error guardando tabla local ${table}:`, e);
      return false;
    }
  },

  _isSupabaseAvailable() {
    if (!window.supabaseClient) return false;
    if (typeof supabaseUrl !== 'undefined' && (
      supabaseUrl.includes('gfiarmrfdapzepbkcrnl') ||
      supabaseUrl.includes('example.supabase.co') ||
      !supabaseUrl.startsWith('https://')
    )) {
      return false;
    }
    return true;
  },

  // ---- CRUD Operations ----
  async getAll(table, filters = {}) {
    // 1. Try Supabase if valid and configured
    if (this._isSupabaseAvailable()) {
      try {
        let query = window.supabaseClient.from(table).select('*');
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string') {
              query = query.ilike(key, `%${value}%`);
            } else {
              query = query.eq(key, value);
            }
          }
        });

        const { data, error } = await query;
        if (!error && data) {
          return { data, error: null };
        }
      } catch (e) {
        console.warn(`Supabase no disponible para getAll(${table}), usando almacenamiento local.`, e.message);
      }
    }

    // 2. Fallback to LocalStorage
    let items = this._getTable(table);
    if (filters && Object.keys(filters).length > 0) {
      items = items.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === undefined || value === null || value === '') return true;
          if (typeof value === 'string') {
            return (item[key] || '').toString().toLowerCase().includes(value.toLowerCase());
          }
          return item[key] === value;
        });
      });
    }
    return { data: items || [], error: null };
  },

  async getById(table, id) {
    if (this._isSupabaseAvailable()) {
      try {
        const { data, error } = await window.supabaseClient
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return { data, error: null };
      } catch (e) {
        console.warn(`Supabase no disponible para getById(${table}, ${id}), usando almacenamiento local.`);
      }
    }

    const items = this._getTable(table);
    const item = items.find(i => String(i.id) === String(id));
    return { data: item || null, error: item ? null : 'Registro no encontrado' };
  },

  async create(table, record) {
    const newRecord = {
      id: record.id || this._generateId(),
      ...record,
      created_at: record.created_at || new Date().toISOString()
    };

    // Always persist to LocalStorage
    const items = this._getTable(table);
    const existingIndex = items.findIndex(i => String(i.id) === String(newRecord.id));
    if (existingIndex >= 0) {
      items[existingIndex] = newRecord;
    } else {
      items.unshift(newRecord);
    }
    this._setTable(table, items);

    // Also attempt Supabase if available
    if (this._isSupabaseAvailable()) {
      try {
        await window.supabaseClient.from(table).insert(newRecord);
      } catch (e) {
        console.warn(`No se pudo sincronizar create(${table}) con Supabase:`, e.message);
      }
    }

    return { data: newRecord, error: null };
  },

  async update(table, id, updates) {
    const items = this._getTable(table);
    const index = items.findIndex(i => String(i.id) === String(id));
    let updatedRecord = null;

    if (index >= 0) {
      items[index] = {
        ...items[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this._setTable(table, items);
      updatedRecord = items[index];
    }

    if (this._isSupabaseAvailable()) {
      try {
        const { data, error } = await window.supabaseClient
          .from(table)
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) updatedRecord = data;
      } catch (e) {
        console.warn(`No se pudo sincronizar update(${table}, ${id}) con Supabase:`, e.message);
      }
    }

    return { data: updatedRecord, error: updatedRecord ? null : 'Registro no encontrado' };
  },

  async delete(table, id) {
    const items = this._getTable(table);
    const item = items.find(i => String(i.id) === String(id));
    const filtered = items.filter(i => String(i.id) !== String(id));
    this._setTable(table, filtered);

    if (this._isSupabaseAvailable()) {
      try {
        await window.supabaseClient.from(table).delete().eq('id', id);
      } catch (e) {
        console.warn(`No se pudo sincronizar delete(${table}, ${id}) con Supabase:`, e.message);
      }
    }

    return { data: item || null, error: null };
  },

  async search(table, fields, query) {
    if (!query) return this.getAll(table);

    if (this._isSupabaseAvailable()) {
      try {
        const q = query.toLowerCase();
        const orFilter = fields.map(field => `${field}.ilike.%${q}%`).join(',');
        const { data, error } = await window.supabaseClient.from(table).select('*').or(orFilter);
        if (!error && data) return { data, error: null };
      } catch (e) {
        console.warn(`Supabase search error, usando local:`, e.message);
      }
    }

    const items = this._getTable(table);
    const q = query.toLowerCase();
    const filtered = items.filter(item => {
      return fields.some(field => {
        const val = item[field];
        return val !== undefined && val !== null && val.toString().toLowerCase().includes(q);
      });
    });
    return { data: filtered, error: null };
  },

  // ---- Aggregate queries for Dashboard ----
  async count(table, filters = {}) {
    const { data } = await this.getAll(table, filters);
    return data ? data.length : 0;
  },

  async sum(table, field, filters = {}) {
    const { data } = await this.getAll(table, filters);
    if (!data) return 0;
    return data.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0);
  },

  async topN(table, sortField, n = 5, order = 'desc') {
    const { data } = await this.getAll(table);
    if (!data) return { data: [], error: null };
    const sorted = [...data].sort((a, b) => {
      const va = parseFloat(a[sortField]) || 0;
      const vb = parseFloat(b[sortField]) || 0;
      return order === 'asc' ? va - vb : vb - va;
    });
    return { data: sorted.slice(0, n), error: null };
  },

  // ---- Seed management ----
  isSeeded() {
    return localStorage.getItem('on_seeded') === 'true';
  },

  markSeeded() {
    localStorage.setItem('on_seeded', 'true');
  },

  // ---- Clear all data ----
  clearAll() {
    const tables = ['clientes', 'productos', 'ventas', 'reservaciones', 'promociones', 'proveedores', 'inventario', 'usuarios'];
    tables.forEach(t => localStorage.removeItem('on_' + t));
    localStorage.removeItem('on_seeded');
    localStorage.removeItem('on_current_user');
  }
};
