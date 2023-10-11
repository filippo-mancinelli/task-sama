<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'
import { useTaskStore } from '../stores/useTaskStore';
import { useConnectionStore } from '../stores/useConnectionStore';

let route;
var tokenId;
const taskObject = ref({})

onMounted(async () => {
    route = useRoute();
    tokenId = route.params.tokenId;

    if(useConnectionStore().isAllSetUp) {
        taskObject.value = await useTaskStore().fetchTaskMetadata(tokenId);
    }
    watch(() => useConnectionStore().isAllSetUp, async (newValue, oldValue) => {
        if(newValue) {
            taskObject.value = await useTaskStore().fetchTaskMetadata(tokenId);
        }
    });

    console.log("taskObject", await useTaskStore().fetchTaskMetadata(tokenId))
})

</script>

<template>
   <div class="flex gap-4 py-10 justify-center border-2">
        <div>
            left
        </div>

        <div>
            right
        </div>
   </div>
</template>

<style>
</style>