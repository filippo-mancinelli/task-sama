<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'
import { useTaskStore } from '../stores/useTaskStore';
import { useConnectionStore } from '../stores/useConnectionStore';

let route;
var tokenId;
const taskObject = ref({})
const imageSrc = ref('');

watch(() => useConnectionStore().isAllSetUp, async (newValue, oldValue) => {
    if(newValue) {
        taskObject.value = await useTaskStore().fetchTaskMetadata(tokenId);
    }
});

onMounted(async () => {
    route = useRoute();
    tokenId = route.params.tokenId;
    taskObject.value = await useTaskStore().fetchTaskMetadata(tokenId);

    const fetchResponse = await useTaskStore().fetchTaskImage(tokenId);
    if(fetchResponse.data.message == 'Not found') {
        imageSrc.value = 'https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427';
    } else {
        imageSrc.value = 'data:image/jpeg;base64,' + fetchResponse.data.data[0].data;
    }
})

</script>

<template>
    <div class="mx-6">
        <div class="card card-side flex flex-col sm:flex-row bg-base-100 shadow-xl">
            <figure ><img class="rounded-md border-black border-2 max-h-60 max-w-120" :src="imageSrc" alt="Movie"/></figure>
            <div v-if="taskObject.result != undefined" class="card-body max-w-xl">
                <h2 class="card-title">{{ taskObject.result.title }}</h2>
                <p class="truncate ...">{{ taskObject.result.description }}</p>
                <div class="card-actions justify-end">
                <button class="btn btn-primary mr-2 text-white bg-orange-400 border-orange-400 hover:bg-orange-600 hover:border-black ">Watch</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
</style>