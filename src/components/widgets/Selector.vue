<script setup>
import { ref, defineProps } from 'vue';

const props = defineProps(['optionsArray', 'defaultText']);
const selected = ref(props.defaultText);

</script>

<template>

<select v-model="selected" class="select select-accent w-full max-w-xs">
  <option disabled selected>{{ props.defaultText }}</option>
  <option v-for="option in props.optionsArray"> {{ option }} </option>
</select>

</template>

<style>
</style>