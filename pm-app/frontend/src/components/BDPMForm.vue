<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Proyecto -->
    <section class="card">
      <h3>Proyecto</h3>
      <div class="grid-2">
        <div class="form-row">
          <label>Código</label>
          <input v-model="model.proyecto.codigo" />
        </div>
        <div class="form-row">
          <label>Nombre</label>
          <input v-model="model.proyecto.nombre" />
        </div>
        <div class="form-row">
          <label>Categoría</label>
          <input v-model="model.proyecto.categoria" />
        </div>
        <div class="form-row">
          <label>Centro de costo</label>
          <input v-model="model.proyecto.centro_costo" />
        </div>
        <div class="form-row">
          <label>Presupuesto</label>
          <input type="number" v-model.number="model.proyecto.presupuesto" />
        </div>
      </div>
    </section>

    <!-- Proveedor -->
    <section class="card">
      <h3>Proveedor</h3>
      <div class="grid-2">
        <div class="form-row">
          <label>Proveedor existente</label>
          <select v-model="selectedProveedorId">
            <option value="">-- Nuevo proveedor --</option>
            <option v-for="p in proveedores" :key="p.proveedor_id" :value="p.proveedor_id">{{ p.nombre }}</option>
          </select>
        </div>

        <div v-if="!selectedProveedorId" class="grid-2">
          <div class="form-row">
            <label>Nombre</label>
            <input v-model="model.proveedor.nombre" />
          </div>
          <div class="form-row">
            <label>Tipo personería</label>
            <input v-model="model.proveedor.tipo_personeria" />
          </div>
          <div class="form-row">
            <label>Documento identidad</label>
            <input v-model="model.proveedor.documento_identidad" />
          </div>
          <div class="form-row">
            <label>Contacto</label>
            <input v-model="model.proveedor.contacto" />
          </div>
        </div>
      </div>
    </section>

    <!-- Documento -->
    <section class="card">
      <h3>Documento de contrato</h3>
      <div class="grid-2">
        <div class="form-row">
          <label>Tipo documento</label>
          <input v-model="model.documento.tipo_documento" />
        </div>
        <div class="form-row">
          <label>Número</label>
          <input v-model="model.documento.numero" />
        </div>
        <div class="form-row">
          <label>Fecha</label>
          <input type="date" v-model="model.documento.fecha_documento" />
        </div>
        <div class="form-row">
          <label>Proveedor (si no seleccionaste uno)</label>
          <input v-model="model.documento.proveedor_nombre" placeholder="Nombre proveedor" />
        </div>

        <div class="form-row">
          <label>Subtotal</label>
          <input type="number" v-model.number="model.documento.subtotal" @input="recalcTotal" />
        </div>
        <div class="form-row">
          <label>IVA (%)</label>
          <input type="number" v-model.number="model.documento.iva_pct" @input="recalcTotal" />
        </div>
        <div class="form-row">
          <label>Total</label>
          <input type="number" :value="model.documento.total" readonly />
        </div>

        <div class="form-row">
          <label>Anticipo</label>
          <select v-model="model.documento.anticipo_flag">
            <option :value="false">No</option>
            <option :value="true">Sí</option>
          </select>
        </div>

        <div class="form-row" style="grid-column:1 / -1">
          <label>Descripción</label>
          <textarea v-model="model.documento.descripcion" rows="3"></textarea>
        </div>
      </div>
    </section>

    <!-- Anticipo -->
    <section class="card" v-if="model.documento.anticipo_flag">
      <h3>Anticipo</h3>
      <div class="grid-2">
        <div class="form-row">
          <label>Fecha pago</label>
          <input type="date" v-model="model.anticipo.fecha_pago" />
        </div>
        <div class="form-row">
          <label>Monto</label>
          <input type="number" v-model.number="model.anticipo.monto" />
        </div>
        <div class="form-row">
          <label>Tipo pago</label>
          <input v-model="model.anticipo.tipo_pago" />
        </div>
        <div class="form-row" style="grid-column:1 / -1">
          <label>Comentario</label>
          <textarea v-model="model.anticipo.comentario" rows="2"></textarea>
        </div>
      </div>
    </section>

    <!-- Ejecución -->
    <section class="card">
      <h3>Ejecución</h3>
      <div class="grid-2">
        <div class="form-row">
          <label>Fecha</label>
          <input type="date" v-model="model.ejecucion.fecha" />
        </div>
        <div class="form-row">
          <label>Monto</label>
          <input type="number" v-model.number="model.ejecucion.monto" />
        </div>
        <div class="form-row">
          <label>Categoría gasto</label>
          <input v-model="model.ejecucion.categoria_gasto" />
        </div>
        <div class="form-row">
          <label>Documento referencia</label>
          <input v-model="model.ejecucion.documento_referencia" />
        </div>
        <div class="form-row" style="grid-column:1 / -1">
          <label>Descripción</label>
          <textarea v-model="model.ejecucion.descripcion" rows="2"></textarea>
        </div>
      </div>
    </section>

    <!-- Acciones -->
    <div class="form-actions">
      <button type="button" class="btn btn-ghost" @click="reset">Limpiar</button>
      <button type="submit" class="btn btn-primary">Guardar todo</button>
    </div>
  </form>
</template>

