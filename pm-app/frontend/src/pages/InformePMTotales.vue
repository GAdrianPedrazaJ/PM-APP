<template>
  <div class="informe-page">
    <div class="header">
      <h2>INFORME PM TOTALES</h2>

      <div class="controls">
        <input v-model="filter" placeholder="Buscar proyecto..." class="search" />
        <button class="btn btn-primary" @click="openCreate">Nuevo</button>
      </div>
    </div>

    <table class="informe-table">
      <thead>
        <tr>
          <th>Proyecto</th>
          <th class="right">Presupuesto</th>
          <th class="right">Ejecución</th>
          <th class="right">Saldo</th>
          <th class="right">% Ejecución</th>
          <th>Estado</th>
          <th class="actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filteredRows" :key="row._id">
          <td>{{ row.proyecto }}</td>
          <td class="right">{{ formatCurrency(row.presupuesto) }}</td>
          <td class="right">{{ formatCurrency(row.ejecucion) }}</td>
          <td class="right" :class="{ negative: row.saldo < 0 }">{{ formatCurrency(row.saldo) }}</td>
          <td class="right">{{ formatPercent(row.pct_ejecucion) }}</td>
          <td>
            <span :class="['badge', estadoClass(row.estado)]">{{ row.estado }}</span>
          </td>
          <td class="actions">
            <button class="btn-edit btn-ghost" @click="openEdit(row)">Editar</button>
            <button class="btn btn-danger" @click="confirmDelete(row)">Eliminar</button>
          </td>
        </tr>
        <tr v-if="filteredRows.length === 0">
          <td colspan="7" class="empty">No hay proyectos que coincidan</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th>Total</th>
          <th class="right">{{ formatCurrency(totals.presupuesto) }}</th>
          <th class="right">{{ formatCurrency(totals.ejecucion) }}</th>
          <th class="right">{{ formatCurrency(totals.saldo) }}</th>
          <th class="right">{{ formatPercent(totals.pct_ejecucion) }}</th>
          <th></th>
          <th></th>
        </tr>
      </tfoot>
    </table>

    <!-- Modal Crear / Editar -->
    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <h3>{{ editing ? 'Editar proyecto' : 'Nuevo proyecto' }}</h3>

        <form @submit.prevent="save">
          <label>
            Proyecto
            <input v-model="form.proyecto" required />
          </label>

          <div class="grid-2">
            <label>
              Presupuesto
              <input type="number" v-model.number="form.presupuesto" min="0" required />
            </label>
            <label>
              Ejecución
              <input type="number" v-model.number="form.ejecucion" min="0" required />
            </label>
          </div>

          <div class="grid-2">
            <label>
              % Ejecución
              <input type="number" v-model.number="form.pct_ejecucion" step="0.01" min="0" />
            </label>
            <label>
              Estado
              <select v-model="form.estado">
                <option>ACTIVO</option>
                <option>PENDIENTE</option>
                <option>CERRADO</option>
              </select>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary">{{ editing ? 'Guardar cambios' : 'Crear' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmar eliminar -->
    <div v-if="deleteConfirmOpen" class="modal-backdrop" @click.self="deleteConfirmOpen=false">
      <div class="modal small">
        <h3>Eliminar proyecto</h3>
        <p>¿Eliminar <strong>{{ toDelete?.proyecto }}</strong>? Esta acción no se puede deshacer.</p>
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
import staticData from '../data/informe_totales.json';

const STORAGE_KEY = 'pm_informe_totales_v1';

