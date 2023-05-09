<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import { useVideoStore } from './stores/useVideoStore';
import { onMounted } from 'vue';
import Navbar from './components/Navbar.vue'
import Home from './components/Home.vue';
import Popup from './components/widgets/Popup.vue';

const connectionStore = useConnectionStore();
const videoStore = useVideoStore();

onMounted(() => {
      connectionStore.initABI();
      connectionStore.initConnectionWatcher();
      connectionStore.checkConnection();
      videoStore.initLikes();
});

</script>

<template>
  <div id="app" class=" bg-background-image z-10">
    <Navbar class=" text-black" />
    <Popup />
    
    <Home />
  </div>


</template>

<style scoped>

</style>
