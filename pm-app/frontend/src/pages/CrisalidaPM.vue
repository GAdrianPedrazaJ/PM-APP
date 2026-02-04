<template>
  <div class="crisalida-page">
    <div class="header">
      <div>
        <h2>CRISALIDA PM</h2>
        <div class="small">Listado y gestión de registros CRISALIDA (CRUD)</div>
      </div>

      <div class="controls">
        <input v-model="q" placeholder="Buscar por proveedor, #cotización o descripción..." class="search" />
        <button class="btn btn-primary" @click="openCreate">Nuevo</button>
      </div>
    </div>

    <table class="crisalida-table">
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Proveedor</th>
          <th>Descripción</th>
          <th>CC</th>
          <th># Cotización</th>
          <th class="right">Total</th>
          <th>Cuenta</th>
          <th>Estado</th>
          <th class="actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rowsComputed" :key="r._id">
          <td>{{ r.empresa }}</td>
          <td>{{ r.proveedor }}</td>
          <td>{{ r.descripcion }}</td>
          <td>{{ r.cc }}</td>
          <td>{{ r.num_cotizacion }}</td>
          <td class="right">{{ formatCurrency(r.total) }}</td>
          <td>{{ r.cuenta }}</td>
          <td><span :class="['badge', estadoClass(r.estado)]">{{ r.estado }}</span></td>
          <td class="actions">
            <button class="btn-edit btn-ghost" @click="openEdit(r)">Editar</button>
            <button class="btn btn-danger" @click="confirmDelete(r)">Eliminar</button>
          </td>
        </tr>

        <tr v-if="rowsComputed.length === 0">
          <td colspan="9" class="empty">No hay registros</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th colspan="5">Totales</th>
          <th class="right">{{ formatCurrency(totals.total) }}</th>
          <th colspan="3"></th>
        </tr>
      </tfoot>
    </table>

    <!-- Panel lateral: formulario Crear / Editar -->
    <div v-if="panelOpen" class="panel-backdrop" @click.self="closePanel">
      <aside class="panel">
        <div class="panel-header">
          <h3>{{ editing ? 'Editar registro' : 'Nuevo registro' }}</h3>
          <button class="btn btn-ghost" @click="closePanel">Cerrar</button>
        </div>

        <form class="panel-body" @submit.prevent="save">
          <label>
            Empresa
            <select v-model="form.empresa" required>
              <option value="TN">TN</option>
              <option value="PM">PM</option>
            </select>
          </label>

          <label>
            Proveedor
            <input v-model="form.proveedor" />
          </label>

          <label>
            Descripción
            <input v-model="form.descripcion" />
          </label>

          <div class="grid-3">
            <label>
              CC
              <input v-model="form.cc" />
            </label>
            <label>
              # Cotización
              <input v-model="form.num_cotizacion" />
            </label>
            <label>
              Total
              <input type="number" v-model.number="form.total" min="0" />
            </label>
          </div>

          <label>
            Cuenta
            <input v-model="form.cuenta" />
          </label>

          <label>
            Estado
            <select v-model="form.estado">
              <option>ACTIVO</option>
              <option>PENDIENTE</option>
              <option>CERRADO</option>
            </select>
          </label>

          <div class="panel-actions">
            <button type="button" class="btn btn-ghost" @click="closePanel">Cancelar</button>
            <button type="submit" class="btn btn-primary">{{ editing ? 'Guardar' : 'Crear' }}</button>
          </div>
        </form>
      </aside>
    </div>

    <!-- Confirmar eliminar -->
    <div v-if="deleteConfirmOpen" class="modal-backdrop" @click.self="deleteConfirmOpen=false">
      <div class="modal small">
        <h3>Eliminar registro</h3>
        <p>¿Eliminar <strong>{{ toDelete?.proveedor }} - {{ toDelete?.num_cotizacion }}</strong>?</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="deleteConfirmOpen=false">Cancelar</button>
          <button class="btn btn-danger" @click="deleteRow">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
const STORAGE_KEY = 'pm_crisalida_v1';

