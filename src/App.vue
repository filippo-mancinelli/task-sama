<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import { useBackgroundStore } from './stores/useBackgroundStore';
import { onMounted, watch } from 'vue';
import Navbar from './components/Navbar.vue';
import Popup from './components/widgets/Popup.vue';

const connectionStore = useConnectionStore();
const backgroundStore = useBackgroundStore();

onMounted(() => {
      connectionStore.initConnectionWatcher();
      connectionStore.checkConnection();

      watch(() => {

      })
});

</script>

<template>
  <div id="app" class="z-10" :class="[backgroundStore.backgroundClass, backgroundStore.backgroundClass === 'bg-background-image' ? 'h-full' : 'h-screen']">
    <Navbar />
    <Popup />

    <router-view></router-view>
  </div>
</template>


<style scoped>

</style>
