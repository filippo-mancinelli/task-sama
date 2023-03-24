<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import Navbar from './components/Navbar.vue'
import Home from './components/Home.vue';

//watches for changes in the user's metamask connection
const connectionStore = useConnectionStore();
connectionStore.initConnectionWatcher();

</script>

<template>
  <Navbar />
  <Home />

</template>

<style scoped>


</style>
