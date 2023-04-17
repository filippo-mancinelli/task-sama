<script setup>
import { useConnectionStore } from '../stores/useConnectionStore';
import { ref } from 'vue';

const props = defineProps(['showModal']);

</script>

<template>
    <div class="w-full ">
        <!-- this input must be before the v-if. The opening/closing is handled via CSS with modal-toggle class -->
        <input type="checkbox" id="my-modal-3" class="modal-toggle" />
        <div v-if="showModal" class="modal">
            <div class="modal-box w-3/4 h-auto relative bg-orange-100 flex flex-col">
                <button class="btn btn-sm btn-circle absolute right-2 top-2">✕</button>
                <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2 bg-orange-400 border-orange-400">✕</label>
                <h3 class="text-lg font-bold"><slot name="title">Default title</slot></h3>
                <slot name="content">Default content</slot>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>