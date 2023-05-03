<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import Navbar from './components/Navbar.vue'
import Home from './components/Home.vue';

const connectionStore = useConnectionStore();

//watches for changes in the user's metamask connection
connectionStore.initConnectionWatcher();

</script>

<template>
  <div id="app" class="bg-background-image z-10">
    
    <Navbar class=" text-black" />

    <Home />
  </div>


</template>

<style scoped>

</style>
