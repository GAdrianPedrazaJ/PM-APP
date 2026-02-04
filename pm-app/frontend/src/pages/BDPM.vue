<template>
  <div class="bdpm-page">
    <div class="header">
      <h2>BD PM</h2>

      <div class="controls">
        <input v-model="filter" placeholder="Buscar en todas las columnas..." class="search" />
        <button class="btn btn-primary" @click="openCreate">Nuevo</button>
        <button class="btn-excel" @click="openImport">📋 Pegar desde Excel</button>
      </div>
    </div>

    <div class="table-container">
      <table class="bdpm-table">
        <thead>
          <tr>
            <th>Centro de costo</th>
            <th>Proyecto</th>
            <th>Categoria</th>
            <th>Nombre Proyecto</th>
            <th>Solicitud</th>
            <th>Cuenta</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Empresa</th>
            <th>Proveedor</th>
            <th>Descripcion</th>
            <th># Cotizacion</th>
            <th>Personeria</th>
            <th class="right">Subtotal</th>
            <th class="right">IVA</th>
            <th class="right">Total Proyecto</th>
            <th class="right">Anticipo</th>
            <th>Estado</th>
            <th>Comentario</th>
            <th class="right">Presupuesto</th>
            <th class="right">Total Anticipos</th>
            <th>OBS</th>
            <th class="actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row._id">
            <td>{{ row.centro_costo }}</td>
            <td>{{ row.proyecto }}</td>
            <td>{{ row.categoria }}</td>
            <td>{{ row.nombre_proyecto }}</td>
            <td>{{ row.solicitud }}</td>
            <td>{{ row.cuenta }}</td>
            <td>{{ formatDate(row.fecha) }}</td>
            <td>{{ row.tipo }}</td>
            <td>{{ row.empresa }}</td>
            <td>{{ row.proveedor }}</td>
            <td>{{ row.descripcion }}</td>
            <td>{{ row.cotizacion_num }}</td>
            <td>{{ row.personeria }}</td>
            <td class="right">{{ formatCurrency(row.subtotal) }}</td>
            <td class="right">{{ formatCurrency(row.iva) }}</td>
            <td class="right">{{ formatCurrency(row.total_proyecto) }}</td>
            <td class="right">{{ formatCurrency(row.anticipo) }}</td>
            <td><span :class="['badge', estadoClass(row.estado)]">{{ row.estado }}</span></td>
            <td>{{ row.comentario }}</td>
            <td class="right">{{ formatCurrency(row.presupuesto) }}</td>
            <td class="right">{{ formatCurrency(row.total_anticipos) }}</td>
            <td>{{ row.obs }}</td>
            <td class="actions">
              <button class="btn-edit btn-ghost" @click="openEdit(row)">Editar</button>
              <button class="btn btn-ghost" @click="openPayments(row)">Fechas Abono</button>
              <button class="btn btn-danger" @click="confirmDelete(row)">Eliminar</button>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="23" class="empty">No hay registros que coincidan</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totales -->
    <div class="totals">
      <div><strong>Total Subtotal:</strong> {{ formatCurrency(totals.subtotal) }}</div>
      <div><strong>Total IVA:</strong> {{ formatCurrency(totals.iva) }}</div>
      <div><strong>Total General:</strong> {{ formatCurrency(totals.total) }}</div>
      <div><strong>Total Abonos:</strong> {{ formatCurrency(totals.abonos) }}</div>
    </div>

    <!-- Modal Crear / Editar -->
    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal large">
        <h3>{{ editing ? 'Editar registro BD PM' : 'Nuevo registro BD PM' }}</h3>

        <div class="modal-controls">
          <button class="btn-excel" @click="openImportFull">📋 Pegar desde Excel (Todo)</button>
        </div>

        <form @submit.prevent="save" class="modal-form">
          <div class="grid-4">
            <label>Centro de costo <input v-model="form.centro_costo" /></label>
            <label>Proyecto <input v-model="form.proyecto" required /></label>
            <label>Categoria <input v-model="form.categoria" /></label>
            <label>Nombre Proyecto <input v-model="form.nombre_proyecto" /></label>
          </div>
          <div class="grid-4">
            <label>Solicitud <input v-model="form.solicitud" /></label>
            <label>Cuenta <input v-model="form.cuenta" /></label>
            <label>Fecha <input type="date" v-model="form.fecha" /></label>
            <label>Tipo <input v-model="form.tipo" /></label>
          </div>
          <div class="grid-4">
            <label>Empresa <input v-model="form.empresa" /></label>
            <label>Proveedor <input v-model="form.proveedor" /></label>
            <label>Descripcion <textarea v-model="form.descripcion"></textarea></label>
            <label># Cotizacion <input v-model="form.cotizacion_num" /></label>
          </div>
          <div class="grid-4">
            <label>Personeria <input v-model="form.personeria" /></label>
            <label>Subtotal <input type="number" v-model.number="form.subtotal" min="0" /></label>
            <label>IVA <input type="number" v-model.number="form.iva" min="0" /></label>
            <label>Total Proyecto <input type="number" v-model.number="form.total_proyecto" min="0" /></label>
          </div>
          <div class="grid-4">
            <label>Anticipo <input type="number" v-model.number="form.anticipo" min="0" /></label>
            <label>Estado <select v-model="form.estado"><option>ACTIVO</option><option>PENDIENTE</option><option>CERRADO</option></select></label>
            <label>Comentario <textarea v-model="form.comentario"></textarea></label>
            <label>Presupuesto <input type="number" v-model.number="form.presupuesto" min="0" /></label>
          </div>
          <div class="grid-2">
            <label>Total Anticipos <input type="number" v-model.number="form.total_anticipos" min="0" /></label>
            <label>OBS <textarea v-model="form.obs"></textarea></label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary">{{ editing ? 'Guardar' : 'Crear' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Panel de Pagos -->
    <div v-if="paymentsPanelOpen" class="panel-backdrop" @click.self="closePaymentsPanel">
      <div class="panel">
        <div class="panel-header">
          <h3>Fechas de Abono - {{ currentRow?.proyecto }}</h3>
          <div class="panel-actions">
            <button class="btn-excel" @click="openImportPayments">📋 Pegar desde Excel (Anticipos)</button>
            <button class="btn btn-ghost" @click="closePaymentsPanel">Cerrar</button>
          </div>
        </div>

        <div class="panel-body">
          <table class="payments-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th class="right">Monto</th>
                <th class="actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in currentPayments" :key="p.id">
                <td>{{ formatDate(p.fecha) }}</td>
                <td class="right">{{ formatCurrency(p.monto) }}</td>
                <td class="actions">
                  <button class="btn btn-danger" @click="deletePayment(p.id)">Eliminar</button>
                </td>
              </tr>
              <tr v-if="currentPayments.length === 0">
                <td colspan="3" class="empty">No hay abonos registrados</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th>Total Abonos</th>
                <th class="right">{{ formatCurrency(sumPayments(currentPayments)) }}</th>
                <th></th>
              </tr>
            </tfoot>
          </table>

          <div class="add-payment">
            <h4>Añadir abono</h4>
            <div class="grid-2">
              <label>
                Fecha abono
                <input type="date" v-model="newPayment.fecha" />
              </label>
              <label>
                Monto
                <input type="number" v-model.number="newPayment.monto" min="0" />
              </label>
            </div>
            <div style="margin-top:10px;">
              <button class="btn btn-primary" @click="addPayment">Agregar abono</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel Importar desde Excel (Tabla Principal) -->
    <div v-if="importPanelOpen" class="modal-backdrop" @click.self="closeImportPanel">
      <div class="modal">
        <h3>Importar desde Excel (Tabla Principal)</h3>
        <div class="hint">Pega aquí los datos copiados desde Excel (se detectan encabezados automáticamente).</div>
        <textarea v-model="pasteData" @input="handlePaste" class="paste-textarea" placeholder="Pega aquí"></textarea>
        <div v-if="parseErrors.length" class="errors">
          <strong>Errores/avisos:</strong>
          <ul><li v-for="error in parseErrors" :key="error">{{ error }}</li></ul>
        </div>
        <div class="panel-actions">
          <button @click="togglePreview" class="btn-excel">{{ previewRows.length ? 'Ocultar vista previa' : 'Ver vista previa' }}</button>
          <button @click="saveImportedRows" :disabled="previewRows.length === 0" class="btn btn-primary">Importar</button>
          <button @click="closeImportPanel" class="btn btn-ghost">Cerrar</button>
        </div>
        <div v-if="previewRows.length" class="preview-section">
          <h4>Vista previa (primeros 5 registros)</h4>
          <table class="preview-table">
            <thead><tr><th>Proyecto</th><th>Proveedor</th><th>Subtotal</th><th>Estado</th></tr></thead>
            <tbody><tr v-for="(pr, i) in previewRows.slice(0,5)" :key="i"><td>{{ pr.proyecto }}</td><td>{{ pr.proveedor }}</td><td class="right">{{ formatCurrency(pr.subtotal) }}</td><td>{{ pr.estado }}</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Panel Importar Anticipos -->
    <div v-if="importPaymentsPanelOpen" class="modal-backdrop" @click.self="closeImportPaymentsPanel">
      <div class="modal">
        <h3>Importar Anticipos desde Excel</h3>
        <div class="hint">Pega filas de Excel: primera fila con fechas, segunda con montos (se transforman a columnas).</div>
        <textarea v-model="pastePaymentsData" @input="handlePastePayments" class="paste-textarea" placeholder="Pega aquí"></textarea>
        <div v-if="parsePaymentsErrors.length" class="errors">
          <strong>Errores/avisos:</strong>
          <ul><li v-for="error in parsePaymentsErrors" :key="error">{{ error }}</li></ul>
        </div>
        <div class="panel-actions">
          <button @click="saveImportedPayments" :disabled="previewPayments.length === 0" class="btn btn-primary">Importar Anticipos</button>
          <button @click="closeImportPaymentsPanel" class="btn btn-ghost">Cerrar</button>
        </div>
        <div v-if="previewPayments.length" class="preview-section">
          <h4>Vista previa Anticipos</h4>
          <table class="preview-table">
            <thead><tr><th>Fecha</th><th>Monto</th></tr></thead>
            <tbody><tr v-for="p in previewPayments" :key="p.id"><td>{{ formatDate(p.fecha) }}</td><td class="right">{{ formatCurrency(p.monto) }}</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Panel Importar Todo -->
    <div v-if="importFullPanelOpen" class="modal-backdrop" @click.self="closeImportFullPanel">
      <div class="modal large">
        <h3>Importar Todo desde Excel</h3>
        <div class="hint">Pega tabla completa: campos principales en primeras filas, anticipos en filas siguientes (fechas y montos).</div>
        <textarea v-model="pasteFullData" @input="handlePasteFull" class="paste-textarea" placeholder="Pega aquí"></textarea>
        <div v-if="parseFullErrors.length" class="errors">
          <strong>Errores/avisos:</strong>
          <ul><li v-for="error in parseFullErrors" :key="error">{{ error }}</li></ul>
        </div>
        <div class="panel-actions">
          <button @click="saveImportedFull" :disabled="previewFullRows.length === 0" class="btn btn-primary">Importar Todo</button>
          <button @click="closeImportFullPanel" class="btn btn-ghost">Cerrar</button>
        </div>
        <div v-if="previewFullRows.length" class="preview-section">
          <h4>Vista previa (Registro Completo)</h4>
          <div class="table-container">
            <table class="bdpm-table">
              <thead>
                <tr>
                  <th>Centro de costo</th>
                  <th>Proyecto</th>
                  <th>Categoria</th>
                  <th>Nombre Proyecto</th>
                  <th>Solicitud</th>
                  <th>Cuenta</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Empresa</th>
                  <th>Proveedor</th>
                  <th>Descripcion</th>
                  <th># Cotizacion</th>
                  <th>Personeria</th>
                  <th class="right">Subtotal</th>
                  <th class="right">IVA</th>
                  <th class="right">Total Proyecto</th>
                  <th class="right">Anticipo</th>
                  <th>Estado</th>
                  <th>Comentario</th>
                  <th class="right">Presupuesto</th>
                  <th class="right">Total Anticipos</th>
                  <th>OBS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in previewFullRows" :key="row._id">
                  <td>{{ row.centro_costo }}</td>
                  <td>{{ row.proyecto }}</td>
                  <td>{{ row.categoria }}</td>
                  <td>{{ row.nombre_proyecto }}</td>
                  <td>{{ row.solicitud }}</td>
                  <td>{{ row.cuenta }}</td>
                  <td>{{ formatDate(row.fecha) }}</td>
                  <td>{{ row.tipo }}</td>
                  <td>{{ row.empresa }}</td>
                  <td>{{ row.proveedor }}</td>
                  <td>{{ row.descripcion }}</td>
                  <td>{{ row.cotizacion_num }}</td>
                  <td>{{ row.personeria }}</td>
                  <td class="right">{{ formatCurrency(row.subtotal) }}</td>
                  <td class="right">{{ formatCurrency(row.iva) }}</td>
                  <td class="right">{{ formatCurrency(row.total_proyecto) }}</td>
                  <td class="right">{{ formatCurrency(row.anticipo) }}</td>
                  <td><span :class="['badge', estadoClass(row.estado)]">{{ row.estado }}</span></td>
                  <td>{{ row.comentario }}</td>
                  <td class="right">{{ formatCurrency(row.presupuesto) }}</td>
                  <td class="right">{{ formatCurrency(row.total_anticipos) }}</td>
                  <td>{{ row.obs }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h5>Anticipos Asociados</h5>
          <div v-if="previewFullRows[0]?.pagos?.length" class="anticipos-list">
            <p v-for="p in previewFullRows[0].pagos" :key="p.id" class="anticipo-item">
              Anticipo en {{ formatDate(p.fecha) }}: {{ formatCurrency(p.monto) }}
            </p>
          </div>
          <div v-else class="empty">No hay anticipos detectados.</div>
        </div>
      </div>
    </div>

    <!-- Confirmar eliminar registro -->
    <div v-if="deleteConfirmOpen" class="modal-backdrop" @click.self="deleteConfirmOpen=false">
      <div class="modal small">
        <h3>Eliminar registro</h3>
        <p>¿Eliminar <strong>{{ toDelete?.proyecto }}</strong> - {{ toDelete?.numero_documento }}?</p>
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
import staticData from '../data/bdpm_data.json';

const STORAGE_KEY = 'pm_bdpm_v1';

export default {
  name: 'BDPM',
  setup() {
    const rows = ref([]);
    const filter = ref('');
    const modalOpen = ref(false);
    const editing = ref(false);
    const form = ref({
      _id: null,
      centro_costo: '',
      proyecto: '',
      categoria: '',
      nombre_proyecto: '',
      solicitud: '',
      cuenta: '',
      fecha: '',
      tipo: '',
      empresa: '',
      proveedor: '',
      descripcion: '',
      cotizacion_num: '',
      personeria: '',
      subtotal: 0,
      iva: 0,
      total_proyecto: 0,
      anticipo: 0,
      estado: 'ACTIVO',
      comentario: '',
      presupuesto: 0,
      total_anticipos: 0,
      obs: '',
      pagos: []
    });

    const deleteConfirmOpen = ref(false);
    const toDelete = ref(null);

    // Panel de pagos
    const paymentsPanelOpen = ref(false);
    const currentRow = ref(null);
    const currentPayments = ref([]);
    const newPayment = ref({ fecha: '', monto: 0 });

    // Paneles de importación
    const importPanelOpen = ref(false);
    const pasteData = ref('');
    const previewRows = ref([]);
    const parseErrors = ref([]);

    const importPaymentsPanelOpen = ref(false);
    const pastePaymentsData = ref('');
    const previewPayments = ref([]);
    const parsePaymentsErrors = ref([]);

    const importFullPanelOpen = ref(false);
    const pasteFullData = ref('');
    const previewFullRows = ref([]);
    const parseFullErrors = ref([]);

    onMounted(() => {
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

    const assignId = (r) => ({ ...r, _id: r._id || generateId(), pagos: r.pagos ? r.pagos.map(p => ({ ...p, id: p.id || generateId() })) : [] });

    const generateId = () => 'bd_' + Math.random().toString(36).slice(2, 9);

    const persist = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value));
    };

    const openCreate = () => {
      editing.value = false;
      form.value = { _id: null, centro_costo: '', proyecto: '', categoria: '', nombre_proyecto: '', solicitud: '', cuenta: '', fecha: '', tipo: '', empresa: '', proveedor: '', descripcion: '', cotizacion_num: '', personeria: '', subtotal: 0, iva: 0, total_proyecto: 0, anticipo: 0, estado: 'ACTIVO', comentario: '', presupuesto: 0, total_anticipos: 0, obs: '', pagos: [] };
      modalOpen.value = true;
    };

    const openEdit = (row) => {
      editing.value = true;
      form.value = { ...row, pagos: row.pagos ? row.pagos.map(p => ({ ...p })) : [] };
      modalOpen.value = true;
    };

    const closeModal = () => { modalOpen.value = false; };

    const save = () => {
      if (!form.value.proyecto) { alert('Proyecto es obligatorio.'); return; }
      if (editing.value && form.value._id) {
        const idx = rows.value.findIndex(r => r._id === form.value._id);
        if (idx !== -1) rows.value.splice(idx, 1, { ...form.value });
      } else {
        const newRow = { ...form.value, _id: generateId(), pagos: form.value.pagos || [] };
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
      return rows.value.filter(r =>
        Object.values(r).some(value =>
          String(value || '').toLowerCase().includes(q)
        )
      );
    });

    const totals = computed(() => {
      const t = { subtotal: 0, iva: 0, total: 0, abonos: 0 };
      rows.value.forEach(r => {
        t.subtotal += Number(r.subtotal || 0);
        t.iva += Number(r.iva || 0);
        t.total += Number(r.total_proyecto || 0);
        if (Array.isArray(r.pagos)) {
          t.abonos += r.pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
        }
      });
      return t;
    });

    const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0));
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '';
    const estadoClass = (estado) => {
      const e = (estado || '').toLowerCase();
      if (e.includes('cerrado')) return 'closed';
      if (e.includes('activo')) return 'open';
      if (e.includes('pendiente')) return 'pending';
      return 'neutral';
    };

    // Panel de pagos funciones
    const openPayments = (row) => {
      currentRow.value = row;
      currentPayments.value = row.pagos ? row.pagos.map(p => ({ ...p })) : [];
      newPayment.value = { fecha: '', monto: 0 };
      paymentsPanelOpen.value = true;
    };

    const closePaymentsPanel = () => {
      paymentsPanelOpen.value = false;
      currentRow.value = null;
      currentPayments.value = [];
    };

    const sumPayments = (payments) => payments.reduce((s, p) => s + Number(p.monto || 0), 0);

    const addPayment = () => {
      if (!currentRow.value) return;
      const fecha = newPayment.value.fecha;
      const monto = Number(newPayment.value.monto || 0);
      if (!fecha || monto <= 0) {
        alert('Ingrese fecha y monto válidos');
        return;
      }
      const pago = { id: generateId(), fecha, monto };
      const idx = rows.value.findIndex(r => r._id === currentRow.value._id);
      if (idx !== -1) {
        rows.value[idx].pagos = rows.value[idx].pagos || [];
        rows.value[idx].pagos.push(pago);
        persist();
        currentPayments.value.push(pago);
        newPayment.value = { fecha: '', monto: 0 };
      }
    };

    const deletePayment = (paymentId) => {
      if (!currentRow.value) return;
      const idx = rows.value.findIndex(r => r._id === currentRow.value._id);
      if (idx === -1) return;
      rows.value[idx].pagos = (rows.value[idx].pagos || []).filter(p => p.id !== paymentId);
      persist();
      currentPayments.value = currentPayments.value.filter(p => p.id !== paymentId);
    };

    // Funciones de importación desde Excel
    const parseExcelData = (text) => {
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length < 1) return { rows: [], errors: ['No se encontraron líneas válidas.'] };

      let hasHeaders = false;
      let headerMap = {};
      const errors = [];

      if (/CENTRO DE COSTO|PROYECTO|CATEGORIA|NOMBRE PROYECTO|SOLICITUD|CUENTA|FECHA|TIPO|EMPRESA|PROVEEDOR|DESCRIPCION|# COTIZACION|PERSONERIA|SUBTOTAL|IVA|TOTAL PROYECTO|ANTICIPO|ESTADO|COMENTARIO|PRESUPUESTO|TOTAL ANTICIPOS|OBS/i.test(lines[0])) {
        hasHeaders = true;
        const headers = lines[0].split(/\s{2,}|\t+|,|;/).map(h => h.trim().toLowerCase());
        headers.forEach((h, i) => {
          if (h.includes('centro')) headerMap.centro_costo = i;
          else if (h === 'proyecto') headerMap.proyecto = i;
          else if (h === 'categoria') headerMap.categoria = i;
          else if (h.includes('nombre proyecto')) headerMap.nombre_proyecto = i;
          else if (h === 'solicitud') headerMap.solicitud = i;
          else if (h === 'cuenta') headerMap.cuenta = i;
          else if (h === 'fecha') headerMap.fecha = i;
          else if (h === 'tipo') headerMap.tipo = i;
          else if (h === 'empresa') headerMap.empresa = i;
          else if (h === 'proveedor') headerMap.proveedor = i;
          else if (h === 'descripcion') headerMap.descripcion = i;
          else if (h.includes('# cotizacion')) headerMap.cotizacion_num = i;
          else if (h === 'personeria') headerMap.personeria = i;
          else if (h === 'subtotal') headerMap.subtotal = i;
          else if (h === 'iva') headerMap.iva = i;
          else if (h.includes('total proyecto')) headerMap.total_proyecto = i;
          else if (h === 'anticipo') headerMap.anticipo = i;
          else if (h === 'estado') headerMap.estado = i;
          else if (h === 'comentario') headerMap.comentario = i;
          else if (h === 'presupuesto') headerMap.presupuesto = i;
          else if (h.includes('total anticipos')) headerMap.total_anticipos = i;
          else if (h === 'obs') headerMap.obs = i;
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

        const getValue = (key, defaultIdx) => {
          const idx = headerMap[key] !== undefined ? headerMap[key] : defaultIdx;
          return values[idx] || '';
        };

        const row = {
          _id: null,
          centro_costo: getValue('centro_costo', 0),
          proyecto: getValue('proyecto', 1),
          categoria: getValue('categoria', 2),
          nombre_proyecto: getValue('nombre_proyecto', 3),
          solicitud: getValue('solicitud', 4),
          cuenta: getValue('cuenta', 5),
          fecha: getValue('fecha', 6),
          tipo: getValue('tipo', 7),
          empresa: getValue('empresa', 8),
          proveedor: getValue('proveedor', 9),
          descripcion: getValue('descripcion', 10),
          cotizacion_num: getValue('cotizacion_num', 11),
          personeria: getValue('personeria', 12),
          subtotal: parseNum(getValue('subtotal', 13)),
          iva: parseNum(getValue('iva', 14)),
          total_proyecto: parseNum(getValue('total_proyecto', 15)),
          anticipo: parseNum(getValue('anticipo', 16)),
          estado: getValue('estado', 17) || 'ACTIVO',
          comentario: getValue('comentario', 18),
          presupuesto: parseNum(getValue('presupuesto', 19)),
          total_anticipos: parseNum(getValue('total_anticipos', 20)),
          obs: getValue('obs', 21),
          pagos: []
        };

        if (row.proyecto) result.push(row);
        else ignoredLines++;
      }

      if (ignoredLines > 0) errors.push(`${ignoredLines} líneas ignoradas.`);
      if (result.length === 0) errors.push('No se pudieron parsear filas válidas.');

      return { rows: result, errors };
    };

    const parsePaymentsData = (text) => {
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) return { payments: [], errors: ['Se necesitan al menos 2 líneas: fechas y montos.'] };

      const errors = [];
      const fechas = lines[0].split(/\s{2,}|\t+|,|;/).map(v => v.trim()).filter(v => v);
      const montos = lines[1].split(/\s{2,}|\t+|,|;/).map(v => v.trim()).filter(v => v);

      if (fechas.length !== montos.length) {
        errors.push('El número de fechas y montos no coincide.');
        return { payments: [], errors };
      }

      const payments = [];
      for (let i = 0; i < fechas.length; i++) {
        const fecha = fechas[i];
        const monto = parseFloat(montos[i].replace(/[$,\s]/g, '')) || 0;
        if (fecha && monto > 0) {
          payments.push({ id: generateId(), fecha, monto });
        } else {
          errors.push(`Pago ${i + 1} inválido.`);
        }
      }

      return { payments, errors };
    };

    const parseFullData = (text) => {
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) return { rows: [], errors: ['Se necesitan al menos 2 líneas: headers y datos.'] };

      const errors = [];
      const headers = lines[0].split(/\s{2,}|\t+|,|;/).map(h => h.trim().toLowerCase());
      const values = lines[1].split(/\s{2,}|\t+|,|;/).map(v => v.trim()).filter(v => v);

      if (headers.length !== values.length) {
        errors.push('El número de headers y valores no coincide.');
        return { rows: [], errors };
      }

      // Mapear campos principales (primeros 22)
      const mainFields = [
        'centro_costo', 'proyecto', 'categoria', 'nombre_proyecto', 'solicitud', 'cuenta', 'fecha', 'tipo', 'empresa', 'proveedor', 'descripcion', 'cotizacion_num', 'personeria', 'subtotal', 'iva', 'total_proyecto', 'anticipo', 'estado', 'comentario', 'presupuesto', 'total_anticipos', 'obs'
      ];

      const mainRow = {};
      mainFields.forEach((field, i) => {
        if (i < headers.length) {
          const val = values[i] || '';
          if (['subtotal', 'iva', 'total_proyecto', 'anticipo', 'presupuesto', 'total_anticipos'].includes(field)) {
            mainRow[field] = parseFloat(val.replace(/[$,\s]/g, '')) || 0;
          } else {
            mainRow[field] = val;
          }
        }
      });

      // Detectar columnas extra como anticipos (después de 'obs')
      const pagos = [];
      const obsIndex = mainFields.indexOf('obs');
      for (let i = obsIndex + 1; i < headers.length; i++) {
        const fecha = headers[i].trim();
        const montoStr = values[i] || '';
        const monto = parseFloat(montoStr.replace(/[$,\s]/g, '')) || 0;
        if (fecha && monto > 0) {
          pagos.push({ id: generateId(), fecha, monto });
        }
      }

      mainRow.pagos = pagos;
      mainRow._id = generateId();

      if (!mainRow.proyecto) errors.push('Proyecto faltante.');

      return { rows: [mainRow], errors };
    };

    // Funciones para paneles de importación
    const openImport = () => {
      importPanelOpen.value = true;
      pasteData.value = '';
      previewRows.value = [];
      parseErrors.value = [];
    };

    const closeImportPanel = () => {
      importPanelOpen.value = false;
      pasteData.value = '';
      previewRows.value = [];
      parseErrors.value = [];
    };

    const handlePaste = () => {
      if (pasteData.value.trim()) {
        const parsed = parseExcelData(pasteData.value);
        previewRows.value = parsed.rows;
        parseErrors.value = parsed.errors;
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

    const saveImportedRows = () => {
      if (!previewRows.value.length) return;
      previewRows.value.forEach(r => {
        const newRow = { ...r, _id: generateId() };
        rows.value.unshift(newRow);
      });
      persist();
      importPanelOpen.value = false;
      pasteData.value = '';
      previewRows.value = [];
      parseErrors.value = [];
      alert(`${previewRows.value.length} registros importados exitosamente.`);
    };

    const openImportPayments = () => {
      importPaymentsPanelOpen.value = true;
      pastePaymentsData.value = '';
      previewPayments.value = [];
      parsePaymentsErrors.value = [];
    };

    const closeImportPaymentsPanel = () => {
      importPaymentsPanelOpen.value = false;
      pastePaymentsData.value = '';
      previewPayments.value = [];
      parsePaymentsErrors.value = [];
    };

    const handlePastePayments = () => {
      if (pastePaymentsData.value.trim()) {
        const parsed = parsePaymentsData(pastePaymentsData.value);
        previewPayments.value = parsed.payments;
        parsePaymentsErrors.value = parsed.errors;
      } else {
        parsePaymentsErrors.value = [];
      }
    };

    const saveImportedPayments = () => {
      if (!previewPayments.value.length || !currentRow.value) return;
      const idx = rows.value.findIndex(r => r._id === currentRow.value._id);
      if (idx !== -1) {
        rows.value[idx].pagos = rows.value[idx].pagos || [];
        rows.value[idx].pagos.push(...previewPayments.value);
        persist();
        currentPayments.value.push(...previewPayments.value);
        importPaymentsPanelOpen.value = false;
        pastePaymentsData.value = '';
        previewPayments.value = [];
        parsePaymentsErrors.value = [];
        alert(`${previewPayments.value.length} anticipos importados exitosamente.`);
      }
    };

    const openImportFull = () => {
      importFullPanelOpen.value = true;
      pasteFullData.value = '';
      previewFullRows.value = [];
      parseFullErrors.value = [];
    };

    const closeImportFullPanel = () => {
      importFullPanelOpen.value = false;
      pasteFullData.value = '';
      previewFullRows.value = [];
      parseFullErrors.value = [];
    };

    const handlePasteFull = () => {
      if (pasteFullData.value.trim()) {
        const parsed = parseFullData(pasteFullData.value);
        previewFullRows.value = parsed.rows;
        parseFullErrors.value = parsed.errors;
      } else {
        parseFullErrors.value = [];
      }
    };

    const saveImportedFull = () => {
      if (!previewFullRows.value.length) return;
      previewFullRows.value.forEach(r => {
        const newRow = { ...r, _id: generateId() };
        rows.value.unshift(newRow);
      });
      persist();
      importFullPanelOpen.value = false;
      pasteFullData.value = '';
      previewFullRows.value = [];
      parseFullErrors.value = [];
      alert(`${previewFullRows.value.length} registro(s) completo(s) importado(s) exitosamente.`);
    };

    return {
      rows, filter, filteredRows, totals,
      formatCurrency, formatDate, estadoClass,
      modalOpen, openCreate, openEdit, closeModal, form, save, editing,
      confirmDelete, deleteConfirmOpen, deleteRow, toDelete,
      paymentsPanelOpen, openPayments, closePaymentsPanel, currentRow, currentPayments,
      newPayment, addPayment, deletePayment, sumPayments,
      importPanelOpen, openImport, closeImportPanel, pasteData, previewRows, parseErrors, handlePaste, togglePreview, saveImportedRows,
      importPaymentsPanelOpen, openImportPayments, closeImportPaymentsPanel, pastePaymentsData, previewPayments, parsePaymentsErrors, handlePastePayments, saveImportedPayments,
      importFullPanelOpen, openImportFull, closeImportFullPanel, pasteFullData, previewFullRows, parseFullErrors, handlePasteFull, saveImportedFull
    };
  }
};
</script>

