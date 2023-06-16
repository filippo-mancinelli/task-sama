<script setup>
import { usePopupStore } from '../../stores/usePopupStore';
import { computed, watch } from 'vue';
import { TransitionRoot, TransitionChild } from '@headlessui/vue'

const popupStore = usePopupStore();

// Watch for changes to the showPopup in the pinia store
watch(() => popupStore.showPopup, (newValue, oldValue) => {
    // If showPopup is true, set a timeout to hide the popup after 2 seconds
    if(popupStore.showPopup){
      setTimeout(() => {
        popupStore.setPopup(false, '', '', 'noModal');
      }, 5000);
    }
});


</script>

<template>

<Teleport to="body">
  <Transition name="fade">

  <div v-if="popupStore.showPopup" class="relative" style="z-index: 2000;">
      <div v-if="popupStore.messageType == 'alert'" class="fixed flex p-1 top-4 mx-6 md:right-4 md:p-4 2xl:top-20 text-md border border-black text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400 " :class="{ 'md:top-20': popupStore.popupType == 'modal' }" role="alert">
          <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-2 mb-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
          <span class="sr-only">Info</span>
          <div>
              <span class="font-medium">Info:</span> {{ popupStore.message }}
          </div>
      </div>
      <div v-if="popupStore.messageType == 'danger'" class="fixed flex top-20 px-4 py-4  text-md whitespace-nowrap border border-black text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert" style="right: 10.5rem; ">
        <div>
          <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-2 mb-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
          <span class="sr-only">Info</span>
        </div>
        <div>
          <span class="font-medium">Danger:</span> {{ popupStore.message }}
        </div>
      </div>
      <div v-if="popupStore.messageType == 'success'" class="fixed flex top-20  z-50 px-4 py-4  text-md whitespace-nowrap border border-black text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert" style="right: 10.5rem; ">
        <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-2 mb-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
        <span class="sr-only">Info</span>
        <div>
          <span class="font-medium">Success:</span> {{ popupStore.message }}
        </div>
      </div>
      <div v-if="popupStore.messageType == 'warning'" class="fixed flex top-20  z-50 px-4 py-4  text-md whitespace-nowrap border border-black text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert" style="right: 10.5rem; ">
        <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-2 mb-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
        <span class="sr-only">Info</span>
        <div>
          <span class="font-medium">Warning:</span> {{ popupStore.message }}
        </div>
      </div>
  </div>
  
</Transition>
</Teleport>

</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to{
  opacity: 0;
}

</style>