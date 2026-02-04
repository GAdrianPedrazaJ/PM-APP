<template>
  <div class="card">
    <div style="display:flex;gap:12px;align-items:center">
      <div style="width:48px;height:48px;border-radius:8px;background:var(--green-100);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--green-700)">
        {{ initials }}
      </div>
      <div style="flex:1">
        <h3>{{ proyecto.nombre }}</h3>
        <p>{{ proyecto.codigo }} · {{ proyecto.categoria || 'Sin categoría' }}</p>
      </div>
      <div style="text-align:right">
        <div class="small">Presupuesto</div>
        <div style="font-weight:700;color:var(--green-700)">${{ format(proyecto.presupuesto) }}</div>
      </div>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-ghost" @click="$emit('view', proyecto)">Ver</button>
      <button class="btn-edit btn-primary" @click="$emit('edit', proyecto)">Editar</button>
    </div>
  </div>
</template>

<script>
export default {
  props:{ proyecto:{ type:Object, required:true } },
  computed:{
    initials(){ return (this.proyecto.nombre||'P').split(' ').map(s=>s[0]).slice(0,2).join(''); }
  },
  methods:{ format(v){ return Number(v||0).toLocaleString('es-CO'); } }
}
</script>
