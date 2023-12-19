<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import { useBackgroundStore } from './stores/useBackgroundStore';
import { onMounted, watch, ref } from 'vue';
import Navbar from './components/Navbar.vue';
import Popup from './components/widgets/Popup.vue';

const connectionStore = useConnectionStore();
const backgroundStore = useBackgroundStore();

onMounted(() => {
      connectionStore.initConnectionWatcher();
      connectionStore.checkConnection();
});

</script>

<template>
  <div id="app" class="z-10" :class="backgroundStore.backgroundClass">
    <Navbar />
    <Popup />

    <router-view></router-view>
  </div>
</template>


<style scoped>

</style>
