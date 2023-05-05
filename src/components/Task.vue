<script setup>
import Modal from './widgets/Modal.vue';
import { HandRaisedIcon } from '@heroicons/vue/24/solid';
import { ref } from 'vue'
import { useConnectionStore } from '../stores/useConnectionStore';
import { useArgStore } from '../stores/useArgStore';

const connectionStore = useConnectionStore();
const argStore = useArgStore();

const props = defineProps([
  'id',
  'title',
  'description',
  'reward'
]);

const showModal1 = ref(false);
const showModal2 = ref(false);

const modalType = ref('');


function openModal() {
  showModal1.value = true;
}

function participateTask() {
  ////////////////////////////
  modalType.value = 'danger';
  showModal2.value = true;
  ///////////////////////////

  if(connectionStore.isConnected){
     console.log("args", argStore.getArguments)

     const {name, video, message } = argStore.getArguments;
     connectionStore.callContractFunction('participate', {_title,  _description, message}) //TODO URI ???
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


</script>

<template>
  <div class="card w-96 bg-base-100 shadow-xl border-2 border-black">
    <figure><img src="https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427" alt="Shoes" /></figure>
    <div class="card-body">
      <h2 class="card-title">
        {{ title }}   #{{ id  }}
        <div class="badge badge-secondary">NEW</div>
      </h2>
      <p>{{ description }}</p>
      <div class="card-actions ">
        <div class="badge badge-outline py-6 pr-4 text-lg">Reward:    <span class="pl-2 text-lg">{{ reward }} GLMR</span></div> 
        <div class="">
          <label @click="openModal" class="btn btn-primary w-30 bg-orange-400 border-1 border-black hover:bg-orange-600 hover:border-black ">
          Participate
          <HandRaisedIcon class="h-6 w-6 pl-2 " />
        </label>
        </div>
      </div>
    </div>
  </div>

<Modal @close-modal="showModal1 = false" :showModal="showModal1" :modalType="''">
  <template v-slot:title>Participate to this task:</template>
  <template v-slot:content>
    <span class="text-lg">├─ <span class="italic"> {{ title }}  </span> </span>
    <span class="text-lg">├─ <span class="italic"> {{ description }}  </span> </span>
    <span class="text-lg">├─ <span class="italic"> {{ reward }} GLMR </span> </span>
    <div class="my-2" />

    <div class="flex justify-end">
    <label @click="participateTask" class="btn btn-primary w-25 bg-orange-400 border-1 border-black hover:bg-orange-600 hover:border-black ">
          Participate
          <HandRaisedIcon class="h-6 w-6 pl-2" />
    </label>
    </div>

  </template>
</Modal>

<Modal @close-modal="showModal2 = false" :showModal="showModal2" :modalType="modalType"></Modal>


  </template>

<style scoped>
</style>