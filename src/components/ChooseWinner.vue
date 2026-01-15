<script setup lang="ts">
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useSolanaWalletStore } from '../stores/useSolanaWalletStore';
import { useSolanaTaskStore } from '../stores/useSolanaTaskStore';
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router'
import { usePopupStore } from '../stores/usePopupStore';
import { useVideoStore } from '../stores/useVideoStore';
import Modal from './widgets/Modal.vue';

// Stores
let route;
const walletStore = useSolanaWalletStore();
const videoStore = useVideoStore();
const taskStore = useSolanaTaskStore();
const backgroundStore = useBackgroundStore();
backgroundStore.changeBackgroundClass('bg-teal-200 h-full');

// Refs
const taskObject = ref({});
const participants = ref([]);
const selectedWinner = ref('');
const currentParticipantCounter = ref(0);
const showModalResult = ref(false);
const modalType = ref('');
const message = ref('');
const isLoading = ref(false);
const loadingMessage = ref('')
const videoBlocked = ref(false);
const videoRejected = ref(false);
const reminded = ref(false);
const imageSrc = ref('');
var isReady = ref(false);


//##### VIDEO PLAYER #####//
const videoSource = ref(null);
const showControls = ref(false);

//##### NAVIGATION #####//
function next() {
    if(currentParticipantCounter.value < participants.value.length -1) {
        currentParticipantCounter.value++;
        fetchBackendVideo(taskObject.value.tokenId, participants.value[currentParticipantCounter.value])
    }
}

function previous() {
    if(currentParticipantCounter.value > 0) {
        currentParticipantCounter.value--;
        fetchBackendVideo(taskObject.value.tokenId, participants.value[currentParticipantCounter.value])
    }
}

function last() {
    currentParticipantCounter.value = participants.value.length - 1;
    fetchBackendVideo(taskObject.value.tokenId, participants.value[currentParticipantCounter.value])
}

function first() {
    currentParticipantCounter.value = 0;
    fetchBackendVideo(taskObject.value.tokenId, participants.value[currentParticipantCounter.value])
}

async function fetchBackendVideo(tokenId, participantAddress) {
  const response = await taskStore.getParticipantVideo(tokenId, participantAddress);
  if(response.status == 202 && response.statusText == "Accepted") { // Video not moderated
    videoBlocked.value = true;
    return;
  } else if(response.status == 204) { // Video rejected
    videoBlocked.value = true;
    videoRejected.value = true;
  } else {
    videoBlocked.value = false;
    const videoBlob = new Blob([response.data], { type: 'video/mp4' });
    videoSource.value = URL.createObjectURL(videoBlob);
  }
}

function reminder() {
    if(!reminded.value) {
        reminded.value = true;
        taskStore.reminder(route.params.tokenId, participants.value[currentParticipantCounter.value]);
    }
}

//##### CHOOSE WINNER #####//
// Before calling the program instruction, upload the winner's video to IPFS
// to get the metadata URL which will be used for NFT minting
async function chooseWinner() {
    if(selectedWinner.value != '') {
        isLoading.value = true;
        loadingMessage.value = 'uploading video to IPFS'

        try {
            // Upload video to IPFS via backend
            const uploadResult = await taskStore.uploadVideoToIpfs(taskObject.value.taskId, selectedWinner.value);

            if(uploadResult.status == 200) {
                loadingMessage.value = 'Waiting for transaction confirmation'

                // Call Solana program to choose winner and mint NFT
                const result = await taskStore.chooseWinner(
                    taskObject.value.taskId,
                    selectedWinner.value,
                    uploadResult.data.data.IPFSMetadataUrl,
                    uploadResult.data.data.IPFSVideoUrl
                );

                modalType.value = 'success';
                message.value = '🏆 The winner has been chosen! NFT minted. Tx: ' + result.signature.slice(0, 8) + '...';
                showModalResult.value = true;
                isLoading.value = false;

                // Add new NFT to backend database
                videoStore.confirmNFTId(uploadResult.data.data.IPFSMetadataUrl, taskObject.value.taskId);
                videoStore.addNewNftLikeDocument(taskObject.value.taskId);
            } else {
                usePopupStore().setPopup(true, 'danger', 'There was a problem uploading the video to IPFS. Please try again', 'modal');
                isLoading.value = false;
            }
        } catch (error: any) {
            console.log(error);
            isLoading.value = false;
            modalType.value = 'danger';
            message.value = 'Error choosing winner: ' + (error.message || error);
            showModalResult.value = true;
        }
    }
}

onMounted(async ()=> {
    //#### TASK METADATA FETCH ####//
    route = useRoute();
    const tokenId = route.params.tokenId;

    // Image init - TODO: Fetch from backend
    imageSrc.value = 'https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427';

    // Fetch task from Solana
    if(walletStore.isConnected) {
        const tasks = await taskStore.fetchTasks();
        taskObject.value = tasks.find((t: any) => t.taskId === parseInt(tokenId));

        // TODO: Fetch participant records from PDAs
        participants.value = [];

        if(participants.value.length > 0) {
            fetchBackendVideo(taskObject.value.taskId, participants.value[0]);
        }
        isReady.value = true;
    }

    // Watch for wallet connection changes
    watch(() => walletStore.isConnected, async (newValue) => {
        if(newValue) {
            const tasks = await taskStore.fetchTasks();
            taskObject.value = tasks.find((t: any) => t.taskId === parseInt(tokenId));

            // TODO: Fetch participant records from PDAs
            participants.value = [];

            if(participants.value.length > 0) {
                fetchBackendVideo(taskObject.value.taskId, participants.value[0]);
            }
            isReady.value = true;
        }
    });
});

