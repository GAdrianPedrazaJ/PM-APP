<template>
  <div class="listado-page">
    <div class="header">
      <div>
        <h2>LISTADO PROYECTOS PM</h2>
        <div class="small">Gestión de proyectos. Crear, editar y eliminar registros.</div>
      </div>

      <div class="controls">
        <input v-model="q" placeholder="Buscar proyecto..." class="search" />
        <button class="btn btn-primary" @click="openCreate">Nuevo proyecto</button>
        <button class="btn-excel" @click="openPasteMode">📋 Pegar desde Excel</button>
      </div>
    </div>

    <table class="listado-table">
      <thead>
        <tr>
          <th>Codigo Proyecto</th>
          <th>Proyecto</th>
          <th>Descripción</th>
          <th class="right">Total</th>
          <th class="actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rowsComputed" :key="r._id">
          <td>{{ r.codigo }}</td>
          <td>{{ r.proyecto }}</td>
          <td>{{ r.descripcion }}</td>
          <td class="right">{{ formatCurrency(r.total) }}</td>
          <td class="actions">
            <button class="btn-edit btn-ghost" @click="openEdit(r)">Editar</button>
            <button class="btn btn-danger" @click="confirmDelete(r)">Eliminar</button>
          </td>
        </tr>

        <tr v-if="rowsComputed.length === 0">
          <td colspan="5" class="empty">No hay proyectos</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th colspan="3">Total</th>
          <th class="right">{{ formatCurrency(totals.total) }}</th>
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
            Cod. Proyecto
            <input v-model="form.codigo" required />
          </label>

          <label>
            Proyecto
            <input v-model="form.proyecto" required />
          </label>

          <label>
            Descripción
            <input v-model="form.descripcion" />
          </label>

          <label>
            Total
            <input type="number" v-model.number="form.total" min="0" required />
          </label>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary">{{ editing ? 'Guardar' : 'Crear' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmar eliminar -->
    <div v-if="deleteConfirmOpen" class="modal-backdrop" @click.self="deleteConfirmOpen=false">
      <div class="modal small">
        <h3>Eliminar proyecto</h3>
        <p>¿Eliminar <strong>{{ toDelete?.proyecto }}</strong>?</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="deleteConfirmOpen=false">Cancelar</button>
          <button class="btn btn-danger" @click="deleteRow">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Panel Pegar desde Excel -->
    <div v-if="pasteMode" class="panel-backdrop" @click.self="closePasteMode">
      <div class="panel">
        <div class="panel-header">
          <h3>Importar desde Excel</h3>
          <button class="btn btn-ghost" @click="closePasteMode">Cerrar</button>
        </div>

        <div class="panel-body">
          <p class="hint">Copia los datos de Excel (incluyendo encabezados) y pégalos en el área de abajo. Soporta: Cod. Proyecto, Proyecto, Descripción, Total</p>
          <textarea 
            v-model="pasteData"
            placeholder="Pega aquí los datos del Excel..."
            class="paste-textarea"
            @input="handlePaste"
          ></textarea>

          <div class="paste-actions">
            <button type="button" class="btn-excel" @click="togglePreview">{{ previewRows.length ? 'Ocultar vista previa' : 'Ver vista previa' }}</button>
            <button type="button" class="btn btn-primary" :disabled="previewRows.length === 0" @click="saveImportedRows">Importar</button>
            <button type="button" class="btn btn-ghost" @click="closePasteMode">Cerrar</button>
          </div>

          <!-- Vista previa de registros a importar -->
          <div v-if="previewRows.length > 0" class="preview-section">
            <h4>Vista previa ({{ previewRows.length }} registro{{ previewRows.length !== 1 ? 's' : '' }})</h4>
            <table class="preview-table">
              <thead>
                <tr>
                  <th>Cod. Proyecto</th>
                  <th>Proyecto</th>
                  <th>Descripción</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in previewRows" :key="idx">
                  <td>{{ r.codigo }}</td>
                  <td>{{ r.proyecto }}</td>
                  <td>{{ r.descripcion }}</td>
                  <td class="right">{{ formatCurrency(r.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="panel-actions">
            <button type="button" class="btn btn-ghost" @click="closePasteMode">Cancelar</button>
            <button type="button" class="btn btn-primary" :disabled="previewRows.length === 0" @click="saveImportedRows">Importar {{ previewRows.length }} registro{{ previewRows.length !== 1 ? 's' : '' }}</button>
            <button type="button" class="btn btn-ghost" @click="clearPreview">Limpiar vista previa</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
const STORAGE_KEY = 'pm_bdpm_v1';

export default {
  name: 'ListadoProyectosPM',
  setup() {
    const q = ref('');
    const rows = ref([]);

    // modal CRUD
    const modalOpen = ref(false);
    const editing = ref(false);
    const form = ref({ _id: null, codigo: '', proyecto: '', descripcion: '', total: 0 });

    // delete
    const deleteConfirmOpen = ref(false);
    const toDelete = ref(null);

    // paste mode
    const pasteMode = ref(false);
    const pasteData = ref('');
    const previewRows = ref([]);

    onMounted(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { rows.value = JSON.parse(saved); }
        catch { rows.value = []; }
      } else {
        rows.value = []; // si quieres semilla, importa JSON aquí
      }
    });

    const generateId = () => 'lp_' + Math.random().toString(36).slice(2,9);
    const assignId = (r) => ({ ...r, _id: r._id || generateId() });

    const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value));

    // CRUD
    const openCreate = () => {
      editing.value = false;
      form.value = { _id: null, codigo: '', proyecto: '', descripcion: '', total: 0 };
      modalOpen.value = true;
    };

    const openEdit = (r) => {
      editing.value = true;
      form.value = { ...r };
      modalOpen.value = true;
    };

    const closeModal = () => modalOpen.value = false;

    const save = () => {
      if (!form.value.codigo || !form.value.proyecto) {
        alert('Código y Proyecto son obligatorios.');
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
      modalOpen.value = false;
    };

    const confirmDelete = (r) => { toDelete.value = r; deleteConfirmOpen.value = true; };
    const deleteRow = () => {
      if (!toDelete.value) return;
      rows.value = rows.value.filter(x => x._id !== toDelete.value._id);
      persist();
      deleteConfirmOpen.value = false;
      toDelete.value = null;
    };

    // computed rows for listing
    const rowsComputed = computed(() => {
      const query = q.value.trim().toLowerCase();
      const mapped = rows.value.map(r => assignId({ ...r }));
      const filtered = query ? mapped.filter(m => 
        (m.codigo || '').toLowerCase().includes(query) ||
        (m.proyecto || '').toLowerCase().includes(query) ||
        (m.descripcion || '').toLowerCase().includes(query)
      ) : mapped;
      filtered.sort((a,b) => b.total - a.total);
      return filtered;
    });

    const totals = computed(() => {
      const t = { total: 0 };
      rowsComputed.value.forEach(r => {
        t.total += Number(r.total || 0);
      });
      return t;
    });

    const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0));

    // Parsear datos desde Excel
    const parseExcelData = (text) => {
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length < 1) return [];

      // Detectar si la primera línea es encabezado
      const firstLineHasHeaders = /Cod|Código|Proyecto|Descripción|Total/i.test(lines[0]);
      const startIdx = firstLineHasHeaders ? 1 : 0;

      const result = [];
      
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.toLowerCase().includes('total')) continue;

        // Dividir por múltiples espacios o tabuladores
        let values = line.split(/\s{2,}|\t+/).map(v => v.trim()).filter(v => v);
        
        // Ignorar "-" o "–" (guion) que aparezca como separador entre columnas
        values = values.filter(v => v !== '-' && v !== '–');
        
        if (values.length < 2) continue; // Necesitamos al menos Código y Proyecto

        // Función para limpiar números
        const parseNum = (str) => {
          if (!str) return 0;
          const cleaned = str.replace(/[$,\s]/g, '');
          return parseFloat(cleaned) || 0;
        };

        const row = {
          _id: null,
          codigo: values[0] || '',
          proyecto: values[1] || '',
          descripcion: values.length > 2 ? values[2] : '',
          total: values.length > 3 ? parseNum(values[values.length - 1]) : 0
        };

        // Solo añadir si tiene Código y Proyecto
        if (row.codigo && row.proyecto) {
          result.push(row);
        }
      }

      return result;
    };

    const handlePaste = () => {
      if (pasteData.value.trim()) {
        previewRows.value = parseExcelData(pasteData.value);
      }
    };

    const togglePreview = () => {
      if (previewRows.value.length) previewRows.value = [];
      else if (pasteData.value.trim()) previewRows.value = parseExcelData(pasteData.value);
    };

    const clearPreview = () => { previewRows.value = []; };

    const openPasteMode = () => {
      pasteMode.value = true;
      pasteData.value = '';
      previewRows.value = [];
    };

    const closePasteMode = () => {
      pasteMode.value = false;
      pasteData.value = '';
      previewRows.value = [];
    };

    const saveImportedRows = () => {
      if (previewRows.value.length === 0) return;

      previewRows.value.forEach(r => {
        const newRow = { ...r, _id: generateId() };
        rows.value.unshift(newRow);
      });

      persist();
      pasteMode.value = false;
      pasteData.value = '';
      previewRows.value = [];
      alert(`${previewRows.value.length} registros importados exitosamente.`);
    };

    return {
      q, rowsComputed, totals, formatCurrency,
      modalOpen, openCreate, openEdit, closeModal, form, save, editing,
      confirmDelete, deleteConfirmOpen, deleteRow, toDelete,
      pasteMode, pasteData, previewRows, handlePaste, openPasteMode, closePasteMode, saveImportedRows, togglePreview, clearPreview
    };
  }
};
</script>

