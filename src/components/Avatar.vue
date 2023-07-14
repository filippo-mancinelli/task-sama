<script setup>
    import { useConnectionStore } from '../stores/useConnectionStore'
    import { computed } from '@vue/reactivity';

    const connectionStore = useConnectionStore();
    
    const isConnected = computed(() => { return connectionStore.isConnected})

</script>

<template>
    <div v-if="isConnected" class="dropdown">
      <label tabindex="0" class="btn m-1 rounded-full drop-shadow-xl bg-orange-100">
        <!--AVATAR-->
        <!--ARROW-->
      </label>
      <div tabindex="0" class="dropdown-content z-[1] right-0 w-60 top-15 card card-compact p-2 shadow drop-shadow-xl bg-orange-500 text-primary-content">
        <div class="card-body p-2 ">
          <h5 class="card-title text-sm mb-0">{{ connectionStore.walletAddress }}</h5>
          <p>you can use any element as a dropdown.</p>
        </div>
      </div>
    </div>
</template>

<style scoped>
</style>