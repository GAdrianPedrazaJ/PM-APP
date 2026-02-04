<template>
  <div class="container">
    <component :is="componentForSheet" />
  </div>
</template>

<script>
import { useRoute } from 'vue-router';
import BDPMForm from '../components/BDPMForm.vue';
import SimpleForm from '../components/SimpleForm.vue';

export default {
  components: { BDPMForm, SimpleForm },
  setup() {
    const route = useRoute();
    const name = decodeURIComponent(route.params.name || '');
    const normalized = name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9\-]/g,'');
    const componentForSheet = normalized === 'bdpm' || normalized === 'bd-pm' ? BDPMForm : SimpleForm;
    return { componentForSheet };
  }
};
</script>