<style scoped>
.listado-page { padding:12px; }
.header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
.controls { display:flex; gap:8px; align-items:center; }
.search { padding:6px 8px; border-radius:6px; border:1px solid #e6f4ea; min-width:220px; }

.listado-table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 0 rgba(0,0,0,0.03); }
.listado-table th, .listado-table td { padding:8px; border:1px solid #0b6b2f; text-align:left; font-weight:normal; }
.listado-table thead th { background:#f0f6f0; font-weight:600; color:#0b6b2f; }
.listado-table tbody tr:nth-child(even) { background:#fafafa; }
.listado-table tbody tr:hover { background:#f0f6f0; }
.listado-table tfoot th { background:#f9f9f9; font-weight:600; border-top: 2px solid #0b6b2f; }
.listado-table th.right, .listado-table td.right { text-align:right; }
.actions { width:220px; text-align:center; }
.empty { text-align:center; padding:18px; color:#6b6b6b; }

.totals { display:flex; gap:18px; margin-top:12px; font-weight:700; }

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
.modal { background:#fff; border-radius:10px; padding:16px; width:100%; max-width:760px; box-shadow:0 8px 30px rgba(0,0,0,0.12); }
.modal.small { max-width:420px; }
.modal h3 { margin:0 0 12px 0; }
.modal form label { display:block; margin-bottom:8px; font-weight:600; color:var(--green-700); }
.modal input, .modal select { width:100%; padding:8px; border-radius:8px; border:1px solid #e6f2ea; margin-top:6px; }
.grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }

/* Panel Pegar desde Excel */
.panel-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; justify-content:center; align-items:flex-start; z-index:70; padding:24px; overflow:auto; }
.panel { background:#fff; border-radius:10px; padding:16px; width:100%; max-width:800px; box-shadow:0 8px 30px rgba(0,0,0,0.12); }
.panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #e6f2ea; }
.panel-body { flex:1; overflow-y:auto; }
.hint { font-size:0.9rem; color:#666; margin-bottom:12px; padding:10px; background:#f5f5f5; border-radius:6px; }
.paste-textarea { width:100%; height:120px; padding:10px; border:1px solid #ddd; border-radius:6px; font-family:monospace; font-size:0.9rem; resize:vertical; box-sizing:border-box; margin-bottom:12px; }
.preview-section { margin-top:16px; padding-top:12px; border-top:1px solid #e6f2ea; }
.preview-section h4 { margin:0 0 10px 0; font-size:0.95rem; }
.preview-table { width:100%; border-collapse:collapse; font-size:0.85rem; }
.preview-table th, .preview-table td { padding:6px 8px; border:1px solid #0b6b2f; text-align:left; }
.preview-table th { background:#f5f5f5; font-weight:600; color:#0b6b2f; }
.preview-table th.right, .preview-table td.right { text-align:right; }
.preview-table tr:hover { background:#fafafa; }
.panel-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; padding-top:12px; border-top:1px solid #e6f2ea; }
</style>
