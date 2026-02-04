<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="brand">
        <div class="logo">PM</div>
        <div>
          <div class="brand-title">PM App</div>
          <div class="small">Gestión · Contratos y Órdenes</div>
        </div>
      </div>

      <!-- Desktop nav -->
      <nav class="nav desktop-only" aria-label="Main navigation">
        <router-link
          v-for="tab in tabs"
          :key="tab"
          :to="routeFor(tab)"
          class="nav-link"
          active-class="active"
        >
          {{ tab }}
        </router-link>

        <!-- Power BI tab fixed at the end -->
        <router-link to="/powerbi" class="nav-link powerbi" active-class="active">Power BI</router-link>
      </nav>

      <!-- Mobile controls -->
      <div class="header-actions">
        <div class="small" :class="syncClass">
          <span :style="{display:'inline-block',width:10,height:10,borderRadius:10,background:dotColor,marginRight:8}"></span>
          {{ syncText }}
        </div>

        <button class="btn btn-ghost desktop-only" @click="$router.push('/proyectos')">Proyectos</button>
        <button class="btn btn-primary desktop-only" @click="openNew">Nuevo</button>

        <button class="mobile-toggle mobile-only" @click="mobileOpen = !mobileOpen" :aria-expanded="mobileOpen">
          <svg v-if="!mobileOpen" xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="mobileOpen" class="mobile-menu mobile-only">
      <router-link
        v-for="tab in tabs"
        :key="tab"
        :to="routeFor(tab)"
        class="mobile-link"
        @click="mobileOpen=false"
      >
        {{ tab }}
      </router-link>

      <router-link to="/powerbi" class="mobile-link powerbi" @click="mobileOpen=false">Power BI</router-link>

      <div class="mobile-actions">
        <button class="btn btn-primary" @click="$router.push('/proyectos'); mobileOpen=false">Proyectos</button>
        <button class="btn btn-ghost" @click="openNew; mobileOpen=false">Nuevo</button>
      </div>
    </div>
  </header>
</template>

<script>
import { onMounted, ref, computed } from 'vue';
import { useAppStore } from '../store';

export default {
  setup() {
    const store = useAppStore();
    onMounted(() => {
      store.loadTabs();
      console.log('NavBar tabs:', store.tabs);
    });

    const tabs = store.tabs;
    const mobileOpen = ref(false);

    const openNew = () => { window.location = '/sheet/Nuevo'; };

    // Mapeo de rutas: casos explícitos para cada pestaña
    const routeFor = (tab) => {
      const slug = String(tab).toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
      if (slug === 'bd-pm') return '/bd-pm';
      if (slug === 'informe-pm-totales') return '/informe-pm-totales';
      if (slug === 'listado-proyectos-pm') return '/listado-proyectos-pm';
      if (slug === 'crisalida-pm') return '/crisalida-pm';
      if (slug === 'otros') return '/otros';   // ← añadido para que funcione la pestaña OTROS
      if (slug === 'casino') return '/casino';
      if (slug === 'creos') return '/creos';
      // Mapear pestañas LC (ej: "LC Pesos-Linea Mapa Total") a la ruta /lc
      if (slug.startsWith('lc')) return '/lc';
  
      return `/sheet/${encodeURIComponent(tab)}`;
    };

    const syncText = computed(() => store.syncState === 'syncing' ? 'Sincronizando...' : (store.syncState === 'error' ? 'Error' : 'Sincronizado'));
    const dotColor = computed(() => store.syncState === 'syncing' ? '#f0a500' : (store.syncState === 'error' ? '#d9534f' : '#0b6b2f'));
    const syncClass = computed(() => store.syncState);

    return { tabs, routeFor, mobileOpen, openNew, syncText, dotColor, syncClass };
  }
};
</script>

<style scoped>
.desktop-only { display:flex; }
.mobile-only { display:none; }

.mobile-menu { background:var(--white); border-top:1px solid var(--green-100); padding:10px 18px; display:flex; flex-direction:column; gap:8px; }
.mobile-link { padding:10px 12px; border-radius:8px; color:var(--green-700); text-decoration:none; display:block; }
.mobile-actions { display:flex; gap:8px; margin-top:8px; }

@media (max-width: 900px) {
  .desktop-only { display:none; }
  .mobile-only { display:flex; align-items:center; gap:8px; }
}
.icon { width:20px; height:20px; color:var(--green-700); }
.powerbi { font-weight:700; color:var(--green-700); }
</style>
