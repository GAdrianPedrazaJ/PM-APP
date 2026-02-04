<template>
  <div class="otros-page">
    <div class="header">
      <div>
        <h2>OTROS</h2>
        <div class="small">Gestión de registros OTROS (CRUD)</div>
      </div>

      <div class="controls">
        <input v-model="q" placeholder="Buscar por línea, cuenta o labor..." class="search" />
        <button class="btn btn-primary" @click="openCreate">Nuevo</button>
        <button class="btn btn-excel" @click="openImport">📋 Pegar desde Excel</button>
      </div>
    </div>

    <table class="otros-table">
      <thead>
        <tr>
          <th>Línea Proceso</th>
          <th>Código & Nombre Cuenta</th>
          <th>Labores</th>
          <th>Estado</th>
          <th class="actions">Acciones</th>
        </tr>
      </thead>
      <tbody v-if="rowsComputed.length > 0">
        <tr v-for="r in rowsComputed" :key="r._id">
          <td>{{ r.linea }}</td>
          <td>{{ r.cuenta }}</td>
          <td>{{ Array.isArray(r.labores) ? r.labores.join(', ') : r.labores }}</td>
          <td><span :class="['badge', estadoClass(r.estado)]">{{ r.estado || 'N/A' }}</span></td>
          <td class="actions">
            <button class="btn btn-sm" @click="openEdit(r)">Editar</button>
            <button class="btn btn-sm btn-danger" @click="confirmDelete(r)">Eliminar</button>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr><td colspan="5" class="empty">No hay registros</td></tr>
      </tbody>
    </table>

    <!-- Panel Crear/Editar o Importar -->
    <div v-if="panelOpen" class="panel-backdrop" @click="closePanel">
      <div class="panel" @click.stop>
        <div class="panel-header">
          <h3>{{ editing ? 'Editar' : (importMode ? 'Importar desde Excel' : 'Nuevo') }} Registro</h3>
          <button class="btn btn-close" @click="closePanel">✕</button>
        </div>
        <div class="panel-body">
          <!-- Modo Importar -->
          <div v-if="importMode">
            <div class="hint">Pega aquí los datos copiados desde Excel. Se detectarán automáticamente línea, cuenta y labores.</div>
            <textarea v-model="pasteData" @input="handlePaste" class="paste-textarea" placeholder="Pega aquí los datos desde Excel"></textarea>

            <div class="panel-actions">
              <button @click="togglePreview" class="btn-excel">{{ previewRows.length ? 'Ocultar vista previa' : 'Ver vista previa' }}</button>
              <button @click="saveImportedRows" :disabled="previewRows.length === 0" class="btn btn-primary">Importar</button>
              <button @click="closePanel" class="btn">Cerrar</button>
            </div>

            <div v-if="previewRows.length" class="preview-section">
              <h4>Vista previa ({{ previewRows.length }} registros)</h4>
              <table class="preview-table">
                <thead><tr><th>Línea</th><th>Cuenta</th><th>Labores</th></tr></thead>
                <tbody>
                  <tr v-for="(pr, i) in previewRows" :key="i">
                    <td>{{ pr.linea }}</td>
                    <td>{{ pr.cuenta }}</td>
                    <td>{{ Array.isArray(pr.labores) ? pr.labores.join(', ') : pr.labores }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="panel-actions">
                <button @click="saveImportedRows" class="btn btn-primary">Importar</button>
                <button @click="clearPreview" class="btn">Limpiar</button>
              </div>
            </div>
          </div>

          <!-- Modo Crear/Editar -->
          <div v-else>
            <label>Línea Proceso<input v-model="form.linea" placeholder="ej: 21311" /></label>
            <label>Código & Nombre Cuenta<input v-model="form.cuenta" placeholder="ej: 734515005 MAQUINARIA..." /></label>
            
            <label>Labores <button class="btn-add-labor" @click="addLabor">+ Agregar labor</button></label>
            <div class="labores-list">
              <div v-for="(labor, idx) in form.labores" :key="idx" class="labor-item">
                <input v-model="form.labores[idx]" placeholder="Ingrese una labor" />
                <button v-if="form.labores.length > 1" class="btn-remove" @click="removeLabor(idx)">✕</button>
              </div>
            </div>

            <label>Estado
              <select v-model="form.estado">
                <option value="">Seleccionar</option>
                <option value="Activo">Activo</option>
                <option value="Cerrado">Cerrado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </label>

            <div class="panel-actions">
              <button @click="closePanel" class="btn">Cancelar</button>
              <button @click="save" class="btn btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal confirmar eliminar -->
    <div v-if="deleteConfirmOpen" class="modal-backdrop" @click="deleteConfirmOpen = false">
      <div class="modal" @click.stop>
        <h3>Confirmar eliminación</h3>
        <p>¿Está seguro de que desea eliminar este registro?</p>
        <div class="modal-actions">
          <button class="btn" @click="deleteConfirmOpen = false">Cancelar</button>
          <button class="btn btn-primary btn-danger" @click="deleteRow">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'Otros',
  setup() {
    const q = ref('');
    const rows = ref([]);
    const panelOpen = ref(false);
    const deleteConfirmOpen = ref(false);
    const editing = ref(false);
    const importMode = ref(false);
    const toDelete = ref(null);
    const pasteData = ref('');
    const previewRows = ref([]);
    
    const form = ref({ 
      linea: '', 
      cuenta: '', 
      labores: [''],
      estado: '' 
    });

    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);
    const assignId = (obj) => ({ ...obj, _id: obj._id || generateId() });

    const persist = () => {
      localStorage.setItem('otros_data', JSON.stringify(rows.value));
    };

    const load = () => {
      const data = localStorage.getItem('otros_data');
      if (data) {
        rows.value = JSON.parse(data);
      }
    };

    const openCreate = () => {
      editing.value = false;
      importMode.value = false;
      form.value = { linea: '', cuenta: '', labores: [''], estado: '' };
      panelOpen.value = true;
    };

    const openImport = () => {
      importMode.value = true;
      pasteData.value = '';
      previewRows.value = [];
      panelOpen.value = true;
    };

    const openEdit = (r) => {
      editing.value = true;
      importMode.value = false;
      form.value = { 
        ...r, 
        labores: Array.isArray(r.labores) ? [...r.labores] : [r.labores || '']
      };
      panelOpen.value = true;
    };

    const closePanel = () => { 
      panelOpen.value = false; 
      previewRows.value = [];
      pasteData.value = '';
    };

    const addLabor = () => {
      form.value.labores.push('');
    };

    const removeLabor = (idx) => {
      form.value.labores.splice(idx, 1);
    };

    // Parsear datos de Excel
    const parseExcelData = (text) => {
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length < 1) return [];
      
      const firstLineHasHeaders = /LINEA|LINEA PROCESO|CODIGO|CUENTA|LABOR/i.test(lines[0]);
      const startIdx = firstLineHasHeaders ? 1 : 0;
      const result = [];
      
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Dividir por tabulaciones (Excel separa con tabs)
        const parts = line.split(/\t+/).map(p => p.trim()).filter(p => p);
        
        if (parts.length < 2) continue;
        
        const linea = parts[0] || '';
        const cuenta = parts[1] || '';
        
        // Labores: pueden ser múltiples en la parte 3 en adelante
        // O pueden estar separadas por comas en una sola celda
        let labores = [];
        if (parts.length > 2) {
          // Juntar todo lo que queda como labores
          const labelString = parts.slice(2).join(' ').trim();
          
          // Si contiene comas, dividir por comas
          if (labelString.includes(',')) {
            labores = labelString.split(',').map(l => l.trim()).filter(l => l);
          } else {
            // Si no, es una sola labor
            labores = [labelString];
          }
        }
        
        if (linea && cuenta && labores.length > 0) {
          result.push({
            _id: null,
            linea,
            cuenta,
            labores,
            estado: 'Activo'
          });
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
      if (previewRows.value.length) {
        previewRows.value = [];
      } else if (pasteData.value.trim()) {
        previewRows.value = parseExcelData(pasteData.value);
      }
    };

    const clearPreview = () => {
      previewRows.value = [];
    };

    const saveImportedRows = () => {
      if (!previewRows.value.length) return;
      previewRows.value.forEach(r => {
        const newRow = { 
          ...r, 
          _id: generateId(),
          labores: Array.isArray(r.labores) ? r.labores : [r.labores]
        };
        rows.value.unshift(newRow);
      });
      persist();
      importMode.value = false;
      pasteData.value = '';
      previewRows.value = [];
      panelOpen.value = false;
    };

    const save = () => {
      if (!form.value.linea || !form.value.cuenta) {
        alert('Línea y Cuenta son obligatorios.');
        return;
      }
      
      const laboresValidos = form.value.labores.filter(l => l.trim());
      if (laboresValidos.length === 0) {
        alert('Debe agregar al menos una labor.');
        return;
      }

      const dataToSave = {
        ...form.value,
        labores: laboresValidos
      };

      if (editing.value && form.value._id) {
        const idx = rows.value.findIndex(x => x._id === form.value._id);
        if (idx !== -1) rows.value.splice(idx, 1, dataToSave);
      } else {
        const newRow = { ...dataToSave, _id: generateId() };
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
      const filtered = query ? mapped.filter(m => {
        const laboresStr = Array.isArray(m.labores) ? m.labores.join(' ') : m.labores;
        return (m.linea || '').toLowerCase().includes(query) ||
               (m.cuenta || '').toLowerCase().includes(query) ||
               laboresStr.toLowerCase().includes(query);
      }) : mapped;
      return filtered;
    });

    const estadoClass = (estado) => {
      const e = (estado || '').toLowerCase();
      if (e.includes('cerrado')) return 'closed';
      if (e.includes('activo')) return 'open';
      if (e.includes('pendiente')) return 'pending';
      return 'neutral';
    };

    load();

    return {
      q, rowsComputed, estadoClass,
      panelOpen, openCreate, openEdit, closePanel, form, save, editing,
      confirmDelete, deleteConfirmOpen, deleteRow, toDelete,
      openImport, importMode, pasteData, previewRows, handlePaste, 
      togglePreview, clearPreview, saveImportedRows, addLabor, removeLabor
    };
  }
};
</script>

