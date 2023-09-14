<script setup>
import { ref, defineProps, watchEffect, defineEmits } from 'vue';
import { useArgStore } from '../../stores/useArgStore';

const argStore = useArgStore();

const props = defineProps(['optionsArray', 'defaultText']);
const emit = defineEmits(['selectionChanged'])

const selected = ref(props.defaultText);

watchEffect(() => {
    argStore.pushArg({ key: 'selector', value: selected.value });
    emit('selectionChanged'); // We are not passing anything because we can already access the selection from the argStore

});
</script>

<template>

<select v-model="selected" class="select select-accent max-w-sm truncate-middle">
  <option disabled selected>{{ props.defaultText }}</option>
  <option v-for="option in props.optionsArray"> {{ option }} </option>
</select>

</template>

<style>

</style>