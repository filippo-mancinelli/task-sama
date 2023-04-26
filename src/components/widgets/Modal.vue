<script setup>
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid';
import { computed, defineEmits, ref, watch } from 'vue';

const props = defineProps(['showModal', 'modalType']);
const emits = defineEmits(['closeModal']);
const showModalRef = ref(props.showModal);
const modalClass = ref('');

const showModalComputed = computed(()=>{ return props.showModal });
const modalTypeComputed = computed(()=>{ return props.modalType });

watch(showModalComputed, () => {
    showModalRef.value = !showModalRef.value;
    console.log("showModal: ", showModalRef.value);
});

watch(modalTypeComputed, (value) => {
    console.log("value",value)
    switch(value) {
        case '':
            modalClass.value = 'bg-orange-100';
            break;
        case 'danger':
            modalClass.value = 'bg-green-400';
            break;
        case 'success':
            modalClass.value = 'bg-red-500';
            break;
    }
    console.log("type: ", modalClass.value);
});

function closeModal(){
    showModalRef.value = false;
    console.log(showModalRef.value)
    emits('showModal', false);
}

</script>

<template>
    <div v-if="showModalRef.value" class="w-full ">
        <div class="modal">
            <div :class="`modal-box w-3/4 h-auto relative flex flex-col ${modalClass.value}`">
                <button @click="closeModal" class="btn btn-sm btn-circle absolute right-2 top-2 bg-orange-400 border-orange-400">✕</button>
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