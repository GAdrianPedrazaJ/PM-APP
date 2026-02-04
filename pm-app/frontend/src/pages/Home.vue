<template>
  <div class="container">
    <div class="top-row">
      <div>
        <div class="title">Panel PM</div>
        <div class="small">Resumen rápido de proyectos y estado</div>
      </div>
      <div class="search">
        <input class="input" placeholder="Buscar..." v-model="q" @input="filter" />
        <button class="btn btn-primary" @click="filter">Buscar</button>
      </div>
    </div>

    <div class="grid">
      <ProjectCard v-for="p in filtered" :key="p.proyecto_id" :proyecto="p" @view="view" @edit="edit" />
    </div>

    <div class="footer">PM App · Datos locales y sincronización con Supabase</div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../store';
import ProjectCard from '../components/ProjectCard.vue';

export default {
  components:{ ProjectCard },
  setup(){
    const store = useAppStore();
    const q = ref('');
    onMounted(()=> store.loadProjects());
    const filtered = computed(()=> {
      if (!q.value) return store.projects;
      return store.projects.filter(p => (p.nombre||'').toLowerCase().includes(q.value.toLowerCase()));
    });
    const filter = ()=> {};
    const view = (p)=> alert('Ver: ' + p.nombre);
    const edit = (p)=> alert('Editar: ' + p.nombre);
    return { q, filtered, filter, view, edit };
  }
}
</script>
