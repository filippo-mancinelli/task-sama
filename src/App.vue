<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import Navbar from './components/Navbar.vue'

//watches for changes in the user's metamask connection
const connectionStore = useConnectionStore();
connectionStore.initConnectionWatcher();

</script>

<template>
  <Navbar />

  
</template>

<style scoped>


</style>
