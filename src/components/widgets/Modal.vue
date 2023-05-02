<script setup>
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid';
import { ref, watchEffect } from 'vue';

const props = defineProps(['showModal', 'modalType']);
const modalClass = ref('');

watchEffect(() => {
    switch(props.modalType) {
        case '':
            modalClass.value = 'bg-orange-100';
            break;
        case 'success':
            modalClass.value = 'bg-green-300';
            break;
        case 'danger':
            modalClass.value = 'bg-red-500';
            break;
    }
    console.log("watcheffect",modalClass.value)
});

</script>

<template>  <div v-if="modalType == 'success'">AAAAAAAAAAAAAA</div>
        <div v-if="showModal" class="w-full ">
            <div class="modal" :class="{ 'modal-open': showModal }">
                <div :class="`modal-box w-3/4 h-auto relative flex flex-col ${modalClass.value}`">
                    <button @click="$emit('closeModal')" class="btn btn-sm btn-circle absolute right-2 top-2 bg-orange-400 border-orange-400">✕</button>
                    <div v-if="modalType !== ''" class="py-2">
                        <CheckCircleIcon v-if="modalType == 'success'" class="h-6 w-6 text-white" />
                        <ExclamationCircleIcon v-if="modalType == 'danger'" class="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 class="text-lg font-bold"><slot name="title">Default title</slot></h3>
                    </div>
                    <slot name="content">Default content</slot>
                </div>
            </div>
        </div>
</template>

<style scoped>

</style>