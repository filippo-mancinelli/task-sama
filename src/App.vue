<script setup>
import { useConnectionStore } from './stores/useConnectionStore';
import { usePopupStore } from './stores/usePopupStore';
import Navbar from './components/Navbar.vue'
import Home from './components/Home.vue';
import Popup from './components/widgets/Popup.vue';

const connectionStore = useConnectionStore();
const popupStore = usePopupStore();

//watches for changes in the user's metamask connection
connectionStore.initConnectionWatcher();

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
