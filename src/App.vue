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
      connectionStore.initConnectionWatcher();
      connectionStore.checkConnection();
});

</script>

<template>
  <div id="app" class="bg-background-image z-10">
    <Navbar class="text-black" />

    <div class="px-4 sm:px-10 md:px-20 lg:px-40 xl:px-60">
      <Popup />
      <Home />
    </div>
  </div>
</template>

<style scoped>

</style>
