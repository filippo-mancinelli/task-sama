<script setup>
import Modal from './widgets/Modal.vue';
import TextInput from './bricks/TextInput.vue';
import TextArea from './bricks/TextArea.vue';
import ImageUpload from './bricks/ImageUpload.vue';
import TokenAmount from './bricks/TokenAmount.vue';
import { ref, watchEffect } from 'vue';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useArgStore } from '../stores/useArgStore';

const connectionStore = useConnectionStore();
const argStore = useArgStore();

const showModal = ref(false);
const showModalResult = ref(false);
const modalType = ref('');
const message = ref('');

const showAreaError = ref(false);
const showInputError = ref(false);
const showTokenError = ref(false);


function openModal() {
  showModal.value = true;
}

function createTask(_title, _description, _imageURI, _reward) {
  console.log(argStore.getArguments)
  if(argStore.getArguments.textArea == '' || argStore.getArguments.textInput == '' || argStore.getArguments.numberInput == '') {
    if(argStore.getArguments.textArea == '') 
    showAreaError.value = true;
    
    if(argStore.getArguments.textInput == '') 
      showInputError.value = true;
    
    if(argStore.getArguments.numberInput == '') 
      showTokenError.value = true;
  } else if(connectionStore.isConnected){
     connectionStore.callContractFunction(_title, _description, _imageURI, _reward)
      .then(response => {
        modalType.value = 'success';
        message.value = 'Task created successfully!';
        showModalResult.value = true;
        showModal.value = false;
      })
      .catch(error => {
        modalType.value = 'danger';
        message.value = 'Error creating task: ' + error;
        showModalResult.value = true;
        console.log("errore Nella creazione del task: ", error)
      } );
  }
}

watchEffect(() => {
  argStore.getArguments.textArea !== '' ? showAreaError.value = false : 'doNothing';
  argStore.getArguments.textInput !== '' ? showInputError.value = false : 'doNothing';
  argStore.getArguments.numberInput !== '' ? showTokenError.value = false : 'doNothing';
});

</script>

<template>
<Modal @close-modal="showModal = false" :showModal="showModal" :modalType="''">
  <template v-slot:title> Create a new Task </template>
  <template v-slot:content>
    <TextInput :showError="showInputError" :errorMessage="'Title cannot be empty.'"><template v-slot:text-input>Task title:</template></TextInput>
    <TextArea :showError="showAreaError" :errorMessage="'Description cannot be empty.'"><template v-slot:text-area>Task description:</template></TextArea>
    <ImageUpload />
    <div class="flex flex-nowrap just">
      <div class="w-1/4">
        <TokenAmount :showError="showTokenError" :errorMessage="'Reward cannot be empty.'"><template v-slot:title>Reward amount:</template></TokenAmount> 
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

<Modal @close-modal="showModalResult = false" :showModal="showModalResult" :modalType="modalType">
<template v-slot:title></template>
<template v-slot:content>{{ message }}</template>
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