</script>

<template>
<div v-if="isReady" class="flex flex-col w-screen">
    <!-- TASK SUMMARY -->
    <div class="card lg:card-side bg-base-100 shadow-xl mx-12 mt-6 ">
        <figure  class="max-w-lg"><img :src="imageSrc" alt="Shoes" /></figure>

        <div class="card-body">
            <h2 class="card-title">#{{ taskObject.taskId }} - {{ taskObject.title }} </h2>
            <p class="whitespace-normal overflow-hidden">{{ taskObject.description }}</p>
            <p>Participants: {{ taskObject.participantCount || 0 }}</p>
            <span>Winner: <span class="text-orange-600">{{ selectedWinner }}</span></span>
            <button class="btn self-start mt-1 bg-orange-400 hover:bg-orange-500 text-white" @click="chooseWinner">
                <span v-if="!isLoading" class="flex gap-1 items-center">Choose <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg></span>
                <span v-else class="flex items-center gap-2">{{ loadingMessage }}<span  class="loading loading-ring loading-md -translate-x-1"></span></span> 
            </button>
        </div>
    </div>

    <!-- PARTICIPANTS VIDEOS -->
    <div v-if="participants.length > 0" class="flex flex-col items-center my-6">
        <div class="flex flex-col items-center bg-teal-100 shadow-xl rounded-xl">
            <!-- PAGINATION -->
            <div class="join mt-2">
                <button class="join-item btn bg-base-100" @click="first">«</button>
                <button class="join-item btn bg-base-100">{{ currentParticipantCounter + 1 }}</button>
                <button class="join-item btn bg-base-100" @click="last">»</button>
            </div>

            <!-- CARD -->
            <div class="flex self-center items-center gap-3 px-2 -mt-4">
                <a class="btn btn-circle border-2 border-teal-200" @click="previous">❮</a> 
                    <div class="card w-96 my-6 bg-base-100 shadow-xl">
                        <!-- VIDEO PLAYER -->
                        <div class="video-container" @mouseenter="showControls = true" @mouseleave="showControls = false">
                            <div class="video-wrapper" :class="{ 'pb-0': videoBlocked }">
                                <video v-if="!videoBlocked" ref="videoPlayer" :src="videoSource" :class="{ 'show-controls': showControls }" controls autoplay class="video-player rounded-t-2xl"></video>

                                <div v-else class="flex flex-col mt-2 mx-3 bg-gray-100 rounded-xl">
                                    <span v-if="videoRejected" class="p-4">This video has been blocked by our moderators for violating our terms and conditions. You can ignore this and skip this participant video or _read our terms and conditions_</span>
                                    <span v-else class="p-4">This video was not yet reviewed by our moderation team. Click the button below to send us a reminder to review this video as soon as possible!</span>
                                    <button v-if="!videoRejected" class="btn btn-circle self-center mb-4 rounded-full bg-yellow-300 hover:bg-yellow-400 text-white" :class="{ 'btn-disabled': reminded, 'bg-yellow-400': reminded }" @click="reminder">
                                        <svg v-if="!reminded" xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="1" stroke="black" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" stroke-width="1" stroke="black" class="w-6 h-6"><path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.266 2.5z" /><path fill-rule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 11-4.5 0z" clip-rule="evenodd" /></svg>
                                    </button>
                                </div>

                            </div>
                        </div>
                        <div class="card-body p-3">
                            <p>{{ participants[currentParticipantCounter] }}</p>
                            <button class="btn bg-orange-400 hover:bg-orange-500 text-white" :class="{ 'btn-disabled': videoBlocked, 'bg-orange-500': videoBlocked }" @click="() => selectedWinner = participants[currentParticipantCounter]">candidate</button>
                        </div>
                    </div>
                <a class="btn btn-circle border-2 border-teal-200" @click="next">❯</a> 
            </div>
        </div>

    </div>
    <div v-else>
        <div class="flex justify-center bg-teal-100 shadow-xl rounded-xl my-6 mx-12 py-4">
            There are no participants yet
        </div>
    </div>
</div>


<!-- RESULT MODAL -->   
<Modal @close-modal="showModalResult = false" :showModal="showModalResult" :modalType="modalType">
    <template v-slot:title></template>
    <template v-slot:content>{{ message }}</template>
</Modal>

</template>

<style>

.video-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background-color: rgb(255, 255, 255); /* Optional: Add a background color to fill the empty space */
  border-top-left-radius: 1rem; /* 16px */
  border-top-right-radius: 1rem; /* 16px */
}

.video-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

</style>