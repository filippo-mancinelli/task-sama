<script setup>
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useTaskStore } from '../stores/useTaskStore';
import { useVideoStore } from '../stores/useVideoStore';
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router'

let route;
const connectionStore = useConnectionStore();
const videoStore = useVideoStore();
const taskStore = useTaskStore();
const backgroundStore = useBackgroundStore();
backgroundStore.changeBackgroundClass('bg-teal-200 h-full');

const taskObject = ref({});
const participants = ref([]);
const selectedWinner = ref('');
const currentParticipantCounter = ref(0);
var isReady = ref(false);

//##### VIDEO PLAYER #####//
const videoPlayer = ref(null);
const showControls = ref(false);

function next() {
    currentParticipantCounter.value++;
    fetchBackendVideo(taskObject.value.tokenId, participants.value[currentParticipantCounter])
}

function previous() {
    currentParticipantCounter.value--;
    fetchBackendVideo(taskObject.value.tokenId, participants.value[currentParticipantCounter])
}

async function fetchBackendVideo(tokenId, participantAddress) {
  const response = await videoStore.getParticipantVideo(tokenId, participantAddress);
  console.log("res",response.data.data.data)
  const blob = new Blob([response.data.data.data], { type: 'video/mp4' });
  videoPlayer.value.src = URL.createObjectURL(blob);
}

onMounted(async ()=> {
    //#### TASK METADATA FETCH ####//
    route = useRoute();
    taskObject.value.tokenId = route.params.tokenId;

    if(connectionStore.isAllSetUp) {
        taskStore.fetchTaskMetadata(taskObject.value.tokenId).then(response => {
                console.log("taskObject.value",taskObject.value);
                taskObject.value = response;
                participants.value = response.result.participants;
                fetchBackendVideo(taskObject.value.tokenId, participants.value[0]);
                isReady.value = true;
        });
    }

    watch(() => connectionStore.isAllSetUp, (newValue, oldValue) => {
        if(newValue) {
            taskStore.fetchTaskMetadata(taskObject.value.tokenId).then(response => {
                console.log("taskObject.value",taskObject.value);
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
            

            <div class="card-actions flex justify-between">
                <span class="">Winner: {{ selectedWinner }}</span>
                <button class="btn bg-orange-400 hover:bg-orange-500 text-white">Choose</button>
            </div>
        </div>
    </div>

    <!-- PARTICIPANTS VIDEOS -->
    <div class="flex flex-col items-center my-6">
        <div class="flex flex-col items-center bg-teal-100 shadow-xl rounded-xl">
            <!-- PAGINATION -->
            <div class="join mt-2">
                <button class="join-item btn bg-base-100">«</button>
                <button class="join-item btn bg-base-100">22</button>
                <button class="join-item btn bg-base-100">»</button>
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
                            <p>If a dog chews shoes whose shoes does he choose?</p>
                            <button class="btn bg-orange-400 hover:bg-orange-500 text-white">candidate</button>
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