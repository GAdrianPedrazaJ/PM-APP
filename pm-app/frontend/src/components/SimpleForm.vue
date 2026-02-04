<template>
  <form @submit.prevent="submit" class="card">
    <div class="form-row" v-for="f in fields" :key="f.name">
      <label>{{ f.label }}</label>
      <input v-if="f.type==='text' || f.type==='number' || f.type==='date'" :type="f.type" v-model="model[f.name]" />
      <select v-else-if="f.type==='select'" v-model="model[f.name]">
        <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
      </select>
      <textarea v-else-if="f.type==='textarea'" v-model="model[f.name]" rows="3"></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" @click="reset">Limpiar</button>
      <button type="submit" class="btn btn-primary">Guardar</button>
    </div>
  </form>
</template>

<script>
import { reactive } from 'vue';
export default {
  props:{ fields:{ type:Array, required:true }, initial:{ type:Object, default:()=>({}) } },
  setup(props, { emit }){
    const model = reactive({});
    props.fields.forEach(f => model[f.name] = props.initial[f.name] ?? f.default ?? '');
    const submit = ()=> emit('submit', {...model});
    const reset = ()=> props.fields.forEach(f => model[f.name] = f.default ?? '');
    return { model, submit, reset };
  }
}
</script>
