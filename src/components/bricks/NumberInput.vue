<script setup>
import { ref } from 'vue';
    const amount = ref('');

</script>


<template>
    <div class="form-control py-2">
      <label for="amount" class="block text-sm font-medium text-gray-700"><slot name="title">Default title</slot></label>
      <div class="mt-1">
        <input type="number" id="amount" name="amount" v-model="amount" pattern="\d*"
          class="shadow-sm focus:ring-orange-400 focus:border-orange-400 block w-full sm:text-sm border-orange-400 rounded-md">
      </div>
    </div>
  </template>
  
  <style scoped>
  textarea:invalid {
    border-color: red; /* change the border color when the input is not valid */
  }
  </style>