<style scoped>
.bdpm-page { 
  padding: 12px; 
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Fuente más moderna */
}

.header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  gap: 12px; 
  margin-bottom: 12px; 
}

.controls { 
  display: flex; 
  gap: 8px; 
  align-items: center; 
}

.search { 
  padding: 8px 12px; 
  border-radius: 8px; 
  border: 1px solid #ddd; 
  min-width: 260px; 
  font-size: 0.9rem; 
}

/* Contenedor para scroll horizontal */
.table-container { 
  overflow-x: auto; /* Scroll horizontal solo en este contenedor */
  border-radius: 8px; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); 
  background: #fff; 
  margin-bottom: 12px; 
}

.bdpm-table { 
  width: 100%; 
  min-width: 2000px; /* Ancho mínimo para forzar scroll horizontal */
  border-collapse: collapse; 
  background: #fff; 
  font-size: 0.8rem; /* Más pequeño para compactar */
}

.bdpm-table th, .bdpm-table td { 
  padding: 6px 8px; /* Padding reducido */
  border: 1px solid #e0e0e0; /* Bordes más sutiles */
  text-align: left; 
  vertical-align: middle; /* Alineación vertical */
}

.bdpm-table thead th { 
  background: linear-gradient(135deg, #f0f6f0, #e8f5e8); /* Gradiente sutil */
  color: #0b6b2f; 
  font-weight: 600; 
  font-size: 0.85rem; 
  position: sticky; /* Headers fijos al hacer scroll */
  top: 0; 
  z-index: 10; 
}

.bdpm-table tbody tr:nth-child(even) { 
  background: #f9f9f9; /* Filas alternas para mejor legibilidad */
}

.bdpm-table tbody tr:hover { 
  background: #e8f5e8; /* Hover suave */
  transition: background 0.2s ease; 
}

.bdpm-table th.right, .bdpm-table td.right { 
  text-align: right; 
}

.actions { 
  width: 180px; /* Más estrecho */
  text-align: center; 
  white-space: nowrap; /* Evita wrap en botones */
}

.empty { 
  text-align: center; 
  padding: 20px; 
  color: #888; 
  font-style: italic; 
}

.totals { 
  display: flex; 
  gap: 20px; 
  margin-top: 16px; 
  font-weight: 700; 
  background: #f0f6f0; 
  padding: 12px; 
  border-radius: 8px; 
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1); 
}