export default {
  name: 'CrisalidaPM',
  setup() {
    const q = ref('');
    const rows = ref([]);

    // panel/form
    const panelOpen = ref(false);
    const editing = ref(false);
    const form = ref({
      _id: null,
      empresa: 'PM',
      proveedor: '',
      descripcion: '',
      cc: '',
      num_cotizacion: '',
      total: 0,
      cuenta: '',
      estado: 'ACTIVO'
    });

    // delete
    const deleteConfirmOpen = ref(false);
    const toDelete = ref(null);

    onMounted(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { rows.value = JSON.parse(saved); }
        catch { rows.value = []; }
      } else {
        rows.value = [];
      }
    });

    const generateId = () => 'cr_' + Math.random().toString(36).slice(2,9);
    const assignId = (r) => ({ ...r, _id: r._id || generateId() });

    const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value));

    const openCreate = () => {
      editing.value = false;
      form.value = { _id: null, empresa: 'PM', proveedor: '', descripcion: '', cc: '', num_cotizacion: '', total: 0, cuenta: '', estado: 'ACTIVO' };
      panelOpen.value = true;
    };

    const openEdit = (r) => {
      editing.value = true;
      form.value = { ...r };
      panelOpen.value = true;
    };

    const closePanel = () => { panelOpen.value = false; };

    const save = () => {
      // Validación mínima: empresa y total
      if (!form.value.empresa) {
        alert('Seleccione la Empresa.');
        return;
      }
      if (Number(form.value.total) < 0) {
        alert('El total debe ser un número válido.');
        return;
      }

      if (editing.value && form.value._id) {
        const idx = rows.value.findIndex(x => x._id === form.value._id);
        if (idx !== -1) rows.value.splice(idx, 1, { ...form.value });
      } else {
        const newRow = { ...form.value, _id: generateId() };
        rows.value.unshift(newRow);
      }
      persist();
      panelOpen.value = false;
    };

    const confirmDelete = (r) => { toDelete.value = r; deleteConfirmOpen.value = true; };
    const deleteRow = () => {
      if (!toDelete.value) return;
      rows.value = rows.value.filter(x => x._id !== toDelete.value._id);
      persist();
      deleteConfirmOpen.value = false;
      toDelete.value = null;
    };

    const rowsComputed = computed(() => {
      const query = q.value.trim().toLowerCase();
      const mapped = rows.value.map(r => {
        const total = Number(r.total || 0);
        return assignId({ ...r, total });
      });
      const filtered = query ? mapped.filter(m =>
        (m.proveedor || '').toLowerCase().includes(query) ||
        (m.num_cotizacion || '').toLowerCase().includes(query) ||
        (m.descripcion || '').toLowerCase().includes(query) ||
        (m.empresa || '').toLowerCase().includes(query)
      ) : mapped;
      filtered.sort((a,b) => b.total - a.total);
      return filtered;
    });

    const totals = computed(() => {
      const t = { total: 0 };
      rowsComputed.value.forEach(r => { t.total += Number(r.total || 0); });
      return t;
    });

    const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0));
    const estadoClass = (estado) => {
      const e = (estado || '').toLowerCase();
      if (e.includes('cerrado')) return 'closed';
      if (e.includes('activo')) return 'open';
      if (e.includes('pendiente')) return 'pending';
      return 'neutral';
    };

    return {
      q, rowsComputed, totals, formatCurrency, estadoClass,
      panelOpen, openCreate, openEdit, closePanel, form, save, editing,
      confirmDelete, deleteConfirmOpen, deleteRow, toDelete
    };
  }
};
</script>

<style scoped>
.crisalida-page { padding:12px; }
.header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
.controls { display:flex; gap:8px; align-items:center; }
.search { padding:6px 8px; border-radius:6px; border:1px solid #e6f4ea; min-width:300px; }

.crisalida-table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 0 rgba(0,0,0,0.03); }
.crisalida-table th, .crisalida-table td { padding:8px; border:1px solid #0b6b2f; text-align:left; font-size:0.95rem; }
.crisalida-table thead th { background:#f0f6f0; color:#0b6b2f; font-weight:600; }
.crisalida-table th.right, .crisalida-table td.right { text-align:right; }
.actions { width:220px; text-align:center; }
.empty { text-align:center; padding:18px; color:#6b6b6b; }

.badge { padding:6px 8px; border-radius:999px; font-weight:600; font-size:0.85rem; }
.badge.closed { background:#f8d7da; color:#842029; }
.badge.open { background:#d1e7dd; color:#0b6b2f; }
.badge.pending { background:#fff3cd; color:#664d03; }
.badge.neutral { background:#e9ecef; color:#495057; }

.negative { color:#d9534f; font-weight:700; }

/* Buttons */
.btn { padding:6px 10px; border-radius:6px; border:1px solid transparent; cursor:pointer; }
.btn-primary { background:#0b6b2f; color:#fff; }
.btn-ghost { background:transparent; border:1px solid #dfe; color:#0b6b2f; }
.btn-danger { background:#d9534f; color:#fff; }

/* Panel lateral */
.panel-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:flex-start; justify-content:flex-end; z-index:70; padding:24px; overflow:auto; }
.panel { background:#fff; border-radius:10px; padding:16px; width:100%; max-width:720px; box-shadow:0 12px 40px rgba(0,0,0,0.18); }
.panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.panel-body { display:block; }
.panel-body label { display:block; margin-bottom:10px; font-weight:600; }
.panel-body input, .panel-body select { width:100%; padding:8px; border-radius:8px; border:1px solid #e6f2ea; margin-top:6px; }
.grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.panel-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }

/* Modal confirmar */
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:80; padding:16px; }
.modal { background:#fff; border-radius:10px; padding:16px; width:100%; max-width:420px; box-shadow:0 8px 30px rgba(0,0,0,0.12); }
.modal h3 { margin:0 0 12px 0; }
.modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
</style>
