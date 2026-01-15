<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { usePopupStore } from '../stores/usePopupStore';
import { useVideoStore } from '../stores/useVideoStore';
import { useSolanaWalletStore } from '../stores/useSolanaWalletStore';
import { useUsersStore } from '../stores/useUsersStore';
import { useSolanaTaskStore } from '../stores/useSolanaTaskStore';
import { ref, onMounted, watch } from 'vue';
import { PlayCircleIcon } from "@heroicons/vue/24/solid"
import { PencilIcon } from '@heroicons/vue/24/solid';
import Modal from './widgets/Modal.vue';

const walletStore = useSolanaWalletStore();
const popupStore = usePopupStore();
const usersStore = useUsersStore();
const videoStore = useVideoStore();
const taskStore = useSolanaTaskStore();
const backgroundStore = useBackgroundStore();
backgroundStore.changeBackgroundClass('bg-orange-50 h-screen');

// tabs data
const selected = ref('created');
const elements = ref([]);
const imageMapping = ref({});

// profile data
const avatarImgHtml = ref('');
const newUsername = ref('');

// modal
const showModal = ref(false);


function editUsername() {
    usersStore.editUsername(newUsername.value).then(() => {
        showModal.value = false;
    }).catch((error) => {
        console.log("error", error);
        popupStore.setPopup(true, 'danger', error.response.data, 'modal');
    });
}


async function fetchData() {
    await taskStore.fetchTasks();
    const tasks = taskStore.tasks || [];
    elements.value = tasks.filter((task: any) =>
        task.creator?.toString().toLowerCase() === walletStore.walletAddress?.toLowerCase()
    );

    // TODO: Fetch task images from backend if needed
    for(let i = 0; i < elements.value.length; i++) {
        imageMapping.value[elements.value[i].taskId] = 'https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427';
    }
}

watch(() => selected.value, async (newSelected) => {
    if(walletStore.walletAddress && taskStore.tasks) {
        const tasks = taskStore.tasks || [];

        switch(newSelected) {
            case 'created':
                elements.value = tasks.filter((task: any) =>
                    task.creator?.toString().toLowerCase() === walletStore.walletAddress?.toLowerCase()
                );
                break;

            case 'participating':
                // TODO: Query ParticipantRecord PDAs to check if user is participating
                elements.value = tasks.filter((task: any) => {
                    // For now, simplified version - will need to fetch participant records
                    return false;
                });
                break;

            case 'won':
                // TODO: Query completed tasks where user is winner
                elements.value = videoStore.videoMetadata?.filter((metadata: any) =>
                    metadata.winner?.toLowerCase() === walletStore.walletAddress?.toLowerCase()
                ) || [];
                break;
        }
    }
});

watch(() => walletStore.isConnected, async (value) => {
    if (value) {
        await fetchData();
        // TODO: Implement avatar generation for Solana addresses
        // avatarImgHtml.value = generateSolanaAvatar(walletStore.walletAddress, 100);
    } else {
        useRouter().push({ name: '/' });
    }
});

onMounted(async () => {
    setTimeout(() => {
        if(!walletStore.isConnected){
            useRouter().push({ name: 'Home' });
        }
    }, 1000);

    if(walletStore.isConnected) {
        await fetchData();
        // TODO: Implement avatar generation for Solana addresses
        // avatarImgHtml.value = generateSolanaAvatar(walletStore.walletAddress, 100);
    }
});

</script>

<template>
<!-- USER INFO -->
<div class="card card-side flex items-center bg-base-100 shadow-xl m-4 mb-8">
    <div class="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 avatar ml-4">
        <div v-html="avatarImgHtml" class=""></div>
    </div>
  
    <div class="card-body">
        <h2 class="card-title">
            {{ usersStore.username }}
            <PencilIcon tabindex="0" @click="showModal=true" class="h-4 w-4 mr-1 cursor-pointer text-slate-500" />
        </h2>
        <p class="max-sm:w-48 max-sm:text-xs max-sm:text-ellipsis max-sm:overflow-hidden max-sm:whitespace-nowrap">{{ walletStore.walletAddress }}</p>
    </div>
</div>

<!-- MODAL -->
<Modal @close-modal="showModal = false" :showModal="showModal" :modal-type="''">
    <template v-slot:title>Edit username</template>
    <template v-slot:content>
        <input type="text" v-model="newUsername" placeholder="Your new username" class="input input-bordered input-error w-full max-w-xs" />
        <button @click="editUsername()" class="btn w-20 h-10 ml-2 mt-2 bg-orange-400 text-white">Confirm</button>
    </template>
</Modal>

<!--TASKS INFO-->
<div class="flex">
  <button class="flex flex-col items-center p-2 w-full border-2 border-pink-200 bg-pink-200 text-pink-600 hover:border-pink-600" :class="selected == 'created' ? 'border-pink-600' : ''" @click="() => selected = 'created'">
    <svg xmlns="http://www.w3.org/2000/svg"  class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
    <span class="btm-nav-label">Created</span>
  </button>

  <button class="flex flex-col items-center p-2 w-full border-2 bg-blue-200 text-blue-600 hover:border-blue-600" :class="selected == 'participating' ? 'border-blue-600' : ''" @click="() => selected = 'participating'">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 01.198-.471 1.575 1.575 0 10-2.228-2.228 3.818 3.818 0 00-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0116.35 15m.002 0h-.002" /></svg>
    <span class="btm-nav-label">Participating</span>
  </button>

  <button class="flex flex-col items-center p-2 w-full border-2 bg-teal-200 text-teal-600 hover:border-teal-600" :class="selected == 'won' ? 'border-teal-600' : ''" @click="() => selected = 'won'">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>
    <span class="btm-nav-label">Won</span>
  </button>
</div>

<div v-if="elements.length > 0" class="flex flex-col gap-2 mt-2 ">
    <div v-for="element in elements" class="border-2 rounded-sm">
        <div class="max-md:flex-col items-center justify-between bg-orange-100 md:flex">
            <div class="max-md:flex-col gap-2 items-center md:flex">
                <figure class="w-40"><img class="h-25 max-w-40 max-sm:self-center" :src="imageMapping[element.tokenId]" alt="Image" /></figure>
                <div class="flex flex-col ml-1">
                    <span class="text-md font-medium">#{{ element.taskId }} - {{ element.title }}</span>
                    <span class="text-sm">{{ element.description }}</span>
                    <span class="text-sm">{{ (element.rewardAmount / 1_000_000_000).toFixed(2) }} SOL</span>
                </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="flex">
                <router-link v-if="selected !== 'won'" :to="'/task/' + element.taskId" class="btn btn-primary mr-2 text-white bg-orange-400 border-orange-400 hover:bg-orange-600 hover:border-black ">
                    details
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                </router-link>

                <router-link v-if="selected == 'created'" :to="'/chooseWinner/' + element.taskId" class="btn btn-primary text-white bg-orange-400 border-orange-400 hover:bg-orange-600 hover:border-black ">
                    choose winner
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>
                </router-link>

                <router-link v-if="selected == 'won'" :to="'/video/' + element.taskId" class="btn btn-primary text-white bg-orange-400 border-orange-400 hover:bg-orange-600 hover:border-black ">
                    watch
                    <PlayCircleIcon class="h-5 w-5 hover:cursor-pointer" />
                </router-link>
            </div>
        </div>

    </div>
</div>

<div v-else class="mt-2 p-2 text-md">There's nothing here :)</div>

</template>