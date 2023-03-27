<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import Navbar from './components/Navbar.vue'
import Home from './components/Home.vue';
import TaskModal from './components/TaskModal.vue';

//watches for changes in the user's metamask connection
const connectionStore = useConnectionStore();
connectionStore.initConnectionWatcher();

</script>

<template>
  <div class="bg-background-image ">
    
    <Navbar class=" text-black" />

    <Home />
  </div>


</template>

<style scoped>

</style>
