<template>
	<div class="page lc-page">
		<div class="header-row">
			<h2>Lineas del P&G (LC)</h2>
			<div class="controls">
				<input v-model="q" placeholder="Buscar por código o descripción..." class="search" />
				<button @click="openCreate" class="btn">Nuevo</button>
				<button @click="openPasteMode" class="btn-excel">Pegar desde Excel</button>
			</div>
		</div>

		<div class="table-wrap">
			<table class="lc-table">
				<thead>
					<tr>
						<th>Codigo</th>
						<th>Descripción</th>
						<th>Acciones</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="r in rowsComputed" :key="r._id">
						<td>{{ r.codigo }}</td>
						<td>{{ r.descripcion }}</td>
						<td>
							  <button @click="openEdit(r)" class="btn-edit small">Editar</button>
							<button @click="remove(r)" class="btn small danger">Borrar</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Modal Crear/Editar -->
		<div v-if="showModal" class="modal-backdrop">
			<div class="modal">
				<h3>{{ editingId ? 'Editar' : 'Nuevo' }}</h3>
				<div class="form-row"><label>Codigo</label><input v-model="form.codigo" /></div>
				<div class="form-row"><label>Descripción</label><input v-model="form.descripcion" /></div>
				<div class="modal-actions">
					<button @click="save" class="btn">Guardar</button>
					<button @click="closeModal" class="btn">Cancelar</button>
				</div>
			</div>
		</div>

		<!-- Panel Pegar desde Excel -->
		<div v-if="pasteMode" class="paste-backdrop">
			<div class="paste-panel">
				<h3>Pegar desde Excel</h3>
				<textarea v-model="pasteData" placeholder="Pega aquí las filas copiadas desde Excel" rows="8"></textarea>

				<div class="paste-actions">
					<button @click="togglePreview" class="btn-excel">{{ previewRows.length ? 'Ocultar vista previa' : 'Ver vista previa' }}</button>
					<button @click="saveImportedRows" :disabled="previewRows.length === 0" class="btn btn-primary">Importar</button>
					<button @click="closePasteMode" class="btn btn-ghost">Cerrar</button>
				</div>

				<div v-if="previewRows.length" class="preview">
					<h4>Vista previa</h4>
					<table class="preview-table">
						<thead>
							<tr><th>Cod.</th><th>Descripción</th></tr>
						</thead>
						<tbody>
							<tr v-for="(r, idx) in previewRows" :key="idx">
								<td>{{ r.codigo }}</td>
								<td>{{ r.descripcion }}</td>
							</tr>
						</tbody>
					</table>
					<div class="paste-actions">
						<button @click="saveImportedRows" class="btn btn-primary">Importar</button>
						<button @click="clearPreview" class="btn btn-ghost">Limpiar vista previa</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
	name: 'LCPage',
	setup() {
		const STORAGE_KEY = 'pm_lc_v1';
		const rows = ref([]);
		const showModal = ref(false);
		const editingId = ref(null);
		const form = ref({ codigo: '', descripcion: '' });

		const pasteMode = ref(false);
		const pasteData = ref('');
		const previewRows = ref([]);

		const q = ref('');

		const load = () => {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				rows.value = raw ? JSON.parse(raw) : [];
			} catch (e) {
				rows.value = [];
			}
		};

		const persist = () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value));
		};

		const uid = () => 'lc_' + Math.random().toString(36).slice(2, 9);

		const openCreate = () => { editingId.value = null; form.value = { codigo: '', descripcion: '' }; showModal.value = true; };

		const openEdit = (r) => { editingId.value = r._id; form.value = { codigo: r.codigo, descripcion: r.descripcion }; showModal.value = true; };

		const closeModal = () => { showModal.value = false; };

		const save = () => {
			const item = { _id: editingId.value || uid(), codigo: (form.value.codigo || '').toString().trim(), descripcion: (form.value.descripcion || '').toString().trim() };
			if (editingId.value) {
				const idx = rows.value.findIndex(x => x._id === editingId.value);
				if (idx !== -1) rows.value.splice(idx, 1, item);
			} else rows.value.unshift(item);
			persist();
			showModal.value = false;
		};

		const remove = (r) => {
			if (!confirm('¿Borrar registro?')) return;
			rows.value = rows.value.filter(x => x._id !== r._id);
			persist();
		};

		// Paste / Excel parsing
		const openPasteMode = () => { pasteMode.value = true; pasteData.value = ''; previewRows.value = []; };
		const closePasteMode = () => { pasteMode.value = false; pasteData.value = ''; previewRows.value = []; };

		const parseNum = (str) => { if (!str && str !== 0) return 0; const cleaned = String(str).replace(/[^0-9.\-]/g, ''); return parseFloat(cleaned) || 0; };

		const parseExcelData = (text) => {
			const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
			if (!lines.length) return [];
			// detect header
			const firstHasHeader = /Cod|Código|Linea|Línea|Descripción|Total/i.test(lines[0]);
			const start = firstHasHeader ? 1 : 0;
			const out = [];
			for (let i = start; i < lines.length; i++) {
				let line = lines[i];
				if (!line || /total/i.test(line)) continue;
				// split initial tokens by tabs or multiple spaces
				let values = line.split(/\t+|\s{2,}/).map(v => v.trim()).filter(v => v && v !== '-' && v !== '–');
				// If any token contains ' - ' (code - desc), split it into two tokens
				values = values.flatMap(tok => tok.includes(' - ') ? tok.split(/\s-\s/).map(s => s.trim()) : [tok]);
				// remove stray '-' tokens after splitting
				values = values.filter(v => v !== '-' && v !== '–');
				if (values.length < 1) continue;
				const codigo = values[0] || '';
				// Build description: join all remaining tokens but drop trailing numeric token (possible total)
				let tail = values.slice(1);
				if (tail.length && /^\$?[-\d.,]+$/.test(tail[tail.length - 1])) tail = tail.slice(0, -1);
				const descripcion = tail.join(' - ');
				out.push({ _id: null, codigo, descripcion });
			}
			return out;
		};

		const handlePaste = () => { previewRows.value = parseExcelData(pasteData.value || ''); };

		const togglePreview = () => {
			if (previewRows.value.length) previewRows.value = [];
			else previewRows.value = parseExcelData(pasteData.value || '');
		};

		const clearPreview = () => { previewRows.value = []; };

		const saveImportedRows = () => {
			if (!previewRows.value.length) return;
			for (const r of previewRows.value.reverse()) {
				const newRow = { _id: uid(), codigo: r.codigo, descripcion: r.descripcion };
				rows.value.unshift(newRow);
			}
			persist();
			pasteData.value = '';
			previewRows.value = [];
			pasteMode.value = false;
		};

		const formatCurrency = (v) => {
			const n = Number(v || 0);
			return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
		};

		const rowsComputed = computed(() => {
			const query = (q.value || '').toString().trim().toLowerCase();
			const mapped = rows.value.map(r => ({ ...r, _id: r._id || uid() }));
			if (!query) return mapped;
			return mapped.filter(m => (m.codigo || '').toString().toLowerCase().includes(query) || (m.descripcion || '').toString().toLowerCase().includes(query));
		});

		onMounted(load);

		return {
		  q,
		  rows,
		  rowsComputed,
		  showModal,
		  form,
		  openCreate,
		  openEdit,
		  save,
		  remove,
		  closeModal,
		  formatCurrency,
		  pasteMode,
		  pasteData,
		  openPasteMode,
		  closePasteMode,
		  handlePaste,
		  previewRows,
		  saveImportedRows,
		  togglePreview,
		  clearPreview
		};
	}
}
</script>

