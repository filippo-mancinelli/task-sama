<script setup>
import Modal from './widgets/Modal.vue';
import FileUpload from './bricks/FileUpload.vue';
import { HandRaisedIcon, ClockIcon } from '@heroicons/vue/24/solid';
import { ref, computed } from 'vue'
import { useConnectionStore } from '../stores/useConnectionStore';
import { useArgStore } from '../stores/useArgStore';
import { usePopupStore } from '../stores/usePopupStore';
import { useTaskStore } from '../stores/useTaskStore';

const connectionStore = useConnectionStore();
const argStore = useArgStore();
const popupStore = usePopupStore();

const emit = defineEmits(['sentParticipation']);
const props = defineProps([
  'tokenId',
  'title',
  'description',
  'reward',
  'participants',
  'isParticipating',
  'base64Image'
]);
const isLoading = ref(false);
const showModal1 = ref(false);
const showModal2 = ref(false);
const modalType = ref('');
const message = ref('');
const searchQuery = ref('');

const filteredParticipants = computed(() => {
  if(!searchQuery.value) return props.participants;
  const query = searchQuery.value.toLowerCase();
  return props.participants.filter(participant => participant.toLowerCase().includes(query));
})

function openModal() {
  showModal1.value = true;
}

// ### IMAGE ### //
const getImageUrl = computed(() => {
  if(props.base64Image != undefined) {
    if (props.base64Image != 'noimage') {
      return `data:image/jpeg;base64,${props.base64Image}`;
    } else {
      return 'https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427';
    }
  }
});


function participateTask() {
  if(isLoading.value === true) {
    popupStore.setPopup(true, 'alert', 'Wait for the current participation request to finish', 'modal');
    return;
  }
  if(argStore.getArguments.file.size == 0) { 
    popupStore.setPopup(true, 'danger', 'You must upload a valid video to participate', 'modal');
    return;
  } 
  else if(!connectionStore.isConnected){
     popupStore.setPopup(true, 'warning', 'You need to connect your wallet first', 'modal');
     return;
  }
  isLoading.value = true;
  //before updating the task NFT with the participation we upload the user video + tokenId to our server for moderation purposes
  useTaskStore().uploadVideoToDB(argStore.arguments.fileData.file, props.tokenId).then(() => {
    connectionStore.callContractFunction('Tasks', 'participate', 'stateChanging', [props.tokenId])
      .then(response => {
        const { transactionReceipt } = response;
        isLoading.value = false;
        modalType.value = 'success';
        message.value = 'You sent your participation!';
        showModal2.value = true;
        showModal1.value = false;

        emit('sentParticipation'); 
      })
      .catch(error => {
        console.log("error",error)
        isLoading.value = false;
        modalType.value = 'danger';
        message.value = 'Error sending participation: ' + error.data.message;
        showModal2.value = true;
      } );
  });
}
</script>

<template>
  <div class="card w-96 bg-base-100 shadow-xl border-2 border-black">
    <figure>
      <img :src="getImageUrl" alt="image" />
    </figure>
    <div class="card-body gap-1 p-5">
      <h2 class="card-title">
        {{ title }}   #{{ tokenId  }}
        <div class="badge badge-secondary">NEW</div>
      </h2>
      <p class="italic truncate">{{ description }}</p>

      <div class="flex">
        <p class="italic truncate">Participating: <span class="pl-1 text-xs">{{ participants[0] }}</span></p>

        <!--DROPDOWN SEARCHBAR-->
        <div class="dropdown">
          <label tabindex="0" class="hover:cursor-pointer" ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></label> 
          <div tabindex="0" class="dropdown-content z-[1] card card-compact right-1 shadow border-2 border-black bg-white text-black rounded p-1">
            <div class="card-body p-1 max-h-80 min-w-max overflow-y-auto">
              <!--SEARCHBAR AND ADDRESS LIST-->
              <p class="text-s">{{ participants.length }} {{ participants.length === 1 ? 'participant' : 'participants' }}</p>
              <div class="flex gap-1 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class=" w-5 h-5"> <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <input type="text" v-model="searchQuery" class="border rounded p-0.5 w-full outline-none border-orange-300 focus:ring-1 focus:ring-orange-400 focus:border-transparent" placeholder="Search address...">
              </div>
              <div v-if="filteredParticipants.length > 0" v-for="participant in filteredParticipants">
                <p class="border-b-2 border-orange-300 text-xs">{{ participant }}</p>
              </div>
              <div v-else>
                <p class="text-s mr-40">No address found...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-actions justify-between">
        <div class="italic truncate">Reward:<span class="pl-2 text-lg">{{ reward }} GLMR</span></div> 
        <label v-if="!isParticipating" @click="openModal" class="btn btn-primary pr-1 pl-4 w-30 text-white bg-orange-400 border-1 border-black hover:bg-orange-600 hover:border-black ">
          Participate
          <HandRaisedIcon class="h-6 w-6 pl-2 -translate-x-2" />
        </label>
        <label v-else class="btn btn-primary w-30 text-white bg-orange-700 border-1 border-black hover:cursor-default ">
          Participating
          <ClockIcon class="h-6 w-6 pl-2" />
        </label>
      </div>
    </div>
  </div>

  <Modal @close-modal="showModal1 = false" :showModal="showModal1" :modalType="''">
    <template v-slot:title>Participate to this task:</template>
    <template v-slot:content>
      <div class="flex flex-col mb-2">
        <span class="text-lg">&#x1F4F0; <span class="italic"> {{ title }}  </span> </span>
        <span class="text-lg">&#x270F; <span class="italic"> {{ description }}  </span> </span>
        <span class="text-lg">&#x1F4B8;<span class="italic"> {{ reward }} GLMR </span> </span>
      </div>
      <FileUpload :upload-type="'video'" />
      <div class="flex flex-col items-end">
      <label @click="participateTask" class="btn btn-primary pr-1 pl-4 w-25 text-white bg-orange-400 border-1 border-black hover:bg-orange-600 hover:border-black ">
            Participate
            <HandRaisedIcon v-if="!isLoading" class="h-6 w-6 pl-2 -translate-x-2" />
            <span v-else class="loading loading-ring loading-md -translate-x-1"></span>
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