<script>
import axios from 'axios';
import { ref, reactive, onMounted } from 'vue';
import { useAppStore } from '../store';

export default {
  emits: ['saved'],
  setup(_, { emit }) {
    const store = useAppStore();
    const proveedores = ref([]);
    const selectedProveedorId = ref('');

    const model = reactive({
      proyecto: { codigo:'', nombre:'', categoria:'', centro_costo:'', presupuesto:0 },
      proveedor: { nombre:'', tipo_personeria:'', documento_identidad:'', contacto:'' },
      documento: { tipo_documento:'', numero:'', fecha_documento:'', proveedor_id:null, proveedor_nombre:'', subtotal:0, iva_pct:19, total:0, anticipo_flag:false, descripcion:'' },
      anticipo: { fecha_pago:'', monto:0, tipo_pago:'', comentario:'' },
      ejecucion: { fecha:'', monto:0, categoria_gasto:'', descripcion:'', documento_referencia:'' }
    });

    onMounted(async () => {
      await store.loadProveedores();
      proveedores.value = store.proveedores || [];
    });

    const recalcTotal = () => {
      const s = Number(model.documento.subtotal || 0);
      const iva = Number(model.documento.iva_pct || 0);
      model.documento.total = Math.round((s * (1 + iva/100)) * 100) / 100;
    };

    const validate = () => {
      if (!model.proyecto.nombre) return 'El nombre del proyecto es obligatorio';
      if (!model.documento.tipo_documento || !model.documento.numero) return 'Documento: tipo y número obligatorios';
      return null;
    };

    const handleSubmit = async () => {
      const err = validate();
      if (err) return alert(err);

      try {
        // 1. Crear proyecto
        let proyectoId = null;
        const pResp = await axios.post('/api/proyectos', model.proyecto).catch(()=>null);
        proyectoId = pResp?.data?.proyecto_id || null;

        // 2. Proveedor
        let proveedorId = selectedProveedorId.value || null;
        if (!proveedorId && model.proveedor.nombre) {
          const provResp = await axios.post('/api/proveedores', model.proveedor).catch(()=>null);
          proveedorId = provResp?.data?.proveedor_id || null;
        }

        // 3. Documento
        const docPayload = {
          proyecto_id: proyectoId,
          tipo_documento: model.documento.tipo_documento,
          numero: model.documento.numero,
          proveedor_id: proveedorId,
          subtotal: model.documento.subtotal,
          iva: Math.round((model.documento.subtotal * (model.documento.iva_pct/100)) * 100)/100,
          total: model.documento.total,
          fecha_documento: model.documento.fecha_documento,
          descripcion: model.documento.descripcion,
          anticipo_flag: model.documento.anticipo_flag
        };
        const docResp = await axios.post('/api/documentos', docPayload).catch(()=>null);
        const documentoId = docResp?.data?.documento_id || null;

        // 4. Anticipo
        if (model.documento.anticipo_flag && model.anticipo.monto > 0) {
          const anticipoPayload = {
            proyecto_id: proyectoId,
            documento_id: documentoId,
            fecha_pago: model.anticipo.fecha_pago,
            monto: model.anticipo.monto,
            tipo_pago: model.anticipo.tipo_pago,
            comentario: model.anticipo.comentario
          };
          await axios.post('/api/anticipos', anticipoPayload).catch(()=>null);
        }

        // 5. Ejecución
        if (model.ejecucion.monto > 0) {
          const ejecPayload = {
            proyecto_id: proyectoId,
            fecha: model.ejecucion.fecha,
            monto: model.ejecucion.monto,
            categoria_gasto: model.ejecucion.categoria_gasto,
            descripcion: model.ejecucion.descripcion,
            documento_referencia: model.ejecucion.documento_referencia
          };
          await axios.post('/api/ejecuciones', ejecPayload).catch(()=>null);
        }

        emit('saved', { proyectoId, documentoId });
      } catch (e) {
        console.error(e);
        alert('Error guardando datos');
      }
    };

    const reset = () => {
      Object.assign(model.proyecto, { codigo:'', nombre:'', categoria:'', centro_costo:'', presupuesto:0 });
      Object.assign(model.proveedor, { nombre:'', tipo_personeria:'', documento_identidad:'', contacto:'' });
      Object.assign(model.documento, { tipo_documento:'', numero:'', fecha_documento:'', proveedor_id:null, proveedor_nombre:'', subtotal:0, iva_pct:19, total:0, anticipo_flag:false, descripcion:'' });
      Object.assign(model.anticipo, { fecha_pago:'', monto:0, tipo_pago:'', comentario:'' });
      Object.assign(model.ejecucion, { fecha:'', monto:0, categoria_gasto:'', descripcion:'', documento_referencia:'' });
      selectedProveedorId.value = '';
    };

    return { model, proveedores, selectedProveedorId, recalcTotal, handleSubmit, reset };
  }
};
</script>

<style scoped>
.grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.card { background:var(--white); border-radius:10px; padding:12px; border:1px solid #f0f7f0; margin-bottom:12px; }
.form-row label { font-weight:600; color:var(--green-700); margin-bottom:6px; display:block; }
.form-row input, .form-row select, .form-row textarea { width:100%; padding:8px; border-radius:8px; border:1px solid var(--green-100); }
.form-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:8px; }
</style>
