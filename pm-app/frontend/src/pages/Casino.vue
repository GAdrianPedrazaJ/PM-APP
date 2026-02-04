<template>
  <div class="casino-page">
    <div class="header">
      <div>
        <h2>CASINO</h2>
        <div class="small">Gestión de registros CASINO (CRUD)</div>
      </div>

      <div class="controls">
        <input v-model="q" placeholder="Buscar por centro, cuenta o concepto..." class="search" />
        <button class="btn btn-primary" @click="openCreate">Nuevo</button>
      </div>
    </div>

    <table class="casino-table">
      <thead>
        <tr>
          <th>Centro de Costo</th>
          <th>Nombre Cuenta</th>
          <th>Número de Cuenta</th>
          <th>Concepto </th>
          <th>Estado</th>
          <th class="actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rowsComputed" :key="r._id">
          <td>{{ r.centro }}</td>
          <td>{{ r.nombreCuenta }}</td>
          <td>{{ r.numeroCuenta }}</td>
          <td>
            <ul>
              <li v-for="(lab, i) in r.labores" :key="i">{{ lab }}</li>
            </ul>
          </td>
          <td><span :class="['badge', estadoClass(r.estado)]">{{ r.estado }}</span></td>
          <td class="actions">
            <button class="btn-edit btn-ghost" @click="openEdit(r)">Editar</button>
            <button class="btn btn-danger" @click="confirmDelete(r)">Eliminar</button>
          </td>
        </tr>

        <tr v-if="rowsComputed.length === 0">
          <td colspan="6" class="empty">No hay registros</td>
        </tr>
      </tbody>
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
            Centro de Costo
            <input v-model="form.centro" required />
          </label>

          <label>
            Nombre Cuenta
            <input v-model="form.nombreCuenta" required />
          </label>

          <label>
            Número de Cuenta
            <input v-model="form.numeroCuenta" required />
          </label>

          <label>
            Concepto (Labores)
            <div class="labores-input">
              <input v-model="laborInput" placeholder="Escribe una labor..." />
              <button type="button" class="btn btn-primary" @click="addLabor">Agregar labor</button>
            </div>
            <ul class="labores-list">
              <li v-for="(lab, i) in form.labores" :key="i">
                {{ lab }}
                <button type="button" class="btn btn-ghost" @click="removeLabor(i)">✕</button>
              </li>
            </ul>
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
        <p>¿Eliminar <strong>{{ toDelete?.centro }} - {{ toDelete?.nombreCuenta }}</strong>?</p>
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
const STORAGE_KEY = 'pm_casino_v1';

export default {
  name: 'Casino',
  setup() {
    const q = ref('');
    const rows = ref([]);

    const panelOpen = ref(false);
    const editing = ref(false);
    const form = ref({
      _id: null,
      centro: '',
      nombreCuenta: '',
      numeroCuenta: '',
      labores: [],
      estado: 'ACTIVO'
    });

    const laborInput = ref('');

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

    const generateId = () => 'ca_' + Math.random().toString(36).slice(2,9);
    const assignId = (r) => ({ ...r, _id: r._id || generateId() });

    const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value));

    const openCreate = () => {
      editing.value = false;
      form.value = { _id: null, centro: '', nombreCuenta: '', numeroCuenta: '', labores: [], estado: 'ACTIVO' };
      panelOpen.value = true;
    };

    const openEdit = (r) => {
      editing.value = true;
      form.value = { ...r };
      panelOpen.value = true;
    };

    const closePanel = () => { panelOpen.value = false; };

    const addLabor = () => {
      if (laborInput.value.trim() !== '') {
        form.value.labores.push(laborInput.value.trim());
        laborInput.value = '';
      }
    };

    const removeLabor = (i) => {
      form.value.labores.splice(i, 1);
    };

    const save = () => {
      if (!form.value.centro || !form.value.nombreCuenta || !form.value.numeroCuenta) {
        alert('Todos los campos son obligatorios.');
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
      const mapped = rows.value.map(r => assignId({ ...r }));
      const filtered = query ? mapped.filter(m =>
        (m.centro || '').toLowerCase().includes(query) ||
        (m.nombreCuenta || '').toLowerCase().includes(query) ||
        (m.numeroCuenta || '').toLowerCase().includes(query) ||
        (m.labores || []).some(l => l.toLowerCase().includes(query))
      ) : mapped;
      return filtered;
    });

    const estadoClass = (estado) => {
      const e = (estado || '').toLowerCase();
      if (e.includes('cerrado')) return 'closed';
      if (e.includes('activo')) return 'open';
      if (e.includes('pendiente')) return 'pending';
      return 'neutral';
    };

    return {
      q, rowsComputed, estadoClass,
      panelOpen, openCreate, openEdit, closePanel, form, save, editing,
      confirmDelete, deleteConfirmOpen, deleteRow, toDelete,
      laborInput, addLabor, removeLabor
    };
  }
};
</script>

<style scoped>
.casino-page { padding:12px; }
.header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
.controls { display:flex; gap:8px; align-items:center; }
.search { padding:6px}

</style>style scoped>

<style scoped>
.casino-page { padding:12px; }
.header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
.controls { display:flex; gap:8px; align-items:center; }
.search { padding:6px 8px; border-radius:6px; border:1px solid #e6f4ea; min-width:300px; }

.casino-table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 0 rgba(0,0,0,0.03); }
.casino-table th, .casino-table td { padding:8px; border:1px solid #0b6b2f; text-align:left; font-size:0.95rem; }
.casino-table thead th { background:#f0f6f0; color:#0b6b2f; font-weight:600; }
.actions { width:180px; text-align:center; }
.empty { text-align:center; padding:18px; color:#6b6b6b; }

.badge { padding:6px 8px; border-radius:999px; font-weight:600; font-size:0.85rem; }
.badge.closed { background:#f8d7da; color:#842029; }
.badge.open { background:#d1e7dd; color:#0b6b2f; }
.badge.pending { background:#fff3cd; color:#664d03; }
.badge.neutral { background:#e9ecef; color:#495057; }

.btn { padding:6px 10px; border-radius:6px; cursor:pointer; }
.btn-primary { background:#0b6b2f; color:#fff; }
.btn-ghost { background:transparent; border:1px solid #dfe; color:#0b6b2f; }
.btn-danger { background:#d9534f; color:#fff; }

/* === Panel lateral estilo drawer === */
.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  justify-content: flex-end; /* panel pegado a la derecha */
  z-index: 70;
}

.panel {
  background: #fff;
  width: 100%;
  max-width: 480px; /* ancho del panel */
  height: 100%;
  padding: 16px;
  box-shadow: -4px 0 20px rgba(0,0,0,0.2);
  border-left: 1px solid #e6f2ea;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-body label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
}
.panel-body input, .panel-body select {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e6f2ea;
  margin-top: 6px;
}

.labores-input {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.labores-input input { flex: 1; }
.labores-list { margin-top: 8px; list-style: none; padding: 0; }
.labores-list li { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* === Modal confirmar eliminar === */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 80;
  padding: 16px;
}
.modal {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}
.modal h3 { margin: 0 0 12px 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
</style>
