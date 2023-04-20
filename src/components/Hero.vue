<script setup>
import Modal from './Modal.vue';
import TextInput from './bricks/TextInput.vue';
import TextArea from './bricks/TextArea.vue';
import ImageUpload from './bricks/ImageUpload.vue';
import TokenAmount from './bricks/TokenAmount.vue';
import { ref } from 'vue';

const showModal = ref(false);

function openModal() {
  showModal.value = true;
}
</script>

<template>
<Modal :showModal="showModal">
  <template v-slot:title> Create a new Task </template>
  <template v-slot:content>
    <TextInput><template v-slot:text-input>Task title:</template></TextInput>
    <TextArea><template v-slot:text-area>Task description:</template></TextArea>
    <ImageUpload />
    <TokenAmount /> 
    <div class="flex justify-center"><button @click="createTask" class="btn bg-orange-400 mt-2 w-40">Create</button></div>
  </template>
</Modal>


<div id="home" class="hero my-20 ">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-6xl font-bold drop-shadow-lg">Welcome</h1>
      <p class="py-6 text-xl">Create your task and put a reward for users to incentivize them solving your task.</p>
      <label for="my-modal-3" @click="openModal" class="btn btn-primary bg-orange-400 border-orange-400 hover:bg-orange-600 hover:border-black">Create your task</label>
    </div>
  </div>
</div>
</template>

<style>

</style>