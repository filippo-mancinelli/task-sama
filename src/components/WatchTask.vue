<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'
import { useTaskStore } from '../stores/useTaskStore';
import { useConnectionStore } from '../stores/useConnectionStore';

let route;
const tokenId = ref(0)

onMounted(() => {
    route = useRoute();
    tokenId.value = route.params.tokenId;

    watch(() => useConnectionStore().isAllSetUp, (newValue, oldValue) => {
        if(newValue) {
            console.log(useTaskStore().fetchTaskMetadata(tokenId.value))
        }
    });
})

</script>

<template>
<div>
    {{ useTaskStore().tasksMetadata[tokenId] }}
</div>
</template>

<style>
</style>