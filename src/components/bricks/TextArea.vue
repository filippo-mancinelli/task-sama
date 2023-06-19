<script setup>
import Error from './Error.vue';
import { useArgStore } from '../../stores/useArgStore'
import { watchEffect, ref, defineProps, toRef } from 'vue';

const argStore = useArgStore();
const props = defineProps(['showError', 'errorMessage']);
const showErrorRef = toRef(props, 'showError')
const value = ref('');

watchEffect(() => {
    argStore.pushArg({ key: 'textArea', value: value.value });
});

</script>

<template>
    <div class="flex form-control py-2">
        <label class="label">
            <span class="label-text text-lg"><slot name="text-area">Default text-area</slot></span>
        </label>
        <textarea v-model="value" class="textarea textarea-warning placeholder:text-base  w-full focus:ring-orange-400 focus:border-orange-400 border border-orange-400 outline-orange-400 outline-offset-4" placeholder="Tell participants what to do..."> </textarea>
        <Error :showError="showErrorRef"> <template v-slot:error> {{ errorMessage }} </template> </Error>
    </div>
</template>