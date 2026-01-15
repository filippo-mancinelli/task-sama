<script setup lang="ts">
import Modal from './widgets/Modal.vue';
import FileUpload from './bricks/FileUpload.vue';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'
import { useSolanaTaskStore } from '../stores/useSolanaTaskStore';
import { useSolanaWalletStore } from '../stores/useSolanaWalletStore';
import { useCommentsStore } from '../stores/useCommentsStore';
import { HandRaisedIcon, ClockIcon } from '@heroicons/vue/24/solid';
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useArgStore } from '../stores/useArgStore';
import { usePopupStore } from '../stores/usePopupStore';
import { PROGRAM_ID } from '../lib/solana/config';
import CommentSection from './CommentSection.vue';

const backgroundStore = useBackgroundStore();
const walletStore = useSolanaWalletStore();
const taskStore = useSolanaTaskStore();
const commentsStore = useCommentsStore();
const argStore = useArgStore();
const popupStore = usePopupStore();

backgroundStore.changeBackgroundClass('bg-background-image h-full');

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

watch(() => walletStore.isConnected, async (newValue) => {
    if(newValue && tokenId) {
        const tasks = await taskStore.fetchTasks();
        taskObject.value = tasks.find((t: any) => t.taskId === parseInt(tokenId));
        // TODO: Check if user is participating by querying ParticipantRecord PDA
        isParticipating.value = false;
        isReady.value = true;
    }
});

function openModal() {
  showModal1.value = true;
}

async function participateTask() {
  if(isLoading.value === true) {
    popupStore.setPopup(true, 'alert', 'Wait for the current participation request to finish', 'modal');
    return;
  }
  if(argStore.getArguments.file.size == 0) {
    popupStore.setPopup(true, 'danger', 'You must upload a valid video to participate', 'modal');
    return;
  }
  else if(!walletStore.isConnected){
     popupStore.setPopup(true, 'warning', 'You need to connect your wallet first', 'modal');
     return;
  }

  isLoading.value = true;

  try {
    // Upload video to backend first
    await taskStore.uploadVideo(tokenId, argStore.arguments.fileData.value);

    // Then participate on-chain
    const result = await taskStore.participate(tokenId);

    isLoading.value = false;
    modalType.value = 'success';
    message.value = 'You sent your participation! Transaction: ' + result.signature.slice(0, 8) + '...';
    showModal2.value = true;
    showModal1.value = false;
  } catch (error: any) {
    console.log("error", error);
    isLoading.value = false;
    modalType.value = 'danger';
    message.value = 'Error sending participation: ' + (error.message || error);
    showModal2.value = true;
  }
}


async function fetchComments() {
  const commentsResponse = await commentsStore.getComments(tokenId, 'task');
  comments.value = commentsResponse.data.message == 'Comments fetched correctly.' ? commentsResponse.data.data : [];
}

onMounted(async () => {
    route = useRoute();
    tokenId = route.params.tokenId;

    // Fetch task from Solana
    const tasks = await taskStore.fetchTasks();
    taskObject.value = tasks.find((t: any) => t.taskId === parseInt(tokenId));
    isReady.value = true;
    await fetchComments();

    // TODO: Check if current user is participating by querying ParticipantRecord PDA
    if(walletStore.isConnected && taskObject.value) {
        // Simplified for now
        isParticipating.value = false;
    }

    // TODO: Fetch task image from backend
    imageSrc.value = 'https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427';
})

</script>

<template>
    <div v-if="isReady" class="mx-6">
        <div class="card card-side flex flex-col sm:flex-row shadow-xl bg-white">
            <figure ><img class="rounded-md border-black border-2 max-h-60 max-w-120" :src="imageSrc" alt="Movie"/></figure>
            <div v-if="taskObject" class="card-body max-w-xl gap-2">
                <h2 class="card-title text-black">#{{ taskObject.taskId  }} - {{ taskObject.title }}</h2>
                <p class="italic text-xs -mt-2 text-black">{{ new Date(taskObject.createdAt * 1000).toLocaleDateString() }}</p>
                <p class="text-black truncate ...">{{ taskObject.description }}</p>
                <p class="italic truncate text-black">Creator:<span class="pl-2 text-sm">{{ taskObject.creator?.toString() }} </span></p>
                <p class="italic truncate text-black">Program ID:<span class="pl-2 text-sm text-blue-500">{{ PROGRAM_ID.toString() }}</span></p>
                <p class="italic truncate text-black">Task ID:<span class="pl-2 text-lg">{{ taskObject.taskId }} </span></p>
                <p class="italic truncate text-black">Reward:<span class="pl-2 text-lg">{{ (taskObject.rewardAmount / 1_000_000_000).toFixed(2) }} SOL</span></p>


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

        <div class="card card-side flex flex-col bg-white shadow-xl my-4 p-4">
            <h2 class="card-title mb-2 text-black">Participants: {{ taskObject.participantCount || 0 }}</h2>
            <p class="text-sm text-gray-500">Participant addresses are stored in on-chain PDAs</p>
            <!-- TODO: Fetch and display participant records from ParticipantRecord PDAs -->
        </div>
    </div>

    <!--COMMENT SECTION-->
    <div class="mx-6 mt-6 mb-0">
        <CommentSection 
            :tokenId="tokenId"
            :commentsArray="comments"
            :category="'task'"
            @refreshComments="fetchComments"
        />
    </div>



    <Modal @close-modal="showModal1 = false" :showModal="showModal1" :modalType="''">
        <template v-slot:title> <span class="text-black">Participate to this task:</span></template>
        <template v-slot:content>
        <div class="flex flex-col mb-2">
            <span class="text-lg">&#x1F4F0; <span class="italic text-black"> {{ taskObject?.title }}  </span> </span>
            <span class="text-lg">&#x270F; <span class="italic text-black"> {{ taskObject?.description }}  </span> </span>
            <span class="text-lg">&#x1F4B8;<span class="italic text-black"> {{ taskObject ? (taskObject.rewardAmount / 1_000_000_000).toFixed(2) : 0 }} SOL </span> </span>
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