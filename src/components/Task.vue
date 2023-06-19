<script setup>
import Modal from './widgets/Modal.vue';
import FileUpload from './bricks/FileUpload.vue';
import { HandRaisedIcon } from '@heroicons/vue/24/solid';
import { ref } from 'vue'
import { useConnectionStore } from '../stores/useConnectionStore';
import { useArgStore } from '../stores/useArgStore';
import { usePopupStore } from '../stores/usePopupStore';

const connectionStore = useConnectionStore();
const argStore = useArgStore();
const popupStore = usePopupStore();

const props = defineProps([
  'id',
  'title',
  'description',
  'reward'
]);

const showModal1 = ref(false);
const showModal2 = ref(false);
const modalType = ref('');
const message = ref('');



function openModal() {
  showModal1.value = true;
}

function participateTask() {
  if(connectionStore.isConnected){
     console.log("args", argStore.getArguments)

     const { name, video, walletAddress } = argStore.getArguments;
     connectionStore.callContractFunction('participate', {name,  video, walletAddress}) //TODO URI ???
      .then(response => {
        modalType.value = 'success';
        message.value = 'You sent your participation!';
        showModal2.value = true;
        showModal1.value = false;
      })
      .catch(error => {
        modalType.value = 'danger';
        message.value = 'Error sending participation: ' + error;
        showModal2.value = true;
      } );
  } else {
      popupStore.setPopup(true, 'danger', 'You need to connect your wallet first', 'modal');
  }
}


</script>

<template>
  <div class="card w-96 bg-base-100 shadow-xl border-2 border-black">
    <figure><img src="https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427" alt="Shoes" /></figure>
    <div class="card-body gap-1 p-5">
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

    <FileUpload :upload-type="'video'" />

    <div class="flex flex-col items-end">
    <label @click="participateTask" class="btn btn-primary w-25 bg-orange-400 border-1 border-black hover:bg-orange-600 hover:border-black ">
          Participate
          <HandRaisedIcon class="h-6 w-6 pl-2" />
    </label>
    </div>

  </template>
</Modal>

<Modal @close-modal="showModal2 = false" :showModal="showModal2" :modalType="modalType">
<template v-slot:content> {{ message }}</template>
</Modal>


  </template>

<style scoped>
</style>