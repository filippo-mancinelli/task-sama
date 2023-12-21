<script setup>
import Modal from './widgets/Modal.vue';
import FileUpload from './bricks/FileUpload.vue';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'
import { useTaskStore } from '../stores/useTaskStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useCommentsStore } from '../stores/useCommentsStore';
import { HandRaisedIcon, ClockIcon } from '@heroicons/vue/24/solid';
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useArgStore } from '../stores/useArgStore';
import { usePopupStore } from '../stores/usePopupStore';
import { tasksAddress } from '../helpers/contractAddresses';
import CommentSection from './CommentSection.vue';

var contractAddressesLink = "https://www.moonscan.io/address/" + tasksAddress;
const backgroundStore = useBackgroundStore();
const connectionStore = useConnectionStore();
const commentsStore = useCommentsStore();
const argStore = useArgStore();
const popupStore = usePopupStore();

backgroundStore.changeBackgroundClass('bg-background-image h-screen');

let route;
var tokenId;
const isParticipating = ref(false);
const taskObject = ref({})
const imageSrc = ref('');
const isReady = ref(false);
const comments = ref([]);
const isLoading = ref(false);
const showModal1 = ref(false);
const showModal2 = ref(false);
const modalType = ref('');
const message = ref('');

watch(() => useConnectionStore().isAllSetUp, async (newValue, oldValue) => {
    if(newValue) {
        taskObject.value = await useTaskStore().fetchTaskMetadata(tokenId);
        isParticipating.value = taskObject.value.result.participants.includes(connectionStore.walletAddress);   
        isReady.value = true;
    }
});

function openModal() {
  showModal1.value = true;
}

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
  console.log("argStore.arguments",argStore.arguments)
  useTaskStore().uploadVideoToDB(argStore.arguments.fileData.value, tokenId).then(() => {
    connectionStore.callContractFunction('Tasks', 'participate', 'stateChanging', [tokenId])
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


async function fetchComments() {
  const commentsResponse = await commentsStore.getComments(tokenId, 'task');
  comments.value = commentsResponse.data.message == 'Comments fetched correctly.' ? commentsResponse.data.data : [];
}

onMounted(async () => {
    route = useRoute();
    tokenId = route.params.tokenId;
    taskObject.value = await useTaskStore().fetchTaskMetadata(tokenId);
    isReady.value = true;
    await fetchComments();

    // Check if current user is participanting
    if(connectionStore.isConnected) {
        const address = connectionStore.walletAddress;
        const participants = taskObject.value.result.participants;
        if(participants.includes(address)) {
            isParticipating.value = true;
        }
    }

    const fetchResponse = await useTaskStore().fetchTaskImage(tokenId);
    if(fetchResponse.data.message == 'No images found.') {
        imageSrc.value = 'https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427';
    } else {
        imageSrc.value = 'data:image/jpeg;base64,' + fetchResponse.data.data[0].data;
    }
})

</script>

<template>
    <div v-if="isReady" class="mx-6">
        <div class="card card-side flex flex-col sm:flex-row bg-base-100 shadow-xl">
            <figure ><img class="rounded-md border-black border-2 max-h-60 max-w-120" :src="imageSrc" alt="Movie"/></figure>
            <div v-if="taskObject.result != undefined" class="card-body max-w-xl gap-2">
                <h2 class="card-title">#{{ taskObject.tokenId  }} -{{ taskObject.result.title }}</h2>
                <p class="italic text-xs -mt-2">{{ taskObject.timestamp }}</p>
                <p class="truncate ...">{{ taskObject.result.description }}</p>
                <p class="italic truncate">Creator:<span class="pl-2 text-sm">{{ taskObject.result.owner }} </span></p>
                <p class="italic truncate">Contract address:<a :href="contractAddressesLink" target="_blank" class="pl-2 text-sm text-blue-500 hover:text-blue-700 hover:cursor-pointer">{{ tasksAddress }}</a></p>
                <p class="italic truncate">Token ID:<span class="pl-2 text-lg">{{ taskObject.result.tokenId }} </span></p>
                <p class="italic truncate">Reward:<span class="pl-2 text-lg">{{ taskObject.reward }} GLMR</span></p>


                <div class="card-actions justify-end">
                    <label v-if="!isParticipating" @click="openModal" class="btn btn-primary pr-1 pl-4 w-30 text-white bg-orange-400 border-1 border-black hover:bg-orange-600 hover:border-black ">
                        Participate
                        <HandRaisedIcon class="h-6 w-6 pl-2 -translate-x-2" />
                    </label>
                    <label v-else class="btn btn-primary flex gap-0 w-30 text-white bg-orange-700 border-1 border-black hover:cursor-default ">
                        Participating
                        <ClockIcon class="h-6 w-6 pl-2" />
                    </label>
                </div>
            </div>
        </div>

        <div class="card card-side flex flex-col bg-base-100 shadow-xl my-4 p-4">
            <h2 class="card-title mb-2">Participants:</h2>
            <div v-for="participant in taskObject.result.participants" >
                    <p class="text-sm rounded bg-slate-100 my-1 border-l-4 border-orange-500 pl-1">{{ participant }}</p>
            </div>
        </div>
    </div>

    <!--COMMENT SECTION-->
    <div class="mx-6 my-6">
        <CommentSection 
            :tokenId="tokenId"
            :commentsArray="comments"
            :category="'task'"
            @refreshComments="fetchComments"
        />
    </div>



    <Modal @close-modal="showModal1 = false" :showModal="showModal1" :modalType="''">
        <template v-slot:title>Participate to this task:</template>
        <template v-slot:content>
        <div class="flex flex-col mb-2">
            <span class="text-lg">&#x1F4F0; <span class="italic"> {{ taskObject.result.title }}  </span> </span>
            <span class="text-lg">&#x270F; <span class="italic"> {{ taskObject.result.description }}  </span> </span>
            <span class="text-lg">&#x1F4B8;<span class="italic"> {{ taskObject.reward }} GLMR </span> </span>
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

<style>
</style>