<style scoped>
.lc-page { padding: 12px; }
.header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.controls { display:flex; gap:8px; align-items:center; }
.controls .btn { margin-left:8px; }
/* Hacer la caja de búsqueda igual que Creos */
.search { padding:6px 8px; border-radius:6px; border:1px solid #e6f4ea; min-width:300px; }
.table-wrap { overflow:auto; }
.lc-table { width:100%; border-collapse:collapse; }
.lc-table th, .lc-table td { border:1px solid #0b6b2f; padding:8px; }
.lc-table thead th { background:#f0f6f0; }
.text-right { text-align:right; }
.btn { padding:6px 10px; background:#0b6b2f; color:white; border:none; cursor:pointer; }
.btn.small { padding:4px 8px; font-size:0.9em; }
.btn.danger { background:#c0392b; }
.btn.primary { background:#0069d9; }
.modal-backdrop, .paste-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:60; }
.modal { background:white; padding:16px; width:420px; border-radius:6px; }
.form-row { margin-bottom:8px; display:flex; flex-direction:column; }
.form-row label { font-size:0.9em; margin-bottom:4px; }
.form-row input, textarea { padding:6px; border:1px solid #ddd; border-radius:4px; }
.modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:8px; }
.paste-panel { background:white; padding:12px; width:760px; max-height:80vh; overflow:auto; border-radius:6px; }
.preview-table { width:100%; border-collapse:collapse; margin-top:8px; }
.preview-table th, .preview-table td { border:1px solid #ddd; padding:6px; }
</style>

