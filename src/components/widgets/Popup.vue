<script setup>
import { defineProps, defineEmits, computed, watch } from 'vue';
import { TransitionRoot, TransitionChild } from '@headlessui/vue'

const props = defineProps(['showPopup', 'messageType', 'message']);
const showPopupComputed = computed(() => {return props.showPopup });
const emits = defineEmits(['showPopup']);

// Watch for changes to the showPopup prop
watch(showPopupComputed, (newValue, oldValue) => {
  if (newValue) {
    // If showPopup is true, set a timeout to hide the popup after 2 seconds
    setTimeout(() => {
      emits('showPopup', false);
    }, 5000);
  }
});

</script>

<template>

<TransitionRoot :show="showPopupComputed" class="transition-opacity duration-150">
  <TransitionChild
    enter="transition-opacity duration-500 ease-out"
    enter-from="opacity-0"
    enter-to="opacity-100"
    leave="transition-opacity duration-500 ease-in"
    leave-from="opacity-100"
    leave-to="opacity-0"
  >

  <div>
      <div v-if="messageType == 'alert'" class="flex p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
          <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
          <span class="sr-only">Info</span>
          <div>
              <span class="font-medium">Info:</span> <slot name="message"> Change a few things up and try submitting again. </slot>
          </div>
      </div>
      <div v-if="messageType == 'danger'" class="flex p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
        <span class="sr-only">Info</span>
        <div>
          <span class="font-medium">Danger:</span> <slot name="message"> Change a few things up and try submitting again. </slot>
        </div>
      </div>
      <div v-if="messageType == 'success'" class="flex p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
        <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
        <span class="sr-only">Info</span>
        <div>
          <span class="font-medium">Success:</span> <slot name="message"> Change a few things up and try submitting again. </slot>
        </div>
      </div>
      <div v-if="messageType == 'warning'" class="flex p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
        <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
        <span class="sr-only">Info</span>
        <div>
          <span class="font-medium">Warning:</span> <slot name="message"> Change a few things up and try submitting again. </slot>
        </div>
      </div>
  </div>
  </TransitionChild>
</TransitionRoot>

</template>

<style scoped>

</style>