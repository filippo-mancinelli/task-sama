<script setup>
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useVideoStore } from '../stores/useVideoStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useTaskStore } from '../stores/useTaskStore';
import { ref, onMounted } from 'vue';


const connectionStore = useConnectionStore();
const videoStore = useVideoStore();
const taskStore = useTaskStore();
const backgroundStore = useBackgroundStore();
backgroundStore.changeBackgroundClass('bg-teal-200');

onMounted(async ()=> {
  
});

</script>

<template>
sdas
</template>

<style>
</style>