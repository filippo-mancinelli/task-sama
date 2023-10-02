<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'
import { useTaskStore } from '../stores/useTaskStore';
import { useConnectionStore } from '../stores/useConnectionStore';

let route;
const taskObject = ref({})

onMounted(() => {
    route = useRoute();
    taskObject.value.tokenId = route.params.tokenId;

    if(useConnectionStore().isAllSetUp) {
        taskObject.value = useTaskStore().fetchTaskMetadata(taskObject.value.tokenId);
    }
    watch(() => useConnectionStore().isAllSetUp, (newValue, oldValue) => {
        if(newValue) {
            taskObject.value = useTaskStore().fetchTaskMetadata(taskObject.value.tokenId);
        }
    });

    console.log("taskObject", taskObject.value)
})

</script>

<template>
<div>
    {{ useTaskStore().tasksMetadata[tokenId] }}
</div>
</template>

<style>
</style>