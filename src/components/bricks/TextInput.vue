<script setup>
import Error from './Error.vue';
import { useArgStore } from '../../stores/useArgStore'
import { watchEffect, ref, defineProps } from 'vue';

const argStore = useArgStore();
const value = ref('');
const props = defineProps(['showError', 'errorMessage', 'maxLength']);

watchEffect(() => {
    argStore.pushArg({ key: 'textInput', value: value.value });
});
</script>

<template>
    <div class="form-control py-2">
        <label class="label">
            <span class="label-text text-lg "><slot name="text-input">Default title</slot></span>
        </label>
        <input v-model="value" type="text" :maxlength="maxLength" placeholder="Your title" class="input input-bordered placeholder:text-base w-full focus:ring-orange-400 focus:border-orange-400 border border-orange-400 outline-orange-400 outline-offset-4" />
        <Error :showError="showError"> <template v-slot:error> {{ errorMessage }} </template> </Error>
    </div>
</template>

<style>

</style>
