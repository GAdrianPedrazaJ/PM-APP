<template>
  <div class="container">
    <div class="top-row">
      <div>
        <div class="title">Power BI</div>
        <div class="small">Visualizaciones e informes</div>
      </div>
      <div>
        <button class="btn btn-ghost" @click="openInNew">Abrir en nueva pestaña</button>
      </div>
    </div>

    <div class="card">
      <div class="small" style="margin-bottom:8px">Embed URL (pega aquí la URL pública o el enlace de embed):</div>
      <input class="input" v-model="embedUrl" placeholder="https://app.powerbi.com/..." />

      <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
        <button class="btn btn-primary" @click="loadEmbed">Cargar</button>
        <button class="btn btn-ghost" @click="clearEmbed">Limpiar</button>
        <div class="small" style="margin-left:12px;color:var(--muted)">{{ hint }}</div>
      </div>
    </div>

    <div v-if="embedUrlLoaded" class="card" style="margin-top:16px; padding:0; overflow:hidden;">
      <!-- iframe placeholder: ajusta sandbox/allow según tu método de embed -->
      <iframe :src="embedUrl" style="width:100%;height:720px;border:0;" frameborder="0" allowfullscreen></iframe>
    </div>

    <div v-else class="card" style="margin-top:16px">
      <p class="small">No hay informe cargado. Puedes pegar un enlace de Power BI publicado (Publish to web) o usar Power BI Embedded con token en el backend para un embed seguro.</p>
      <ul class="small">
        <li>Si usas <strong>Publish to web</strong>, pega la URL pública y el iframe funcionará directamente.</li>
        <li>Si necesitas <strong>embed seguro</strong> (token), implementa un endpoint en el backend que devuelva el URL y token y usa la librería de Power BI JS para incrustar.</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
export default {
  setup() {
    const embedUrl = ref('');
    const embedUrlLoaded = ref(false);
    const hint = 'Si usas Publish to web, pega la URL pública. Para embed seguro, usa backend.';
    const loadEmbed = () => {
      if (!embedUrl.value) return alert('Pega la URL de embed o pública');
      embedUrlLoaded.value = true;
    };
    const clearEmbed = () => { embedUrl.value = ''; embedUrlLoaded.value = false; };
    const openInNew = () => { if (embedUrl.value) window.open(embedUrl.value, '_blank'); else alert('No hay URL cargada'); };
    return { embedUrl, embedUrlLoaded, loadEmbed, clearEmbed, hint, openInNew };
  }
}
</script>

<style scoped>
.container{max-width:1100px;margin:20px auto;padding:0 18px}
.card{background:var(--white);border-radius:10px;box-shadow:var(--card-shadow);padding:14px;border:1px solid #f0f7f0}
.input{padding:10px;border-radius:8px;border:1px solid var(--green-100);width:100%}
</style>
