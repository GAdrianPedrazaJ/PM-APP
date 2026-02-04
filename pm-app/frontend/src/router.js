import { createRouter, createWebHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Projects from './pages/Projects.vue';
import SheetForm from './pages/SheetForm.vue';
import PowerBI from './pages/PowerBI.vue';
import BDPM from './pages/BDPM.vue';

const routes = [
  { path: '/', component: Home, meta:{ title: 'Inicio' } },
  { path: '/proyectos', component: Projects, meta:{ title: 'Proyectos' } },

  // Rutas estáticas específicas (deben ir antes de la dinámica)
  { path: '/bd-pm', component: BDPM, meta:{ title: 'BD PM' } },
  { path: '/powerbi', component: PowerBI, meta:{ title: 'Power BI' } },

  { path: '/informe-pm-totales', component: () => import('./pages/InformePMTotales.vue'), meta:{ title:'INFORME PM TOTALES' } },
  { path: '/listado-proyectos-pm', component: () => import('./pages/ListadoProyectosPM.vue'), meta:{ title: 'LISTADO PROYECTOS PM' } },
  { path: '/crisalida-pm', component: () => import('./pages/CrisalidaPM.vue'), meta:{ title: 'CRISALIDA PM' } },

  { path: '/otros', component: () => import('./pages/Otros.vue'), meta: { title: 'OTROS' } },
  { path: '/casino', component: () => import('./pages/Casino.vue'), meta: { title: 'CASINO' } },
  { path: '/creos', component: () => import('./pages/Creos.vue'), meta: { title: 'CREOS' } },
  { path: '/lc', component: () => import('./pages/LC.vue'), meta: { title: 'LC' } },

  // Ruta para hojas dinámicas
  { path: '/sheet/:name', component: SheetForm, meta:{ title: 'Formulario' } },

  // fallback: redirigir a inicio
  { path: '/:catchAll(.*)', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
