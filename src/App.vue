<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import { onMounted } from 'vue';
import Navbar from './components/Navbar.vue'
import Home from './components/Home.vue';
import Popup from './components/widgets/Popup.vue';

const connectionStore = useConnectionStore();

onMounted(() => {
      connectionStore.initConnectionWatcher();
      connectionStore.checkConnection();
});

</script>

<template>
  <div id="app" class="bg-background-image z-10">
    <Navbar />

      <Popup />
      <Home />
  </div>
</template>

<style scoped>

</style>