<style scoped>
.otros-page { padding:12px; }
.header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
.controls { display:flex; gap:8px; align-items:center; flex-wrap: wrap; }
.search { padding:6px 8px; border-radius:6px; border:1px solid #e6f4ea; min-width:300px; }

.otros-table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 0 rgba(0,0,0,0.03); }
.otros-table th, .otros-table td { padding:10px 12px; border-bottom:1px solid #f0f6f0; text-align:left; font-size:0.95rem; }
.otros-table thead th { background:#f0f6f0; color:#0b6b2f; font-weight:600; }
.actions { width:180px; text-align:center; }
.empty { text-align:center; padding:18px; color:#6b6b6b; }

.badge { padding:6px 8px; border-radius:999px; font-weight:600; font-size:0.85rem; }
.badge.closed { background:#f8d7da; color:#842029; }
.badge.open { background:#d1e7dd; color:#0b6b2f; }
.badge.pending { background:#fff3cd; color:#664d03; }
.badge.neutral { background:#e9ecef; color:#495057; }

.btn { padding:6px 10px; border-radius:6px; cursor:pointer; border:1px solid #e6f4ea; background:#fff; }
.btn-primary { background:#0b6b2f; color:#fff; border-color:#0b6b2f; }
.btn-danger { background:#dc3545; color:#fff; border-color:#dc3545; }
.btn-excel { background: #1e9a4a; color: white; border: none; padding:8px 12px; border-radius:999px; }
.btn-sm { padding:4px 8px; font-size:0.85rem; }
.btn-close { background:transparent; border:none; font-size:1.5rem; cursor:pointer; }

/* Panel / drawer */
.panel-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; justify-content: flex-end; z-index: 70; }
.panel { background: #fff; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 16px; box-shadow: -4px 0 20px rgba(0,0,0,0.2); border-left: 1px solid #e6f2ea; display: flex; flex-direction: column; animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-body { flex: 1; overflow-y: auto; }
.panel-body label { display: block; margin-bottom: 10px; margin-top: 10px; font-weight: 600; }
.panel-body input, .panel-body select { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #e6f2ea; margin-top: 6px; box-sizing: border-box; }

.hint { background: #e8f5e9; padding: 10px; border-radius: 6px; margin-bottom: 12px; font-size: 0.9rem; color: #2e7d32; }
.paste-textarea { width: 100%; height: 140px; padding: 8px; font-family: monospace; border: 1px solid #e6f2ea; border-radius: 6px; box-sizing: border-box; }

.preview-section { margin-top: 16px; }
.preview-section h4 { margin: 12px 0 8px 0; color: #0b6b2f; }
.preview-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.preview-table th, .preview-table td { border: 1px solid #0b6b2f; padding: 6px; text-align: left; }
.preview-table thead th { background: #f0f6f0; color: #0b6b2f; font-weight: 600; }

.labores-list { margin-top: 8px; }
.labor-item { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.labor-item input { flex: 1; }
.btn-add-labor { background: #0b6b2f; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; margin-left: 8px; }
.btn-remove { background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; flex-shrink: 0; }

.panel-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }

/* Modal confirmar eliminar */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 80; padding: 16px; }
.modal { background: #fff; border-radius: 10px; padding: 24px; width: 100%; max-width: 400px; box-shadow: 0 15px 50px rgba(0,0,0,0.3); animation: slideUp 0.3s ease-out; }
.modal h3 { margin: 0 0 12px 0; color: #0b6b2f; font-size: 1.3rem; }
.modal p { margin: 0 0 20px 0; color: #666; font-size: 0.95rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }

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

