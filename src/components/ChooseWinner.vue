<script setup>
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useTaskStore } from '../stores/useTaskStore';
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router'
import { usePopupStore } from '../stores/usePopupStore';

// Stores
let route;
const connectionStore = useConnectionStore();
const taskStore = useTaskStore();
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
var isReady = ref(false);


//##### VIDEO PLAYER #####//
const videoPlayer = ref(null);
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
  const videoBlob = new Blob([response.data], { type: 'video/mp4' });
  videoPlayer.value.src = URL.createObjectURL(videoBlob);
}

//##### CHOOSE WINNER #####//
// Before calling the contract function, we have to make sure first that the video has been succesfully deployed to IPFS
// in order to retrieve the IPFS URL which will be passed to the contract function, which will mint a new completed NFT with it.
function chooseWinner() {
    if(selectedWinner.value != '') {
        taskStore.uploadVideoToIpfs(taskObject.value.tokenId, selectedWinner.value).then(result => {
            if(result.status == 200) {
                connectionStore.callContractFunction('Tasks', 'chooseWinner', 'stateChanging', [taskObject.value.tokenId, selectedWinner.value, ipfsUrl]).then(res => {
                    console.log("RESPONSE callContractFunction",res);
                    modalType.value = 'success';
                    message.value = '🏆 The winner has been chosen!';
                    showModalResult.value = true;

                }).catch(error => {
                    modalType.value = 'danger';
                    message.value = 'Error creating task: ' + error;
                    showModalResult.value = true;
                    console.log("Error while choosing winner: ", error)
                });
            } else {
                usePopupStore().setPopup(true, 'danger', 'There was a problem uploading the video to IPFS. Please try again', 'noModal')
            }
        }).catch(error => {
            console.log(error);
        });
    }
}

onMounted(async ()=> {
    //#### TASK METADATA FETCH ####//
    route = useRoute();
    taskObject.value.tokenId = route.params.tokenId;

    if(connectionStore.isAllSetUp) {
        taskStore.fetchTaskMetadata(taskObject.value.tokenId).then(response => {
                taskObject.value = response;
                participants.value = response.result.participants;
                fetchBackendVideo(taskObject.value.tokenId, participants.value[0]);
                isReady.value = true;
        });
    }

    watch(() => connectionStore.isAllSetUp, (newValue, oldValue) => {
        if(newValue) {
            taskStore.fetchTaskMetadata(taskObject.value.tokenId).then(response => {
                taskObject.value = response;
                participants.value = response.result.participants;
                fetchBackendVideo(taskObject.value.tokenId, participants.value[0]);
                isReady.value = true;
            });
        }
    });    
});

</script>

<template>
<div v-if="isReady" class="flex flex-col">
    <!-- TASK SUMMARY -->
    <div class="card lg:card-side bg-base-100 shadow-xl mx-12 mt-6 ">
        <figure class="w-96"><img src="https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427" alt="Shoes" /></figure>
        <div class="card-body">
            <h2 class="card-title">#{{ taskObject.tokenId }} - {{ taskObject.result.title }} </h2>
            <p>{{ taskObject.result.description }}</p>
            <p>Participants: {{ participants.length }}</p>
            <span>Winner: <span class="text-orange-600">{{ selectedWinner }}</span></span>
            <button class="btn self-start mt-1 bg-orange-400 hover:bg-orange-500 text-white" @click="chooseWinner">Choose <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg></button>
        </div>
    </div>

    <!-- PARTICIPANTS VIDEOS -->
    <div class="flex flex-col items-center my-6">
        <div class="flex flex-col items-center bg-teal-100 shadow-xl rounded-xl">
            <!-- PAGINATION -->
            <div class="join mt-2">
                <button class="join-item btn bg-base-100" @click="first">«</button>
                <button class="join-item btn bg-base-100">{{ currentParticipantCounter + 1 }}</button>
                <button class="join-item btn bg-base-100" @click="last">»</button>
            </div>

            <!-- CARD -->
            <div class="flex self-center items-center gap-3 px-2 -mt-4 ">
                <a class="btn btn-circle border-2 border-teal-200" @click="previous">❮</a> 
                    <div class="card w-96 my-6 bg-base-100 shadow-xl">
                        <!-- VIDEO PLAYER -->
                        <div class="video-container" @mouseenter="showControls = true" @mouseleave="showControls = false">
                            <div class="video-wrapper">
                                <video ref="videoPlayer" :class="{ 'show-controls': showControls }" controls autoplay class="video-player rounded-t-2xl"></video>
                            </div>
                        </div>
                        <div class="card-body p-3">
                            <p>{{ participants[currentParticipantCounter] }}</p>
                            <button class="btn bg-orange-400 hover:bg-orange-500 text-white" @click="() => selectedWinner = participants[currentParticipantCounter]">candidate</button>
                        </div>
                    </div>
                <a class="btn btn-circle border-2 border-teal-200" @click="next">❯</a> 
            </div>
        </div>


    </div>

</div>
</template>

<style>
.video-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}
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