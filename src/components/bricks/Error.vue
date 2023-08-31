<script setup>
const props = defineProps(['showError']);

</script>

<template>
    <Transition name="error">
    <div v-if="showError" class="alert alert-error shadow-lg form-control w-60 py-1 mt-2 " style="font-size: 0.8rem;">
        <div class="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current h-4 w-4" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span><slot name="error">Error! something went wrong.</slot></span>
        </div>
    </div>
    </Transition>
</template>

<style scoped>
.error-enter-active,
.error-leave-active {
    transition: opacity 0.2s;
}

.error-enter-from,
.error-leave-to {
    opacity: 0;
}
</style>