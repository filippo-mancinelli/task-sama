<script setup>
import { onMounted, ref, watch } from 'vue';
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useUsersStore } from '../stores/useUsersStore';
import { useRoute } from 'vue-router';

useBackgroundStore().changeBackgroundClass('bg-orange-50 h-screen');

let route = useRoute();
let username = route.params.username;
let avatarImgHtml;
var userData = ref({});
useUsersStore().getUserDataByUsername(username).then(response => {
    console.log(response);
    userData.value = response.data.data;
    avatarImgHtml = useConnectionStore().getAvatarImg(100, userData.value.seed);
});



</script>

<template>
<!-- USER INFO -->
<div class="card card-side flex items-center bg-base-100 shadow-xl m-4 mb-8">
    <div class="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 avatar ml-4">
        <div v-html="avatarImgHtml" class=""></div>
    </div>
  
    <div class="card-body flex flex-col">
        <h2 class="card-title">
            {{ userData.username }}
            <PencilIcon tabindex="0" @click="showModal=true" class="h-4 w-4 mr-1 cursor-pointer text-slate-500" />
        </h2>
        <p class="max-sm:text-xs max-sm:text-ellipsis max-sm:overflow-hidden max-sm:whitespace-nowrap">{{ userData.address }}</p>
    </div>

</div>
</template>


<style scoped>

</style>