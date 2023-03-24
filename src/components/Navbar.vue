<script setup>
import { useConnectionStore } from '../stores/useConnectionStore'
import { onMounted, onUnmounted } from 'vue'
import { computed } from '@vue/reactivity';

const connectionStore = useConnectionStore();

    //not strictly necessary since pinia variables by default are reactive
    const isConnected = computed(() => { return connectionStore.isConnected})

    function connect() {
      connectionStore.connect();
    }

  onMounted(() => {
    connectionStore.initConnectionWatcher();
  });

  onUnmounted(() => {
    //persist the connection state across refreshes
    localStorage.setItem('isConnected', JSON.stringify(connectionStore.isConnected))
  });
</script>

<template>
  <div class="navbar sticky px-40 bg-base-100">
  <div class="flex-1 border-solid border-2 border-black rounded-full bg-orange-100">
    <a class="btn btn-ghost normal-case text-2xl">Task Sama</a>
    <ul class="menu menu-horizontal px-1">
      <li><a class=" hover:bg-orange-300 text-xl">Home</a></li>
      <li><a class="hover:bg-orange-300 text-xl">Tasks</a></li>
    </ul>
  </div>
  <div class="flex-none">

    <li class="list-none px-5">
      <button v-if="!isConnected" @click="connect" class="btn bg-orange-500" >Connect</button>
      <button v-else class="btn bg-black text-white">Connected</button>
    </li>
    

  </div>
</div>

</template>

<style scoped>
.btn-ghost:hover,
    .btn-ghost.btn-active {
    --tw-border-opacity: 0;
    background-color: transparent;
    --tw-bg-opacity: 0.2;
}
</style>
