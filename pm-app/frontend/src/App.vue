<template>
  <div id="app">
    <NavBar />

    <main class="container">
      <div class="top-row">
        <div class="page-title">
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="sync-indicator" :class="syncClass" title="Estado de sincronización">
          <span class="dot"></span>
          <small>{{ syncText }}</small>
        </div>
      </div>

      <router-view />
    </main>

    <footer class="app-footer">
      <div class="container">
        <small>PM App · Datos locales y sincronización con Supabase</small>
      </div>
    </footer>
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue';
import { useAppStore } from './store';
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'App',
  components: { NavBar },
  setup() {
    const store = useAppStore();
    const route = useRoute();

    // cargar pestañas y datos básicos al iniciar la app
    onMounted(() => {
      store.loadTabs();
      store.loadProjects();
      store.loadProveedores();
    });

    // título dinámico según la ruta
    const pageTitle = computed(() => {
      const metaTitle = route.meta?.title;
      if (metaTitle) return metaTitle;
      // si es ruta genérica /sheet/:name, mostrar el param
      if (route.params?.name) {
        return decodeURIComponent(route.params.name);
      }
      return 'PM App';
    });

    // indicador de sincronización (usa el estado del store)
    const syncState = computed(() => store.syncState || 'ok'); // 'ok'|'syncing'|'error'
    const syncText = computed(() => {
      if (syncState.value === 'syncing') return 'Sincronizando...';
      if (syncState.value === 'error') return 'Error de sincronización';
      return 'Sincronizado';
    });
    const syncClass = computed(() => {
      if (syncState.value === 'syncing') return 'syncing';
      if (syncState.value === 'error') return 'error';
      return 'ok';
    });

    return { pageTitle, syncText, syncClass };
  }
};
</script>

<style scoped>
/* layout */
#app { min-height:100vh; display:flex; flex-direction:column; background:#f8fff8; color:var(--green-600); }
.container { max-width:1200px; margin:20px auto; padding:0 16px; flex:1; }
.top-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:12px }
.page-title h1 { margin:0; font-size:1.25rem; color:var(--green-600) }

/* sync indicator */
.sync-indicator { display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; background:transparent; color:var(--muted); font-size:0.85rem; }
.sync-indicator .dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
.sync-indicator.ok .dot { background: #0b6b2f; box-shadow:0 0 6px rgba(11,107,47,0.18); }
.sync-indicator.syncing .dot { background: #f0a500; box-shadow:0 0 6px rgba(240,165,0,0.18); animation: pulse 1.6s infinite; }
.sync-indicator.error .dot { background: #d9534f; box-shadow:0 0 6px rgba(217,83,79,0.18); }

@keyframes pulse {
  0% { transform: scale(1); opacity:1; }
  50% { transform: scale(1.25); opacity:0.7; }
  100% { transform: scale(1); opacity:1; }
}

/* footer */
.app-footer { background: #ffffff; border-top:1px solid #e6f4ea; padding:12px 0; color:var(--muted); font-size:0.9rem; }
</style>
