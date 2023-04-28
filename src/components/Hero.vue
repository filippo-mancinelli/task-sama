<script setup>
import Modal from './widgets/Modal.vue';
import TextInput from './bricks/TextInput.vue';
import TextArea from './bricks/TextArea.vue';
import ImageUpload from './bricks/ImageUpload.vue';
import TokenAmount from './bricks/TokenAmount.vue';
import { ref } from 'vue';
import { useConnectionStore } from '../stores/useConnectionStore';

const showModal = ref(false);
const showModalResult = ref(false);
const messageType = ref('');
const message = ref('');

function openModal() {
  showModal.value = true;
  console.log(showModal.value)
}

function createTask(_title, _description, _imageURI, _reward) {
  messageType.value = 'danger';
  message.value = 'carl';
  showModalResult.value = true;

  if(useConnectionStore.isConnected){
    useConnectionStore.callContractFunction(_title, _description, _imageURI, _reward)
    .then(response => {
      messageType.value = 'success';
      message.value = 'Task created successfully!';
      showModalResult.value = true;
      showModal.value = false;
    })
    .catch(error => {
      messageType.value = 'danger';
      message.value = 'Error creating task: ' + error;
      showModalResult.value = true;
      console.log("errore Nella creazione del task: ", error)} );
  } 
}
</script>

<template>
<Modal @show-modal="(res) => showModal.value = res" :showModal="showModal" :modalType="success">
  <template v-slot:title> Create a new Task </template>
  <template v-slot:content>
    <TextInput><template v-slot:text-input>Task title:</template></TextInput>
    <TextArea><template v-slot:text-area>Task description:</template></TextArea>
    <ImageUpload />
    <div class="flex flex-nowrap just">
      <div class="w-1/4">
        <TokenAmount><template v-slot:title>Reward amount:</template></TokenAmount> 
      </div>
    </div>

    <div class="flex justify-center">
      <button @click="createTask" class="btn bg-orange-400 mt-2 w-40">
        <!-- <svg class="animate-spin h-5 w-5 mr-3 fill-current text-white " viewBox="0 0 24 24"> </svg> -->
        Create
      </button>

    </div>
  </template>
</Modal>

<Modal @show-modal="(res) => showModalResult.value = res" :showModal="showModalResult" :modalType="success">

</Modal>

<div id="home" class="hero my-20 ">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-6xl font-bold drop-shadow-lg">Welcome</h1>
      <p class="py-6 text-xl">Create your task and put a reward for users to incentivize them solving your task.</p>
      <label @click="openModal" class="btn btn-primary bg-orange-400 border-orange-400 hover:bg-orange-600 hover:border-black">Create your task</label>
    </div>
  </div>
</div>
</template>

<style>

</style>