import { defineStore } from 'pinia';
import axios from 'axios';

export const useAppStore = defineStore('app', {
  state: () => ({
    tabs: ['BD PM','INFORME PM TOTALES','LISTADO PROYECTOS PM','CRISALIDA PM','OTROS','CASINO','CREOS','LC Pesos-Linea Mapa Total'],
    projects: [],
    proveedores: [],
    syncState: 'ok' // 'ok' | 'syncing' | 'error'
  }),
  actions: {
    // carga la lista de pestañas desde el backend si existe el endpoint,
    // si no, mantiene la lista por defecto
    async loadTabs() {
      try {
        const resp = await axios.get('/api/tabs').catch(()=>null);
        if (resp?.data && Array.isArray(resp.data) && resp.data.length) {
          this.tabs = resp.data;
        }
      } catch (e) {
        console.warn('No se pudo cargar /api/tabs, usando tabs por defecto');
      }
    },

    async loadProjects() {
      try {
        const resp = await axios.get('/api/proyectos').catch(()=>null);
        this.projects = resp?.data || [];
      } catch (e) {
        console.error('Error cargando proyectos', e);
      }
    },

    async loadProveedores() {
      try {
        const resp = await axios.get('/api/proveedores').catch(()=>null);
        this.proveedores = resp?.data || [];
      } catch (e) {
        console.error('Error cargando proveedores', e);
      }
    },

    setSync(state) {
      if (['ok','syncing','error'].includes(state)) this.syncState = state;
      else this.syncState = 'ok';
    }
  }
});
