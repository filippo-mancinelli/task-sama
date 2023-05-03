<script setup>
import { useArgStore } from '../../stores/useArgStore'
import { watchEffect, ref } from 'vue';

const argStore = useArgStore();
const value = ref('');

watchEffect(() => {
    argStore.pushArg({ key: 'textInput', value: value.value });
});
</script>

<template>
    <div class="form-control py-2">
        <label class="label">
            <span class="label-text text-lg "><slot name="text-input">Default title</slot></span>
        </label>

        <input v-model="value" type="text" placeholder="Your title" class="input input-bordered placeholder:text-base w-full border-orange-400 outline-orange-400" />
    </div>
</template>

<style>

</style>