export default {
  name: 'InformePMTotales',
  setup() {
    const rows = ref([]);
    const filter = ref('');
    const modalOpen = ref(false);
    const editing = ref(false);
    const form = ref({
      _id: null,
      proyecto: '',
      presupuesto: 0,
      ejecucion: 0,
      saldo: 0,
      pct_ejecucion: 0,
      estado: 'ACTIVO'
    });

    const deleteConfirmOpen = ref(false);
    const toDelete = ref(null);

    onMounted(() => {
      // Cargar desde localStorage si existe, si no usar JSON estático
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          rows.value = JSON.parse(saved);
        } catch {
          rows.value = staticData.rows.map(assignId);
        }
      } else {
        rows.value = staticData.rows.map(assignId);
      }
    });

    const assignId = (r) => ({ ...r, _id: r._id || generateId() });

    const generateId = () => 'id_' + Math.random().toString(36).slice(2, 9);

    const persist = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value));
    };

    const openCreate = () => {
      editing.value = false;
      form.value = { _id: null, proyecto: '', presupuesto: 0, ejecucion: 0, saldo: 0, pct_ejecucion: 0, estado: 'ACTIVO' };
      modalOpen.value = true;
    };

    const openEdit = (row) => {
      editing.value = true;
      form.value = { ...row }; // copia
      modalOpen.value = true;
    };

    const closeModal = () => {
      modalOpen.value = false;
    };

    const save = () => {
      // recalcular saldo y pct si no se ingresó
      form.value.saldo = Number(form.value.presupuesto || 0) - Number(form.value.ejecucion || 0);
      if (!form.value.pct_ejecucion) {
        form.value.pct_ejecucion = form.value.presupuesto ? (Number(form.value.ejecucion) / Number(form.value.presupuesto)) * 100 : 0;
      }

      if (editing.value && form.value._id) {
        const idx = rows.value.findIndex(r => r._id === form.value._id);
        if (idx !== -1) {
          rows.value.splice(idx, 1, { ...form.value });
        }
      } else {
        const newRow = { ...form.value, _id: generateId() };
        rows.value.unshift(newRow);
      }

      persist();
      modalOpen.value = false;
    };

    const confirmDelete = (row) => {
      toDelete.value = row;
      deleteConfirmOpen.value = true;
    };

    const deleteRow = () => {
      if (!toDelete.value) return;
      rows.value = rows.value.filter(r => r._id !== toDelete.value._id);
      persist();
      deleteConfirmOpen.value = false;
      toDelete.value = null;
    };

    const filteredRows = computed(() => {
      const q = filter.value.trim().toLowerCase();
      if (!q) return rows.value;
      return rows.value.filter(r => (r.proyecto || '').toLowerCase().includes(q));
    });

    const totals = computed(() => {
      const t = { presupuesto: 0, ejecucion: 0, saldo: 0, pct_ejecucion: 0 };
      rows.value.forEach(r => {
        t.presupuesto += Number(r.presupuesto || 0);
        t.ejecucion += Number(r.ejecucion || 0);
        t.saldo += Number(r.saldo || 0);
      });
      t.pct_ejecucion = t.presupuesto ? (t.ejecucion / t.presupuesto) * 100 : 0;
      return t;
    });

    const formatCurrency = (v) => {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0));
    };

    const formatPercent = (v) => {
      const n = Number(v || 0);
      return `${n.toFixed(2)}%`;
    };

    const estadoClass = (estado) => {
      const e = (estado || '').toLowerCase();
      if (e.includes('cerrado')) return 'closed';
      if (e.includes('activo') || e.includes('abierto')) return 'open';
      if (e.includes('pendiente')) return 'pending';
      return 'neutral';
    };

    return {
      rows,
      filter,
      filteredRows,
      totals,
      formatCurrency,
      formatPercent,
      estadoClass,
      modalOpen,
      openCreate,
      openEdit,
      closeModal,
      form,
      save,
      editing,
      confirmDelete,
      deleteConfirmOpen,
      deleteRow,
      toDelete
    };
  }
};
</script>

<style scoped>
.informe-page { padding: 12px; }
.header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:12px; }
.controls { display:flex; gap:8px; align-items:center; }
.search { padding:6px 8px; border-radius:6px; border:1px solid #dfe; min-width:220px; }

.informe-table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 0 rgba(0,0,0,0.03); }
.informe-table th, .informe-table td { padding:8px; border:1px solid #0b6b2f; text-align:left; font-size:0.95rem; }
.informe-table thead th { background:#f0f6f0; color:#0b6b2f; font-weight:600; }
.informe-table th.right, .informe-table td.right { text-align:right; }
.informe-table tfoot th { background:#f7fbf7; font-weight:700; }

.actions { width:160px; text-align:center; }
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

/* Modal */
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:60; padding:16px; }
.modal { background:#fff; border-radius:10px; padding:16px; width:100%; max-width:640px; box-shadow:0 8px 30px rgba(0,0,0,0.12); }
.modal.small { max-width:420px; }
.modal h3 { margin:0 0 12px 0; }
.modal form label { display:block; margin-bottom:8px; font-weight:600; color:var(--green-700); }
.modal input, .modal select { width:100%; padding:8px; border-radius:8px; border:1px solid #e6f2ea; margin-top:6px; }
.grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
</style>
