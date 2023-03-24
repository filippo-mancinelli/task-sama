<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import { onMounted, onUnmounted } from 'vue';
import Navbar from './components/Navbar.vue'
import Home from './components/Home.vue';

//watches for changes in the user's metamask connection
const connectionStore = useConnectionStore();
connectionStore.initConnectionWatcher();

onUnmounted(() => {
  //persist the connection state across refreshes
  localStorage.setItem('isConnected', JSON.stringify(connectionStore.isConnected))
});
</script>

<template>
  <Navbar />
  <Home />

</template>

<style scoped>


</style>