.badge { 
  padding: 4px 8px; 
  border-radius: 12px; 
  font-weight: 600; 
  font-size: 0.75rem; 
}

.badge.closed { background: #f8d7da; color: #842029; }
.badge.open { background: #d1e7dd; color: #0b6b2f; }
.badge.pending { background: #fff3cd; color: #664d03; }
.badge.neutral { background: #e9ecef; color: #495057; }

.negative { color: #d9534f; font-weight: 700; }

/* Buttons */
.btn { 
  padding: 6px 10px; 
  border-radius: 6px; 
  border: 1px solid transparent; 
  cursor: pointer; 
  font-size: 0.85rem; 
  transition: all 0.2s ease; 
}

.btn:hover { 
  transform: translateY(-1px); /* Efecto hover sutil */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); 
}

.btn-primary { background: #0b6b2f; color: #fff; }
.btn-ghost { background: transparent; border: 1px solid #ddd; color: #0b6b2f; }
.btn-danger { background: #d9534f; color: #fff; }
.btn-excel { background: #1e9a4a; color: white; border: none; padding: 8px 12px; border-radius: 999px; }

/* Modal */
.modal-backdrop { 
  position: fixed; 
  inset: 0; 
  background: rgba(0, 0, 0, 0.4); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 80; /* Aumentado para aparecer encima del panel de pagos */
  padding: 16px; 
}

.modal { 
  background: #fff; 
  border-radius: 12px; 
  padding: 20px; 
  width: 100%; 
  max-width: 760px; 
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); 
}

.modal.large { max-width: 1200px; } /* Para el modal de Nuevo con todos los campos */
.modal.small { max-width: 420px; }
.modal h3 { margin: 0 0 16px 0; color: #0b6b2f; }
.modal form label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
.modal input, .modal select, .modal textarea { 
  width: 100%; 
  padding: 10px; 
  border-radius: 8px; 
  border: 1px solid #ddd; 
  margin-top: 6px; 
  font-size: 0.9rem; 
}

.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.modal-controls { display: flex; justify-content: flex-end; margin-bottom: 12px; }

/* Panel de pagos */
.panel-backdrop { 
  position: fixed; 
  inset: 0; 
  background: rgba(0, 0, 0, 0.4); 
  display: flex; 
  align-items: flex-start; 
  justify-content: center; 
  z-index: 70; 
  padding: 24px; 
  overflow: auto; 
}

.panel { 
  background: #fff; 
  border-radius: 12px; 
  padding: 20px; 
  width: 100%; 
  max-width: 980px; 
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18); 
}

.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.panel-body { display: flex; gap: 20px; align-items: flex-start; }
.payments-table { width: 60%; border-collapse: collapse; }
.payments-table th, .payments-table td { padding: 8px; border: 1px solid #e0e0e0; text-align: left; }
.payments-table thead th { background: #f0f6f0; color: #0b6b2f; font-weight: 600; }
.payments-table th.right, .payments-table td.right { text-align: right; }
.add-payment { 
  width: 40%; 
  background: #f9f9f9; 
  padding: 16px; 
  border-radius: 8px; 
  border: 1px solid #eee; 
}

/* Paneles de importación */
.paste-textarea { width: 100%; height: 140px; padding: 8px; font-family: monospace; border-radius: 8px; border: 1px solid #ddd; }
.preview-section { margin-top: 12px; }
.preview-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.preview-table th, .preview-table td { border: 1px solid #0b6b2f; padding: 6px; }
.panel-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
.errors { margin-top: 8px; padding: 8px; background: #f8d7da; color: #842029; border-radius: 6px; font-size: 0.9rem; }
.errors ul { margin: 0; padding-left: 16px; }
.errors li { margin-bottom: 4px; }

/* Estilos para la lista descriptiva de anticipos */
.anticipos-list {
  margin-top: 12px;
}

.anticipo-item {
  background: #f9f9f9;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 6px;
  border-left: 4px solid #0b6b2f;
  font-size: 0.9rem;
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .bdpm-table { font-size: 0.75rem; }
  .actions { width: 150px; }
  .totals { flex-direction: column; gap: 8px; }
  .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
}
</style>