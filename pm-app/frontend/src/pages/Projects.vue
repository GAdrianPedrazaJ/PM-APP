<template>
  <div class="container">
    <div class="top-row">
      <div><div class="title">Proyectos</div><div class="small">Crear y editar proyectos</div></div>
      <div><button class="btn btn-primary" @click="openNew">Nuevo proyecto</button></div>
    </div>

    <SimpleForm :fields="fields" @submit="save" />

    <div style="height:18px"></div>

    <div class="grid">
      <ProjectCard v-for="p in store.projects" :key="p.proyecto_id" :proyecto="p" @edit="edit" />
    </div>
  </div>
</template>

<script>
import SimpleForm from '../components/SimpleForm.vue';
import ProjectCard from '../components/ProjectCard.vue';
import { useAppStore } from '../store';
import { ref } from 'vue';
import axios from 'axios';

export default {
  components:{ SimpleForm, ProjectCard },
  setup(){
    const store = useAppStore();
    const fields = [
      { name:'codigo', label:'Código', type:'text' },
      { name:'nombre', label:'Nombre', type:'text' },
      { name:'categoria', label:'Categoría', type:'text' },
      { name:'presupuesto', label:'Presupuesto', type:'number', default:0 }
    ];
    const save = async (payload) => {
      await axios.post('/api/proyectos', payload).catch(()=>null);
      await store.loadProjects();
      alert('Proyecto guardado');
    };
    const openNew = ()=> window.scrollTo({top:0,behavior:'smooth'});
    const edit = (p)=> alert('Editar ' + p.nombre);
    return { fields, save, store, openNew, edit };
  }
}
</script>
