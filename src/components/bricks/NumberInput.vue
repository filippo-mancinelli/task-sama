<script setup>
import { useArgStore } from '../../stores/useArgStore'
import { watchEffect, ref } from 'vue';

const argStore = useArgStore();
const amount = ref('');

watchEffect(() => {
    argStore.pushArg({ key: 'numberInput', value: amount.value });
});
</script>


<template>
    <div class="form-control py-2">
      <label for="amount" class="label-text text-base"><slot name="title">Default title</slot></label>
      <div class="mt-1">
        <input type="number" id="amount" name="amount" v-model="amount" pattern="\d*" min="0"
        class="shadow-sm p-2 block w-full sm:text-sm focus:ring-orange-400 focus:border-orange-400 border border-orange-400 outline-orange-400 outline-offset-4 rounded-md ">
      </div>
    </div>
  </template>
  
  <style scoped>
  textarea:invalid {
    border-color: red; /* change the border color when the input is not valid */
  }

  </style>
