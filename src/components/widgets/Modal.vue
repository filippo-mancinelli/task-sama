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
});

</script>

<template> 
<Teleport to="body">
    <Transition name="fade">
        <div v-if="showModal" class="w-full sticky z-50">
            <div class="modal" :class="{ 'modal-open': showModal }">
                <div class="modal-box w-3/4 h-auto relative flex flex-col justify-center">
                    <button @click="$emit('closeModal')" class="btn btn-sm btn-circle absolute right-2 top-2 bg-orange-400 border-orange-400">✕</button>
                    
                    <div v-if="modalType !== ''" class="py-4 flex justify-center rounded-lg" :class="modalClass">
                        <CheckCircleIcon v-if="modalType == 'success'" class="h-14 w-14 text-white" />
                        <ExclamationCircleIcon v-if="modalType == 'danger'" class="h-14 w-14 text-white" />
                    </div>
                    <div>
                        <h3 class="text-lg font-bold mt-2">
                            <span v-if="modalType == 'success'">Success!</span>
                            <span v-else-if="modalType == 'danger'">Error!</span>
                            <span v-else>
                                <slot name="title">Default title</slot>
                            </span>
                        </h3>
                    </div>
                    <slot name="content">Default content</slot>

                    <div class="flex justify-end">
                        <button v-if="modalType !==''" @click="$emit('closeModal')" class="btn w-20 h-10 bg-orange-400">Ok</button>
                    </div>
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