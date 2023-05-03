<script setup>
import NumberInput from './NumberInput.vue';
import Error from './Error.vue'
import { ref, defineProps } from 'vue';

const props = defineProps(['showError', 'errorMessage']);

</script>

<template>
<div class="flex flex-col">
    <NumberInput> 
        <template v-slot:title> <slot name="title">Default tokenAmount title</slot> </template>
        <template v-slot:currency> GLMR </template>
    </NumberInput>
    <Error :showError="showError" class=""> <template v-slot:error> {{ errorMessage }} </template> </Error>
</div>
</template>