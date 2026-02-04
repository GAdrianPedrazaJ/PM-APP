<template>
  <div class="creos-page">
    <div class="header-row">
      <h2>CREOS</h2>
      <div class="controls">
        <input v-model="q" placeholder="Buscar por quincena, mes, TN o PM..." class="search" />
        <button class="btn" @click="openCreate">Nuevo</button>
        <button class="btn-excel" @click="openImport">📋 Pegar desde Excel</button>
      </div>
    </div>

    <div class="table-wrap">
      <table class="creos-table">
        <thead>
          <tr>
            <th>Quincena</th>
            <th>Mes</th>
            <th class="text-right">TN</th>
            <th class="text-right">PM</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rowsComputed" :key="r._id">
            <td>{{ r.quincena }}</td>
            <td>{{ r.mes }}</td>
            <td class="text-right">{{ formatCurrency(r.tn) }}</td>
            <td class="text-right">{{ formatCurrency(r.pm) }}</td>
            <td><span :class="['badge', estadoClass(r.estado)]">{{ r.estado }}</span></td>
            <td class="actions">
              <button @click="openEdit(r)" class="btn-edit">Editar</button>
              <button @click="confirmDelete(r)" class="btn btn-danger">Borrar</button>
            </td>
          </tr>
          <tr v-if="!rowsComputed.length">
            <td class="empty" colspan="6">No hay registros.</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2">Totales</td>
            <td class="text-right">{{ formatCurrency(totalTN) }}</td>
            <td class="text-right">{{ formatCurrency(totalPM) }}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Panel Crear/Editar / Importar -->
    <div v-if="panelOpen" class="panel-backdrop">
      <div class="panel">
        <div class="panel-body">
          <h3>{{ editing ? 'Editar' : (importMode ? 'Importar desde Excel' : 'Nuevo') }}</h3>

          <div v-if="importMode">
            <div class="hint">Pega aquí los datos copiados desde Excel (se detectan encabezados automáticamente).</div>
            <textarea v-model="pasteData" @input="handlePaste" class="paste-textarea" placeholder="Pega aquí"></textarea>
            <!-- Nuevo: Mostrar errores de parsing -->
            <div v-if="parseErrors.length" class="errors">
              <strong>Errores/avisos:</strong>
              <ul>
                <li v-for="error in parseErrors" :key="error">{{ error }}</li>
              </ul>
            </div>

            <div class="panel-actions">
              <button @click="togglePreview" class="btn-excel">{{ previewRows.length ? 'Ocultar vista previa' : 'Ver vista previa' }}</button>
              <button @click="saveImportedRows" :disabled="previewRows.length === 0" class="btn btn-primary">Importar</button>
              <button @click="closePanel" class="btn btn-ghost">Cerrar</button>
            </div>

            <div v-if="previewRows.length" class="preview-section">
              <h4>Vista previa</h4>
              <table class="preview-table">
                <thead><tr><th>Q</th><th>Mes</th><th>TN</th><th>PM</th></tr></thead>
                <tbody>
                  <tr v-for="(pr, i) in previewRows" :key="i">
                    <td>{{ pr.quincena }}</td>
                    <td>{{ pr.mes }}</td>
                    <td class="text-right">{{ formatCurrency(pr.tn) }}</td>
                    <td class="text-right">{{ formatCurrency(pr.pm) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="panel-actions">
                <button @click="saveImportedRows" class="btn btn-primary">Importar</button>
                <button @click="clearPreview" class="btn btn-ghost">Limpiar vista previa</button>
              </div>
            </div>
          </div>

          <div v-else>
            <label>Quincena</label>
            <input v-model="form.quincena" />
            <label>Mes</label>
            <input v-model="form.mes" />
            <label>TN</label>
            <input v-model.number="form.tn" />
            <label>PM</label>
            <input v-model.number="form.pm" />
            <label>Estado</label>
            <select v-model="form.estado"><option>ACTIVO</option><option>PENDIENTE</option><option>CERRADO</option></select>

            <div class="panel-actions">
              <button @click="save" class="btn btn-primary">Guardar</button>
              <button @click="closePanel" class="btn btn-ghost">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmar borrar -->
    <div v-if="deleteConfirmOpen" class="modal-backdrop">
      <div class="modal">
        <h3>Confirmar</h3>
        <p>¿Borrar registro?</p>
        <div class="modal-actions">
          <button @click="deleteRow" class="btn btn-danger">Borrar</button>
          <button @click="() => (deleteConfirmOpen = false)" class="btn">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
const STORAGE_KEY = 'pm_creos_v1';

export default {
  name: 'Creos',
  setup() {
    const q = ref('');
    const rows = ref([]);

    const panelOpen = ref(false);
    const editing = ref(false);
    const importMode = ref(false);
    const pasteData = ref('');
    const previewRows = ref([]);
    const parseErrors = ref([]); // Nuevo: Para mostrar errores en la UI

    const form = ref({
      _id: null,
      quincena: '',
      mes: '',
      tn: 0,
      pm: 0,
      estado: 'ACTIVO'
    });

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
      importMode.value = false;
      pasteData.value = '';
      previewRows.value = [];
      parseErrors.value = []; // Limpiar errores
      form.value = { _id: null, quincena: '', mes: '', tn: 0, pm: 0, estado: 'ACTIVO' };
      panelOpen.value = true;
    };

    const openImport = () => {
      panelOpen.value = true;
      importMode.value = true;
      pasteData.value = '';
      previewRows.value = [];
      parseErrors.value = []; // Limpiar errores
    };

    const openEdit = (r) => {
      editing.value = true;
      importMode.value = false;
      pasteData.value = '';
      previewRows.value = [];
      parseErrors.value = []; // Limpiar errores
      form.value = { ...r };
      panelOpen.value = true;
    };

    const closePanel = () => { panelOpen.value = false; };

    const parseExcelData = (text) => {
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length < 1) return { rows: [], errors: ['No se encontraron líneas válidas.'] };

      let hasHeaders = false;
      let headerMap = {}; // Para mapear nombres de columnas a índices
      const errors = []; // Array para acumular errores/avisos

      // Detectar headers en la primera línea
      if (/QUINCENA|QUINCENO|MES|TN|PM|ESTADO/i.test(lines[0])) {
        hasHeaders = true;
        const headers = lines[0].split(/\s{2,}|\t+|,|;/).map(h => h.trim().toLowerCase());
        headers.forEach((h, i) => {
          if (h.includes('quincen')) headerMap.quincena = i;
          else if (h.includes('mes')) headerMap.mes = i;
          else if (h === 'tn') headerMap.tn = i;
          else if (h === 'pm') headerMap.pm = i;
          else if (h.includes('estado')) headerMap.estado = i;
        });
      }

      const result = [];
      const startIdx = hasHeaders ? 1 : 0;
      let ignoredLines = 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.toLowerCase().includes('total')) {
          ignoredLines++;
          continue;
        }

        // Mejorar separadores: incluir comas y punto y coma (para CSV)
        const values = line.split(/\s{2,}|\t+|,|;/).map(v => v.trim()).filter(v => v);
        if (values.length < 2) {
          ignoredLines++;
          continue;
        }

        const parseNum = (str) => {
          if (!str) return 0;
          const cleaned = str.replace(/[$,\s]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? 0 : num;
        };

        // Usar headerMap si hay headers, sino orden fijo
        const getValue = (key, defaultIdx) => {
          const idx = headerMap[key] !== undefined ? headerMap[key] : defaultIdx;
          return values[idx] || '';
        };

        const row = {
          _id: null,
          quincena: getValue('quincena', 0),
          mes: getValue('mes', 1),
          tn: parseNum(getValue('tn', 2)),
          pm: parseNum(getValue('pm', 3)),
          estado: getValue('estado', 4) || 'ACTIVO'
        };

        // Validación básica
        if (!row.quincena || !row.mes) {
          errors.push(`Línea ${i + 1}: Quincena o Mes faltante, ignorada.`);
          ignoredLines++;
          continue;
        }
        if (row.tn === 0 && getValue('tn', 2) && !/^\d/.test(getValue('tn', 2))) {
          errors.push(`Línea ${i + 1}: TN no es un número válido, asignado 0.`);
        }
        if (row.pm === 0 && getValue('pm', 3) && !/^\d/.test(getValue('pm', 3))) {
          errors.push(`Línea ${i + 1}: PM no es un número válido, asignado 0.`);
        }

        result.push(row);
      }

      // Agregar resumen de errores
      if (ignoredLines > 0) errors.push(`${ignoredLines} líneas ignoradas (vacías, totales o inválidas).`);
      if (result.length === 0) errors.push('No se pudieron parsear filas válidas.');

      return { rows: result, errors };
    };

    const handlePaste = () => {
      if (pasteData.value.trim()) {
        const parsed = parseExcelData(pasteData.value);
        previewRows.value = parsed.rows;
        parseErrors.value = parsed.errors; // Actualizar errores en UI
      } else {
        parseErrors.value = [];
      }
    };

    const togglePreview = () => {
      if (previewRows.value.length) {
        previewRows.value = [];
        parseErrors.value = [];
      } else if (pasteData.value.trim()) {
        const parsed = parseExcelData(pasteData.value);
        previewRows.value = parsed.rows;
        parseErrors.value = parsed.errors;
      }
    };

    const clearPreview = () => { previewRows.value = []; parseErrors.value = []; };

    const saveImportedRows = () => {
      if (!previewRows.value.length) return;
      const parsed = parseExcelData(pasteData.value); // Re-parsear para obtener errores
      parsed.rows.forEach(r => {
        const newRow = { ...r, _id: generateId() };
        rows.value.unshift(newRow);
      });
      persist();
      importMode.value = false;
      pasteData.value = '';
      previewRows.value = [];
      parseErrors.value = [];
      panelOpen.value = false;
      const errorMsg = parsed.errors.length ? `\nErrores: ${parsed.errors.join(' ')}` : '';
      alert(`${parsed.rows.length} registros importados exitosamente.${errorMsg}`);
    };

    const save = () => {
      if (!form.value.quincena || !form.value.mes) { alert('Quincena y Mes son obligatorios.'); return; }
      if (editing.value && form.value._id) { const idx = rows.value.findIndex(x => x._id === form.value._id); if (idx !== -1) rows.value.splice(idx, 1, { ...form.value }); }
      else { const newRow = { ...form.value, _id: generateId() }; rows.value.unshift(newRow); }
      persist();
      panelOpen.value = false;
    };

    const confirmDelete = (r) => { toDelete.value = r; deleteConfirmOpen.value = true; };
    const deleteRow = () => { if (!toDelete.value) return; rows.value = rows.value.filter(x => x._id !== toDelete.value._id); persist(); deleteConfirmOpen.value = false; toDelete.value = null; };

    const rowsComputed = computed(() => {
      const query = q.value.trim().toLowerCase();
      const mapped = rows.value.map(r => assignId({ ...r }));
      const filtered = query ? mapped.filter(m => (m.quincena || '').toLowerCase().includes(query) || (m.mes || '').toLowerCase().includes(query) || String(m.tn).includes(query) || String(m.pm).includes(query)) : mapped;
      return filtered;
    });

    const totalTN = computed(() => rowsComputed.value.reduce((s, r) => s + (r.tn || 0), 0));
    const totalPM = computed(() => rowsComputed.value.reduce((s, r) => s + (r.pm || 0), 0));
    const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0));
    const estadoClass = (estado) => { const e = (estado || '').toLowerCase(); if (e.includes('cerrado')) return 'closed'; if (e.includes('activo')) return 'open'; if (e.includes('pendiente')) return 'pending'; return 'neutral'; };

    return { q, rowsComputed, estadoClass, totalTN, totalPM, formatCurrency, panelOpen, openCreate, openEdit, closePanel, form, save, editing, openImport, confirmDelete, deleteConfirmOpen, deleteRow, toDelete, importMode, pasteData, previewRows, parseErrors, handlePaste, saveImportedRows, togglePreview, clearPreview };
  }
};
</script>

<style scoped>
.creos-page { padding:12px; }
.header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.controls { display:flex; gap:8px; align-items:center; }
.search { padding:6px 8px; border-radius:6px; border:1px solid #e6f4ea; min-width:300px; }
.table-wrap { overflow:auto; }
.creos-table { width:100%; border-collapse:collapse; }
.creos-table th, .creos-table td { border:1px solid #0b6b2f; padding:8px; }
.creos-table thead th { background:#f0f6f0; color:#0b6b2f; font-weight:600; }
.text-right { text-align:right; }
.btn { padding:6px 10px; background:#0b6b2f; color:white; border:none; cursor:pointer; border-radius:6px; }
.btn-excel { background: #1e9a4a; color: white; border: none; padding:8px 12px; border-radius:999px; }
.btn-edit { background:#0b6b2f; color:#fff; padding:6px 8px; border-radius:6px; border:none; margin-right:6px; }
.btn-danger { background:#c0392b; color:white; border:none; padding:6px 8px; border-radius:6px; }
.modal-backdrop, .panel-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:60; }
.panel { background:white; padding:16px; width:520px; max-height:90vh; overflow:auto; border-radius:6px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
.panel-body label { display:block; margin-top:8px; font-weight:600; }
.paste-textarea { width:100%; height:140px; padding:8px; font-family:monospace; }
.preview-table { width:100%; border-collapse:collapse; margin-top:8px; }
.preview-table th, .preview-table td { border:1px solid #0b6b2f; padding:6px; }
.panel-actions, .modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:12px; }
.badge { padding:6px 8px; border-radius:999px; font-weight:600; }
.badge.open { background:#d1e7dd; color:#0b6b2f; }
.badge.pending { background:#fff3cd; color:#664d03; }
.badge.closed { background:#f8d7da; color:#842029; }
.total-row td { font-weight:600; }

/* Modal mejorado */
.modal { 
  background: white; 
  padding: 24px; 
  width: 100%; 
  max-width: 400px; 
  border-radius: 8px; 
  box-shadow: 0 15px 50px rgba(0,0,0,0.3);
  animation: slideUp 0.3s ease-out;
}

.modal h3 {
  margin: 0 0 12px 0;
  color: #0b6b2f;
  font-size: 1.3rem;
}

.modal p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 0.95rem;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
</style>